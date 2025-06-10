import express from "express";
import { getValidClientIP, validateIP, logIPValidation } from "../utils/ipValidation";

interface BotDetectionData {
  metrics: {
    suspicionScore: number;
    flags: string[];
    mouseMovements: number;
    keystrokes: number;
    scrollEvents: number;
    formFills: number;
    pageVisits: Array<{
      url: string;
      enterTime: number;
      exitTime: number;
      duration: number;
    }>;
  };
}

interface BotDetectionStats {
  totalSessions: number;
  botSessions: number;
  suspiciousActivities: Map<string, number>;
  ipDetections: Map<string, {
    count: number;
    lastDetection: number;
    suspicionScore: number;
    flags: string[];
  }>;
}

class BotDetectionController {
  private static instance: BotDetectionController;
  private stats: BotDetectionStats;
  private readonly SUSPICION_THRESHOLD = 40; // Lowered from 50 for more aggressive detection
  private readonly HIGH_SUSPICION_THRESHOLD = 70; // Lowered from 80 for faster auto-disable
  private readonly AUTO_DISABLE_THRESHOLD = 60; // New threshold for immediate blocking

  private constructor() {
    this.stats = {
      totalSessions: 0,
      botSessions: 0,
      suspiciousActivities: new Map(),
      ipDetections: new Map()
    };
  }

  public static getInstance(): BotDetectionController {
    if (!BotDetectionController.instance) {
      BotDetectionController.instance = new BotDetectionController();
    }
    return BotDetectionController.instance;
  }

  public recordBotDetection = (req: express.Request, res: express.Response): void => {
    try {
      const clientIP = getValidClientIP(req);
      
      // Skip bot detection for invalid/private IPs (like localhost during development)
      if (!clientIP) {
        if (process.env.NODE_ENV === 'development') {
          logIPValidation(req.ip || req.socket?.remoteAddress || 'unknown', 'BotDetection');
        }
        res.json({
          success: true,
          result: {
            isBot: false,
            suspicionScore: 0,
            severity: 'low',
            timestamp: new Date().toISOString(),
            skipped: 'Invalid or private IP address'
          }
        });
        return;
      }
      
      const data: BotDetectionData = req.body;
      const { metrics } = data;

      this.stats.totalSessions++;

      // Log detection attempt
      console.log(`[BotDetection] Analysis for IP ${clientIP}:`, {
        score: metrics.suspicionScore,
        flags: metrics.flags,
        dataPoints: {
          mouse: metrics.mouseMovements,
          keyboard: metrics.keystrokes,
          scroll: metrics.scrollEvents,
          forms: metrics.formFills
        }
      });

      // Update IP-specific tracking
      const ipData = this.stats.ipDetections.get(clientIP) || {
        count: 0,
        lastDetection: 0,
        suspicionScore: 0,
        flags: []
      };

      ipData.count++;
      ipData.lastDetection = Date.now();
      ipData.suspicionScore = Math.max(ipData.suspicionScore, metrics.suspicionScore);
      ipData.flags = [...new Set([...ipData.flags, ...metrics.flags])];

      this.stats.ipDetections.set(clientIP, ipData);

      // Count suspicious activities
      metrics.flags.forEach(flag => {
        const count = this.stats.suspiciousActivities.get(flag) || 0;
        this.stats.suspiciousActivities.set(flag, count + 1);
      });

      // Determine if this is a bot
      const isBot = metrics.suspicionScore >= this.SUSPICION_THRESHOLD;
      const isHighSuspicion = metrics.suspicionScore >= this.HIGH_SUSPICION_THRESHOLD;
      const shouldAutoDisable = metrics.suspicionScore >= this.AUTO_DISABLE_THRESHOLD;

      if (isBot) {
        this.stats.botSessions++;
        
        console.warn(`[BotDetection] Bot detected from IP ${clientIP}:`, {
          score: metrics.suspicionScore,
          flags: metrics.flags,
          severity: isHighSuspicion ? 'HIGH' : 'MEDIUM',
          autoDisable: shouldAutoDisable
        });

        // Integrate with rate limiter - update bot suspicion score
        try {
          const { advancedRateLimiter } = require('../services/advancedRateLimiter');
          advancedRateLimiter.updateBotSuspicionScore(clientIP, metrics.suspicionScore, metrics.flags);
          
          // Auto-disable functionality: Immediately blacklist suspicious IPs
          if (shouldAutoDisable) {
            console.error(`[BotDetection] AUTO-DISABLE: Blacklisting IP ${clientIP} (score: ${metrics.suspicionScore})`);
            advancedRateLimiter.addToBlacklistDirect(clientIP);
          }
        } catch (error) {
          console.error('[BotDetection] Failed to update rate limiter bot score:', error);
        }

        // For high suspicion scores, take immediate action
        if (isHighSuspicion) {
          console.error(`[BotDetection] HIGH SUSPICION bot detected from IP ${clientIP} - Enhanced monitoring`);
        }
      }

      // Analyze page view patterns
      if (metrics.pageVisits && metrics.pageVisits.length > 0) {
        const shortVisits = metrics.pageVisits.filter(visit => visit.duration < 1000);
        if (shortVisits.length > 0) {
          console.log(`[BotDetection] Detected ${shortVisits.length} suspiciously short page visits from IP ${clientIP}`);
        }
      }

      // Response
      res.json({
        success: true,
        result: {
          isBot,
          suspicionScore: metrics.suspicionScore,
          severity: isHighSuspicion ? 'high' : isBot ? 'medium' : 'low',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('[BotDetection] Error processing detection data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process bot detection data'
      });
    }
  };

  public getBotStats = (req: express.Request, res: express.Response): void => {
    try {
      const botRate = this.stats.totalSessions > 0 
        ? (this.stats.botSessions / this.stats.totalSessions * 100).toFixed(2)
        : '0';

      // Get top suspicious activities
      const topActivities = Array.from(this.stats.suspiciousActivities.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      // Get most suspicious IPs
      const suspiciousIPs = Array.from(this.stats.ipDetections.entries())
        .filter(([ip, data]) => data.suspicionScore >= this.SUSPICION_THRESHOLD)
        .sort((a, b) => b[1].suspicionScore - a[1].suspicionScore)
        .slice(0, 20)
        .map(([ip, data]) => ({
          ip,
          suspicionScore: data.suspicionScore,
          detectionCount: data.count,
          lastDetection: new Date(data.lastDetection).toISOString(),
          flags: data.flags
        }));

      res.json({
        success: true,
        data: {
          overview: {
            totalSessions: this.stats.totalSessions,
            botSessions: this.stats.botSessions,
            botRate: `${botRate}%`,
            timestamp: new Date().toISOString()
          },
          topSuspiciousActivities: topActivities.map(([activity, count]) => ({
            activity,
            count
          })),
          suspiciousIPs,
          thresholds: {
            suspicion: this.SUSPICION_THRESHOLD,
            highSuspicion: this.HIGH_SUSPICION_THRESHOLD,
            autoDisable: this.AUTO_DISABLE_THRESHOLD
          }
        }
      });

    } catch (error) {
      console.error('[BotDetection] Error getting stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get bot detection stats'
      });
    }
  };

  public clearStats = (req: express.Request, res: express.Response): void => {
    try {
      this.stats = {
        totalSessions: 0,
        botSessions: 0,
        suspiciousActivities: new Map(),
        ipDetections: new Map()
      };

      console.log('[BotDetection] Stats cleared');
      
      res.json({
        success: true,
        message: 'Bot detection stats cleared',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[BotDetection] Error clearing stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear bot detection stats'
      });
    }
  };

  // Method to check if an IP should be considered suspicious
  public isIPSuspicious(ip: string): boolean {
    const ipData = this.stats.ipDetections.get(ip);
    return ipData ? ipData.suspicionScore >= this.SUSPICION_THRESHOLD : false;
  }

  // Method to get IP suspicion data
  public getIPSuspicionData(ip: string) {
    return this.stats.ipDetections.get(ip) || null;
  }
}

export const botDetectionController = BotDetectionController.getInstance();
