import express from "express";
import { CONFIG } from "../config/constants";
import { getValidClientIP, validateIP, logIPValidation } from "../utils/ipValidation";

interface RateLimitData {
  count: number;
  lastRequestTime: number;
  violations: number; // Number of times this IP hit the rate limit
  lastAccess: number; // Track last access for cleanup
  botSuspicionScore?: number; // Bot detection score
  isSuspiciousBot?: boolean; // Flag for bot behavior
  dailyCount: number; // Daily request count
  dailyResetTime: number; // Timestamp of last daily reset
}

interface QueuedRequest {
  req: express.Request;
  res: express.Response;
  next: express.NextFunction;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
  retryCount: number; // Track retry attempts
}

class AdvancedRateLimiter {
  private static instance: AdvancedRateLimiter;
  private rateLimitData: Map<string, RateLimitData> = new Map();
  private blacklist: Set<string> = new Set();
  private requestQueues: Map<string, QueuedRequest[]> = new Map();
  private processingQueues: Set<string> = new Set();
  private lastBlacklistReset: number = 0;
  private cleanupInterval: NodeJS.Timeout | undefined;
  
  // Memory protection constants
  private readonly MAX_TRACKED_IPS = 10000;
  private readonly MAX_TOTAL_QUEUED_REQUESTS = 1000;
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly DATA_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_RETRY_COUNT = 3;
  private readonly DAILY_REQUEST_LIMIT = 200; // Maximum requests per IP per day

  private constructor() {
    this.initializeBlacklistReset();
    this.initializeCleanup();
  }

  public static getInstance(): AdvancedRateLimiter {
    if (!AdvancedRateLimiter.instance) {
      AdvancedRateLimiter.instance = new AdvancedRateLimiter();
    }
    return AdvancedRateLimiter.instance;
  }

  private initializeCleanup(): void {
    // Cleanup old data every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  private performCleanup(): void {
    const now = Date.now();
    const beforeCleanup = {
      rateLimitData: this.rateLimitData.size,
      queues: this.requestQueues.size,
      blacklist: this.blacklist.size
    };

    // Check for memory pressure and trigger emergency cleanup if needed
    if (this.checkMemoryPressure()) {
      this.emergencyCleanup();
      return;
    }

    // Clean up old rate limit data
    for (const [ip, data] of this.rateLimitData.entries()) {
      if (now - data.lastAccess > this.DATA_TTL) {
        this.rateLimitData.delete(ip);
      }
    }

    // Clean up empty or old queues
    for (const [ip, queue] of this.requestQueues.entries()) {
      // Remove expired requests from queue
      const validRequests = queue.filter(req => {
        if (now - req.timestamp > CONFIG.RATE_LIMIT.REQUEST_TIMEOUT) {
          clearTimeout(req.timeoutId);
          if (!req.res.headersSent && !req.res.destroyed) {
            req.res.status(408).json({ error: "Request timeout during cleanup" });
          }
          return false;
        }
        return true;
      });

      if (validRequests.length === 0) {
        this.requestQueues.delete(ip);
        this.processingQueues.delete(ip);
      } else {
        this.requestQueues.set(ip, validRequests);
      }
    }

    // Memory protection: If we have too many tracked IPs, remove oldest ones
    if (this.rateLimitData.size > this.MAX_TRACKED_IPS) {
      const sortedByLastAccess = Array.from(this.rateLimitData.entries())
        .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
      
      const toRemove = sortedByLastAccess.slice(0, this.rateLimitData.size - this.MAX_TRACKED_IPS);
      toRemove.forEach(([ip]) => this.rateLimitData.delete(ip));
    }

    const afterCleanup = {
      rateLimitData: this.rateLimitData.size,
      queues: this.requestQueues.size,
      blacklist: this.blacklist.size
    };

    console.log(`[${new Date().toISOString()}] Cleanup completed:`, {
      before: beforeCleanup,
      after: afterCleanup,
      removed: {
        rateLimitData: beforeCleanup.rateLimitData - afterCleanup.rateLimitData,
        queues: beforeCleanup.queues - afterCleanup.queues
      },
      memoryUsage: {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`
      }
    });
  }

  private initializeBlacklistReset(): void {
    // Check for blacklist reset every 6 hours
    setInterval(() => {
      this.checkAndResetBlacklist();
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  private checkAndResetBlacklist(): void {
    const now = Date.now();
    const oneMonthInMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    // Auto-reset blacklist after 1 month
    if (this.lastBlacklistReset === 0) {
      // First time initialization
      this.lastBlacklistReset = now;
      return;
    }
    
    const timeSinceLastReset = now - this.lastBlacklistReset;
    
    if (timeSinceLastReset >= oneMonthInMs) {
      console.log(`[${new Date().toISOString()}] Auto-resetting blacklist after 1 month (${Math.floor(timeSinceLastReset / (24 * 60 * 60 * 1000))} days)`);
      this.blacklist.clear();
      // Reset violation counts
      this.rateLimitData.forEach((data) => {
        data.violations = 0;
      });
      this.lastBlacklistReset = now;
      
      console.log(`[${new Date().toISOString()}] Blacklist auto-reset completed. Next reset in 30 days.`);
    }
  }

  private getClientIP(req: express.Request): string | null {
    const validIP = getValidClientIP(req);
    
    if (process.env.NODE_ENV === 'development') {
      logIPValidation(validIP, 'RateLimiter');
    }
    
    return validIP;
  }

  private isBlacklisted(ip: string): boolean {
    return this.blacklist.has(ip);
  }

  private addToBlacklist(ip: string): void {
    this.blacklist.add(ip);
    console.log(`[${new Date().toISOString()}] IP ${ip} added to blacklist`);
  }

  private shouldReset(data: RateLimitData, currentTime: number): boolean {
    return (currentTime - data.lastRequestTime) > CONFIG.RATE_LIMIT.RESET_TIME;
  }

  private shouldResetDailyCount(data: RateLimitData, currentTime: number): boolean {
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return (currentTime - (data.dailyResetTime || 0)) > oneDayInMs;
  }

  private checkDailyLimit(ip: string): boolean {
    const currentTime = Date.now();
    const data = this.rateLimitData.get(ip) || {
      count: 0,
      lastRequestTime: currentTime,
      violations: 0,
      lastAccess: currentTime,
      dailyCount: 0,
      dailyResetTime: currentTime
    };

    // Reset daily count if 24 hours have passed
    if (this.shouldResetDailyCount(data, currentTime)) {
      data.dailyCount = 0;
      data.dailyResetTime = currentTime;
      console.log(`[${new Date().toISOString()}] Daily limit reset for IP ${ip}`);
    }

    // Apply stricter daily limits for suspicious bots
    let dailyLimit = this.DAILY_REQUEST_LIMIT;
    
    if (data.isSuspiciousBot || (data.botSuspicionScore && data.botSuspicionScore >= 40)) {
      // Reduce daily limit for suspicious bots by 75%
      dailyLimit = Math.floor(this.DAILY_REQUEST_LIMIT * 0.25);
      console.log(`[${new Date().toISOString()}] Applying stricter daily limit for suspicious bot IP ${ip}: ${dailyLimit} (suspicion score: ${data.botSuspicionScore || 0})`);
    } else if (data.botSuspicionScore && data.botSuspicionScore >= 20) {
      // Reduce daily limit for moderately suspicious IPs by 50%
      dailyLimit = Math.floor(this.DAILY_REQUEST_LIMIT * 0.5);
      console.log(`[${new Date().toISOString()}] Applying moderate daily limit for IP ${ip}: ${dailyLimit} (suspicion score: ${data.botSuspicionScore})`);
    }

    // Check if adding one more request would exceed the daily limit
    if (data.dailyCount >= dailyLimit) {
      console.log(`[${new Date().toISOString()}] Daily limit exceeded for IP ${ip}: ${data.dailyCount}/${dailyLimit} (suspicion: ${data.botSuspicionScore || 0})`);
      return false;
    }

    return true;
  }

  private incrementDailyCount(ip: string): void {
    const currentTime = Date.now();
    const data = this.rateLimitData.get(ip);
    if (data) {
      data.dailyCount += 1;
      data.lastAccess = currentTime;
      this.rateLimitData.set(ip, data);
    }
  }

  private incrementViolation(ip: string): void {
    const currentTime = Date.now();
    const data = this.rateLimitData.get(ip) || {
      count: 0,
      lastRequestTime: currentTime,
      violations: 0,
      lastAccess: currentTime,
      dailyCount: 0,
      dailyResetTime: currentTime
    };
    
    data.violations += 1;
    data.lastAccess = currentTime; // Update last access time
    this.rateLimitData.set(ip, data);
    
    console.log(`[${new Date().toISOString()}] IP ${ip} violation count: ${data.violations}`);
    
    if (data.violations >= CONFIG.RATE_LIMIT.BLACKLIST_THRESHOLD) {
      this.addToBlacklist(ip);
    }
  }

  private addToQueue(ip: string, req: express.Request, res: express.Response, next: express.NextFunction): boolean {
    // Check total queued requests across all IPs for memory protection
    const totalQueuedRequests = Array.from(this.requestQueues.values())
      .reduce((total, queue) => total + queue.length, 0);
    
    if (totalQueuedRequests >= this.MAX_TOTAL_QUEUED_REQUESTS) {
      console.log(`[${new Date().toISOString()}] Global queue limit reached (${totalQueuedRequests})`);
      return false;
    }

    if (!this.requestQueues.has(ip)) {
      this.requestQueues.set(ip, []);
    }

    const queue = this.requestQueues.get(ip)!;
    
    // Check queue size limit
    if (queue.length >= CONFIG.RATE_LIMIT.MAX_QUEUE_SIZE) {
      return false; // Queue is full
    }

    // Create timeout for this request
    const timeoutId = setTimeout(() => {
      this.removeFromQueue(ip, queuedRequest);
      if (!res.headersSent && !res.destroyed) {
        res.status(408).json({ error: "Request timeout" });
      }
    }, CONFIG.RATE_LIMIT.REQUEST_TIMEOUT);

    const queuedRequest: QueuedRequest = {
      req,
      res,
      next,
      timestamp: Date.now(),
      timeoutId,
      retryCount: 0
    };

    queue.push(queuedRequest);
    console.log(`[${new Date().toISOString()}] IP ${ip} added to queue. Queue size: ${queue.length}, Total queued: ${totalQueuedRequests + 1}`);

    // Process queue if not already processing
    if (!this.processingQueues.has(ip)) {
      this.processQueue(ip);
    }

    return true;
  }

  private removeFromQueue(ip: string, requestToRemove: QueuedRequest): void {
    const queue = this.requestQueues.get(ip);
    if (queue) {
      const index = queue.indexOf(requestToRemove);
      if (index > -1) {
        clearTimeout(requestToRemove.timeoutId);
        queue.splice(index, 1);
      }
      
      if (queue.length === 0) {
        this.requestQueues.delete(ip);
        this.processingQueues.delete(ip);
      }
    }
  }

  private async processQueue(ip: string): Promise<void> {
    if (this.processingQueues.has(ip)) {
      return; // Already processing this IP's queue
    }
    
    this.processingQueues.add(ip);
    let circuitBreakerCount = 0;
    const MAX_CIRCUIT_BREAKER_ATTEMPTS = 10; // Prevent infinite loops

    try {
      while (this.requestQueues.has(ip) && this.requestQueues.get(ip)!.length > 0) {
        // Circuit breaker to prevent infinite loops
        circuitBreakerCount++;
        if (circuitBreakerCount > MAX_CIRCUIT_BREAKER_ATTEMPTS) {
          console.log(`[${new Date().toISOString()}] Circuit breaker triggered for IP ${ip}, clearing queue`);
          this.clearIPQueue(ip);
          break;
        }

        const queue = this.requestQueues.get(ip)!;
        const queuedRequest = queue.shift();

        if (!queuedRequest) break;

        clearTimeout(queuedRequest.timeoutId);

        // Check if response is still valid (not closed)
        if (queuedRequest.res.headersSent || queuedRequest.res.destroyed) {
          continue;
        }

        // Check for retry limit
        if (queuedRequest.retryCount >= this.MAX_RETRY_COUNT) {
          console.log(`[${new Date().toISOString()}] Max retry count reached for IP ${ip}, dropping request`);
          if (!queuedRequest.res.headersSent && !queuedRequest.res.destroyed) {
            queuedRequest.res.status(429).json({ 
              error: "Too Many Requests", 
              message: "Maximum retry attempts exceeded"
            });
          }
          continue;
        }

        // Check rate limit again
        const canProceed = this.checkRateLimit(ip);
        
        if (canProceed) {
          // Process the request
          console.log(`[${new Date().toISOString()}] Processing queued request for IP ${ip} (retry: ${queuedRequest.retryCount})`);
          queuedRequest.next();
          
          // Add a small delay between processing requests
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Reset circuit breaker count on successful processing
          circuitBreakerCount = 0;
        } else {
          // Still rate limited, increment retry count and put back in queue
          queuedRequest.retryCount++;
          
          // Create new timeout for the retried request
          queuedRequest.timeoutId = setTimeout(() => {
            this.removeFromQueue(ip, queuedRequest);
            if (!queuedRequest.res.headersSent && !queuedRequest.res.destroyed) {
              queuedRequest.res.status(408).json({ error: "Request timeout after retry" });
            }
          }, CONFIG.RATE_LIMIT.REQUEST_TIMEOUT);
          
          queue.unshift(queuedRequest);
          
          // Wait for the rate limit window to reset, but use exponential backoff
          const backoffTime = Math.min(CONFIG.RATE_LIMIT.RESET_TIME * Math.pow(2, queuedRequest.retryCount), 60000);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error processing queue for IP ${ip}:`, error);
      this.clearIPQueue(ip);
    } finally {
      this.processingQueues.delete(ip);
    }
  }

  private clearIPQueue(ip: string): void {
    const queue = this.requestQueues.get(ip);
    if (queue) {
      // Clean up all timeouts and respond to any pending requests
      queue.forEach(queuedRequest => {
        clearTimeout(queuedRequest.timeoutId);
        if (!queuedRequest.res.headersSent && !queuedRequest.res.destroyed) {
          queuedRequest.res.status(503).json({ 
            error: "Service Unavailable", 
            message: "Queue processing failed"
          });
        }
      });
      this.requestQueues.delete(ip);
    }
    this.processingQueues.delete(ip);
  }

  private checkRateLimit(ip: string): boolean {
    const currentTime = Date.now();
    const data = this.rateLimitData.get(ip) || {
      count: 0,
      lastRequestTime: currentTime,
      violations: 0,
      lastAccess: currentTime,
      dailyCount: 0,
      dailyResetTime: currentTime
    };

    // Check daily limit first
    if (!this.checkDailyLimit(ip)) {
      return false; // Daily limit exceeded
    }

    // Reset count if time window has passed
    if (this.shouldReset(data, currentTime)) {
      data.count = 0;
      data.lastRequestTime = currentTime;
    }

    data.count += 1;
    data.lastAccess = currentTime; // Update last access time
    this.rateLimitData.set(ip, data);

    const withinRateLimit = data.count <= CONFIG.RATE_LIMIT.MAX_REQUESTS;

    // If request passes both daily and rate limits, increment daily count
    if (withinRateLimit) {
      this.incrementDailyCount(ip);
    }

    return withinRateLimit;
  }

  public middleware = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    const ip = this.getClientIP(req);
    
    if (!ip) {
      // Skip rate limiting for invalid/private IPs but allow request to proceed
      // This prevents blocking localhost during development
      console.log(`[${new Date().toISOString()}] Skipping rate limiting - no valid public IP found`);
      next();
      return;
    }

    // Check if IP is blacklisted
    if (this.isBlacklisted(ip)) {
      console.log(`[${new Date().toISOString()}] Blacklisted IP ${ip} attempted access`);
      res.status(403).json({ 
        error: "Access denied", 
        message: "Your IP has been blacklisted due to excessive rate limit violations"
      });
      return;
    }

    // Check for bot behavior indicators in request headers
    const userAgent = req.get('User-Agent') || '';
    const isHeadlessBrowser = this.detectHeadlessBrowser(userAgent);
    const isSuspiciousHeaders = this.analyzeSuspiciousHeaders(req);
    
    if (isHeadlessBrowser || isSuspiciousHeaders) {
      console.log(`[${new Date().toISOString()}] Suspicious bot indicators detected for IP ${ip}:`, {
        userAgent,
        isHeadlessBrowser,
        isSuspiciousHeaders
      });
      
      // Mark IP as suspicious bot
      const data = this.rateLimitData.get(ip) || {
        count: 0,
        lastRequestTime: Date.now(),
        violations: 0,
        lastAccess: Date.now(),
        dailyCount: 0,
        dailyResetTime: Date.now()
      };
      data.isSuspiciousBot = true;
      data.botSuspicionScore = (data.botSuspicionScore || 0) + 30;
      this.rateLimitData.set(ip, data);
    }

    // Check rate limit
    const canProceed = this.checkRateLimit(ip);

    if (canProceed) {
      // Request can proceed immediately
      next();
    } else {
      // Rate limit exceeded, increment violation and try to queue
      this.incrementViolation(ip);
      
      const queued = this.addToQueue(ip, req, res, next);
      
      if (!queued) {
        res.status(429).json({ 
          error: "Too Many Requests", 
          message: "Rate limit exceeded and queue is full"
        });
      }
      // If queued successfully, the request will be processed when possible
    }
  };

  private detectHeadlessBrowser(userAgent: string): boolean {
    const headlessIndicators = [
      'headless',
      'phantom',
      'selenium',
      'webdriver',
      'puppeteer',
      'playwright',
      'chrome-headless',
      'htmlunit',
      'jsdom'
    ];
    
    const lowerUserAgent = userAgent.toLowerCase();
    return headlessIndicators.some(indicator => lowerUserAgent.includes(indicator));
  }

  private analyzeSuspiciousHeaders(req: express.Request): boolean {
    // Check for missing common headers
    const commonHeaders = ['accept', 'accept-language', 'accept-encoding'];
    const missingHeaders = commonHeaders.filter(header => !req.get(header));
    
    if (missingHeaders.length > 1) {
      return true;
    }

    // Check for suspicious header values
    const acceptLanguage = req.get('accept-language');
    if (!acceptLanguage || acceptLanguage === 'en-US' || acceptLanguage.length < 5) {
      return true;
    }

    // Check for automation-specific headers
    const automationHeaders = [
      'x-requested-with',
      'x-automation',
      'webdriver',
      'selenium'
    ];
    
    return automationHeaders.some(header => req.get(header));
  }

  // Method to update bot suspicion score from client-side detection
  public updateBotSuspicionScore(ip: string, score: number, flags: string[]): void {
    const data = this.rateLimitData.get(ip) || {
      count: 0,
      lastRequestTime: Date.now(),
      violations: 0,
      lastAccess: Date.now(),
      dailyCount: 0,
      dailyResetTime: Date.now()
    };
    
    data.botSuspicionScore = Math.max(data.botSuspicionScore || 0, score);
    data.lastAccess = Date.now();
    
    // If high suspicion score, mark as suspicious bot
    if (score >= 80) {
      data.isSuspiciousBot = true;
      console.warn(`[${new Date().toISOString()}] High bot suspicion score (${score}) for IP ${ip}:`, flags);
    }
    
    this.rateLimitData.set(ip, data);
  }

  // Method to get rate limit info for a specific IP
  public getIPLimitInfo(ip: string): any {
    const currentTime = Date.now();
    const data = this.rateLimitData.get(ip);
    
    if (!data) {
      return {
        ip,
        exists: false,
        isBlacklisted: this.isBlacklisted(ip),
        limits: {
          maxRequestsPerWindow: CONFIG.RATE_LIMIT.MAX_REQUESTS,
          windowSizeMs: CONFIG.RATE_LIMIT.RESET_TIME,
          dailyRequestLimit: this.DAILY_REQUEST_LIMIT,
          blacklistThreshold: CONFIG.RATE_LIMIT.BLACKLIST_THRESHOLD
        },
        current: {
          requestCount: 0,
          dailyCount: 0,
          violations: 0,
          botSuspicionScore: 0,
          isSuspiciousBot: false
        },
        status: {
          canMakeRequest: !this.isBlacklisted(ip),
          rateLimitExceeded: false,
          dailyLimitExceeded: false,
          isQueued: false
        },
        timestamps: {
          lastRequest: null,
          lastAccess: null,
          dailyResetTime: null,
          nextReset: new Date(currentTime + CONFIG.RATE_LIMIT.RESET_TIME).toISOString()
        }
      };
    }

    // Check if current window should be reset
    const shouldResetWindow = this.shouldReset(data, currentTime);
    const shouldResetDaily = this.shouldResetDailyCount(data, currentTime);
    
    // Calculate effective daily limit based on bot suspicion
    let effectiveDailyLimit = this.DAILY_REQUEST_LIMIT;
    if (data.isSuspiciousBot || (data.botSuspicionScore && data.botSuspicionScore >= 40)) {
      effectiveDailyLimit = Math.floor(this.DAILY_REQUEST_LIMIT * 0.25);
    } else if (data.botSuspicionScore && data.botSuspicionScore >= 20) {
      effectiveDailyLimit = Math.floor(this.DAILY_REQUEST_LIMIT * 0.5);
    }

    // Check rate limits
    const currentCount = shouldResetWindow ? 0 : data.count;
    const dailyCount = shouldResetDaily ? 0 : data.dailyCount;
    const rateLimitExceeded = currentCount >= CONFIG.RATE_LIMIT.MAX_REQUESTS;
    const dailyLimitExceeded = dailyCount >= effectiveDailyLimit;
    const isQueued = this.requestQueues.has(ip) && this.requestQueues.get(ip)!.length > 0;
    const isBlacklisted = this.isBlacklisted(ip);

    return {
      ip,
      exists: true,
      isBlacklisted,
      limits: {
        maxRequestsPerWindow: CONFIG.RATE_LIMIT.MAX_REQUESTS,
        windowSizeMs: CONFIG.RATE_LIMIT.RESET_TIME,
        dailyRequestLimit: this.DAILY_REQUEST_LIMIT,
        effectiveDailyLimit,
        blacklistThreshold: CONFIG.RATE_LIMIT.BLACKLIST_THRESHOLD,
        maxQueueSize: CONFIG.RATE_LIMIT.MAX_QUEUE_SIZE
      },
      current: {
        requestCount: currentCount,
        dailyCount,
        violations: data.violations || 0,
        botSuspicionScore: data.botSuspicionScore || 0,
        isSuspiciousBot: data.isSuspiciousBot || false,
        queueSize: isQueued ? this.requestQueues.get(ip)!.length : 0
      },
      status: {
        canMakeRequest: !isBlacklisted && !rateLimitExceeded && !dailyLimitExceeded,
        rateLimitExceeded,
        dailyLimitExceeded,
        isQueued,
        isProcessing: this.processingQueues.has(ip)
      },
      usage: {
        windowUsagePercent: Math.round((currentCount / CONFIG.RATE_LIMIT.MAX_REQUESTS) * 100),
        dailyUsagePercent: Math.round((dailyCount / effectiveDailyLimit) * 100),
        remainingRequests: Math.max(0, CONFIG.RATE_LIMIT.MAX_REQUESTS - currentCount),
        remainingDailyRequests: Math.max(0, effectiveDailyLimit - dailyCount)
      },
      timestamps: {
        lastRequest: data.lastRequestTime ? new Date(data.lastRequestTime).toISOString() : null,
        lastAccess: data.lastAccess ? new Date(data.lastAccess).toISOString() : null,
        dailyResetTime: data.dailyResetTime ? new Date(data.dailyResetTime).toISOString() : null,
        nextWindowReset: shouldResetWindow ? 
          new Date(currentTime + CONFIG.RATE_LIMIT.RESET_TIME).toISOString() : 
          new Date(data.lastRequestTime + CONFIG.RATE_LIMIT.RESET_TIME).toISOString(),
        nextDailyReset: shouldResetDaily ? 
          new Date(currentTime + 24 * 60 * 60 * 1000).toISOString() : 
          new Date((data.dailyResetTime || currentTime) + 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }

  // Public methods for monitoring
  public getStats(): any {
    const totalQueuedRequests = Array.from(this.requestQueues.values())
      .reduce((total, queue) => total + queue.length, 0);
    
    const memoryUsage = process.memoryUsage();
    const oneMonthInMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    const nextBlacklistReset = this.lastBlacklistReset + oneMonthInMs;
    const daysUntilReset = Math.ceil((nextBlacklistReset - Date.now()) / (24 * 60 * 60 * 1000));
    
    // Calculate daily usage statistics
    const currentTime = Date.now();
    const dailyStats = Array.from(this.rateLimitData.entries())
      .map(([ip, data]) => ({
        ip,
        dailyCount: data.dailyCount || 0,
        dailyLimit: this.DAILY_REQUEST_LIMIT,
        dailyUsagePercent: Math.round(((data.dailyCount || 0) / this.DAILY_REQUEST_LIMIT) * 100),
        nextReset: data.dailyResetTime ? new Date(data.dailyResetTime + 24 * 60 * 60 * 1000).toISOString() : null,
        violations: data.violations || 0
      }))
      .filter(stat => stat.dailyCount > 0)
      .sort((a, b) => b.dailyCount - a.dailyCount)
      .slice(0, 20); // Top 20 IPs by daily usage
    
    return {
      blacklistedIPs: Array.from(this.blacklist),
      totalTrackedIPs: this.rateLimitData.size,
      totalQueues: this.requestQueues.size,
      totalQueuedRequests,
      dailyLimits: {
        requestsPerIP: this.DAILY_REQUEST_LIMIT,
        topUsers: dailyStats,
        totalActiveUsers: dailyStats.length
      },
      queueSizes: Array.from(this.requestQueues.entries()).map(([ip, queue]) => ({
        ip,
        queueSize: queue.length
      })),
      processingQueues: Array.from(this.processingQueues),
      blacklistInfo: {
        lastReset: new Date(this.lastBlacklistReset).toISOString(),
        nextReset: new Date(nextBlacklistReset).toISOString(),
        daysUntilReset: Math.max(0, daysUntilReset),
        autoResetEnabled: true,
        resetInterval: "30 days"
      },
      memoryLimits: {
        maxTrackedIPs: this.MAX_TRACKED_IPS,
        maxTotalQueuedRequests: this.MAX_TOTAL_QUEUED_REQUESTS,
        maxRetryCount: this.MAX_RETRY_COUNT,
        dailyRequestLimit: this.DAILY_REQUEST_LIMIT
      },
      memoryUsage: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      }
    };
  }

  // Private method for internal emergency blacklist reset only
  private clearBlacklistInternal(): void {
    this.blacklist.clear();
    this.rateLimitData.forEach((data) => {
      data.violations = 0;
    });
    this.lastBlacklistReset = Date.now();
    console.log(`[${new Date().toISOString()}] Blacklist cleared internally (emergency only)`);
  }

  // Emergency cleanup method for memory protection
  public emergencyCleanup(): void {
    console.log(`[${new Date().toISOString()}] Emergency cleanup initiated`);
    
    const beforeCleanup = {
      rateLimitData: this.rateLimitData.size,
      queues: this.requestQueues.size,
      totalQueuedRequests: Array.from(this.requestQueues.values())
        .reduce((total, queue) => total + queue.length, 0)
    };

    // Clear all queues and notify pending requests
    for (const [ip, queue] of this.requestQueues.entries()) {
      queue.forEach(queuedRequest => {
        clearTimeout(queuedRequest.timeoutId);
        if (!queuedRequest.res.headersSent && !queuedRequest.res.destroyed) {
          queuedRequest.res.status(503).json({ 
            error: "Service Unavailable", 
            message: "Emergency cleanup - please retry your request"
          });
        }
      });
    }
    
    // Clear all data structures
    this.requestQueues.clear();
    this.processingQueues.clear();
    
    // Keep only recent rate limit data (last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentData = new Map();
    
    for (const [ip, data] of this.rateLimitData.entries()) {
      if (data.lastAccess > oneHourAgo) {
        recentData.set(ip, data);
      }
    }
    
    this.rateLimitData = recentData;

    const afterCleanup = {
      rateLimitData: this.rateLimitData.size,
      queues: this.requestQueues.size,
      totalQueuedRequests: 0
    };

    console.log(`[${new Date().toISOString()}] Emergency cleanup completed:`, {
      before: beforeCleanup,
      after: afterCleanup,
      memoryUsage: process.memoryUsage()
    });

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log(`[${new Date().toISOString()}] Garbage collection forced`);
    }
  }

  // Memory pressure detection
  private checkMemoryPressure(): boolean {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const rssUsedMB = memoryUsage.rss / 1024 / 1024;
    
    // Trigger emergency cleanup if memory usage is high
    const MEMORY_PRESSURE_THRESHOLD_MB = 500; // 500MB
    
    if (heapUsedMB > MEMORY_PRESSURE_THRESHOLD_MB || rssUsedMB > MEMORY_PRESSURE_THRESHOLD_MB) {
      console.log(`[${new Date().toISOString()}] Memory pressure detected: heap=${heapUsedMB}MB, rss=${rssUsedMB}MB`);
      return true;
    }
    
    return false;
  }

  // Direct method to add IP to blacklist (for auto-disabling bots)
  public addToBlacklistDirect(ip: string): void {
    this.blacklist.add(ip);
    console.log(`[${new Date().toISOString()}] IP ${ip} directly added to blacklist (auto-disable)`);
    
    // Clear any pending requests for this IP
    const queue = this.requestQueues.get(ip);
    if (queue) {
      queue.forEach(queuedRequest => {
        clearTimeout(queuedRequest.timeoutId);
        if (!queuedRequest.res.headersSent && !queuedRequest.res.destroyed) {
          queuedRequest.res.status(403).json({ 
            error: "Access denied", 
            message: "Your IP has been blocked due to automated behavior detection"
          });
        }
      });
      this.requestQueues.delete(ip);
      this.processingQueues.delete(ip);
    }
  }

  // Shutdown cleanup
  public shutdown(): void {
    console.log(`[${new Date().toISOString()}] Rate limiter shutting down`);
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Clean up all pending requests
    for (const [ip, queue] of this.requestQueues.entries()) {
      queue.forEach(queuedRequest => {
        clearTimeout(queuedRequest.timeoutId);
        if (!queuedRequest.res.headersSent && !queuedRequest.res.destroyed) {
          queuedRequest.res.status(503).json({ 
            error: "Service Unavailable", 
            message: "Server is shutting down"
          });
        }
      });
    }
    
    this.requestQueues.clear();
    this.processingQueues.clear();
    this.rateLimitData.clear();
    this.blacklist.clear();
  }
}

export const advancedRateLimiter = AdvancedRateLimiter.getInstance();
