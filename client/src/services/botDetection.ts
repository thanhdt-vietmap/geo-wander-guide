// Bot Detection Service - Phát hiện automation browser và hành vi nghi vấn
export interface MouseMovement {
  x: number;
  y: number;
  timestamp: number;
  deltaX?: number;
  deltaY?: number;
  velocity?: number;
  acceleration?: number;
}

export interface Keystroke {
  key: string;
  timestamp: number;
  duration?: number;
  interval?: number;
}

export interface ScrollEvent {
  deltaY: number;
  timestamp: number;
  velocity?: number;
  acceleration?: number;
}

export interface FormFillData {
  fieldId: string;
  startTime: number;
  endTime: number;
  keystrokes: Keystroke[];
  pauses: number[];
  corrections: number;
}

export interface BehaviorMetrics {
  mouseMovements: MouseMovement[];
  keystrokes: Keystroke[];
  scrollEvents: ScrollEvent[];
  formFills: FormFillData[];
  pageVisits: Array<{
    url: string;
    enterTime: number;
    exitTime: number;
    duration: number;
  }>;
  suspicionScore: number;
  flags: string[];
}

class BotDetectionService {
  private static instance: BotDetectionService;
  private metrics: BehaviorMetrics;
  private isTracking: boolean = false;
  private currentFormFill: FormFillData | null = null;
  private pageEnterTime: number = Date.now();
  
  // Detection thresholds
  private readonly THRESHOLDS = {
    MIN_FORM_FILL_TIME: 2000, // 2 giây
    MAX_TYPING_UNIFORMITY: 0.15, // Coefficient of variation
    MIN_MOUSE_VARIANCE: 0.5,
    MIN_PAGE_VIEW_TIME: 1000, // 1 giây
    MAX_SCROLL_UNIFORMITY: 0.2,
    MIN_NATURAL_PAUSES: 3, // Số lần dừng tự nhiên khi gõ
    MAX_WPM: 120, // Words per minute
    MIN_CORRECTION_RATIO: 0.02, // Tỷ lệ sửa lỗi tự nhiên
  };

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.setupEventListeners();
  }

  public static getInstance(): BotDetectionService {
    if (!BotDetectionService.instance) {
      BotDetectionService.instance = new BotDetectionService();
    }
    return BotDetectionService.instance;
  }

  private initializeMetrics(): BehaviorMetrics {
    return {
      mouseMovements: [],
      keystrokes: [],
      scrollEvents: [],
      formFills: [],
      pageVisits: [],
      suspicionScore: 0,
      flags: []
    };
  }

  public startTracking(): void {
    this.isTracking = true;
    this.pageEnterTime = Date.now();
    console.log('[BotDetection] Tracking started');
  }

  public stopTracking(): void {
    this.isTracking = false;
    this.recordPageVisit();
    console.log('[BotDetection] Tracking stopped');
  }

  private setupEventListeners(): void {
    // Mouse movement tracking
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true });
    
    // Keyboard tracking
    document.addEventListener('keydown', this.handleKeyDown.bind(this), { passive: true });
    document.addEventListener('keyup', this.handleKeyUp.bind(this), { passive: true });
    
    // Scroll tracking
    document.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    
    // Form tracking
    document.addEventListener('focusin', this.handleFormFocus.bind(this));
    document.addEventListener('focusout', this.handleFormBlur.bind(this));
    
    // Page visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Page unload
    window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isTracking) return;

    const now = Date.now();
    const lastMovement = this.metrics.mouseMovements[this.metrics.mouseMovements.length - 1];
    
    const movement: MouseMovement = {
      x: event.clientX,
      y: event.clientY,
      timestamp: now
    };

    if (lastMovement) {
      movement.deltaX = movement.x - lastMovement.x;
      movement.deltaY = movement.y - lastMovement.y;
      
      const timeDelta = now - lastMovement.timestamp;
      const distance = Math.sqrt(movement.deltaX ** 2 + movement.deltaY ** 2);
      movement.velocity = distance / timeDelta;
      
      if (this.metrics.mouseMovements.length > 1) {
        const prevVelocity = lastMovement.velocity || 0;
        movement.acceleration = (movement.velocity - prevVelocity) / timeDelta;
      }
    }

    this.metrics.mouseMovements.push(movement);
    
    // Keep only last 1000 movements for performance
    if (this.metrics.mouseMovements.length > 1000) {
      this.metrics.mouseMovements.shift();
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isTracking) return;

    const keystroke: Keystroke = {
      key: event.key,
      timestamp: Date.now()
    };

    const lastKeystroke = this.metrics.keystrokes[this.metrics.keystrokes.length - 1];
    if (lastKeystroke) {
      keystroke.interval = keystroke.timestamp - lastKeystroke.timestamp;
    }

    this.metrics.keystrokes.push(keystroke);
    
    // Track for current form fill
    if (this.currentFormFill) {
      this.currentFormFill.keystrokes.push(keystroke);
      
      // Detect corrections (backspace, delete)
      if (event.key === 'Backspace' || event.key === 'Delete') {
        this.currentFormFill.corrections++;
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.isTracking) return;

    const lastKeystroke = this.metrics.keystrokes[this.metrics.keystrokes.length - 1];
    if (lastKeystroke && lastKeystroke.key === event.key && !lastKeystroke.duration) {
      lastKeystroke.duration = Date.now() - lastKeystroke.timestamp;
    }
  }

  private handleScroll(event: Event): void {
    if (!this.isTracking) return;

    const scrollEvent: ScrollEvent = {
      deltaY: window.scrollY,
      timestamp: Date.now()
    };

    const lastScroll = this.metrics.scrollEvents[this.metrics.scrollEvents.length - 1];
    if (lastScroll) {
      const timeDelta = scrollEvent.timestamp - lastScroll.timestamp;
      const scrollDelta = scrollEvent.deltaY - lastScroll.deltaY;
      scrollEvent.velocity = scrollDelta / timeDelta;
      
      if (this.metrics.scrollEvents.length > 1) {
        const prevVelocity = lastScroll.velocity || 0;
        scrollEvent.acceleration = (scrollEvent.velocity - prevVelocity) / timeDelta;
      }
    }

    this.metrics.scrollEvents.push(scrollEvent);
    
    // Keep only last 500 scroll events
    if (this.metrics.scrollEvents.length > 500) {
      this.metrics.scrollEvents.shift();
    }
  }

  private handleFormFocus(event: Event): void {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      const formElement = target as HTMLInputElement | HTMLTextAreaElement;
      this.currentFormFill = {
        fieldId: target.id || formElement.name || `${target.tagName}-${Date.now()}`,
        startTime: Date.now(),
        endTime: 0,
        keystrokes: [],
        pauses: [],
        corrections: 0
      };
    }
  }

  private handleFormBlur(event: Event): void {
    if (this.currentFormFill) {
      this.currentFormFill.endTime = Date.now();
      
      // Calculate pauses (gaps > 500ms in typing)
      const keystrokes = this.currentFormFill.keystrokes;
      for (let i = 1; i < keystrokes.length; i++) {
        const gap = keystrokes[i].timestamp - keystrokes[i-1].timestamp;
        if (gap > 500) {
          this.currentFormFill.pauses.push(gap);
        }
      }
      
      this.metrics.formFills.push({ ...this.currentFormFill });
      this.currentFormFill = null;
    }
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.recordPageVisit();
    } else {
      this.pageEnterTime = Date.now();
    }
  }

  private handlePageUnload(): void {
    this.recordPageVisit();
    this.sendDetectionResults();
  }

  private recordPageVisit(): void {
    const exitTime = Date.now();
    const duration = exitTime - this.pageEnterTime;
    
    this.metrics.pageVisits.push({
      url: window.location.href,
      enterTime: this.pageEnterTime,
      exitTime,
      duration
    });
  }

  // Analysis methods
  public analyzeMouseBehavior(): { isBot: boolean; reasons: string[] } {
    const movements = this.metrics.mouseMovements;
    const reasons: string[] = [];
    
    if (movements.length < 10) {
      reasons.push('Insufficient mouse movement data');
      return { isBot: true, reasons };
    }

    // 1. Check for linear/robotic movements
    const velocities = movements.filter(m => m.velocity !== undefined).map(m => m.velocity!);
    const velocityVariance = this.calculateVariance(velocities);
    
    if (velocityVariance < this.THRESHOLDS.MIN_MOUSE_VARIANCE) {
      reasons.push('Mouse movement too uniform (robotic pattern)');
    }

    // 2. Check for sudden direction changes (natural mouse movement)
    let directionChanges = 0;
    for (let i = 2; i < movements.length; i++) {
      const prev = movements[i-1];
      const curr = movements[i];
      if (prev.deltaX && curr.deltaX && prev.deltaY && curr.deltaY) {
        const prevAngle = Math.atan2(prev.deltaY, prev.deltaX);
        const currAngle = Math.atan2(curr.deltaY, curr.deltaX);
        const angleDiff = Math.abs(prevAngle - currAngle);
        if (angleDiff > Math.PI / 4) { // 45 degrees
          directionChanges++;
        }
      }
    }
    
    const naturalChangeRatio = directionChanges / movements.length;
    if (naturalChangeRatio < 0.1) {
      reasons.push('Too few natural direction changes in mouse movement');
    }

    // 3. Check for perfect curves (bezier-like movements are suspicious)
    const accelerations = movements.filter(m => m.acceleration !== undefined).map(m => m.acceleration!);
    if (accelerations.length > 0) {
      const avgAcceleration = accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
      if (Math.abs(avgAcceleration) < 0.001) {
        reasons.push('Mouse acceleration too consistent (automated)');
      }
    }

    return { isBot: reasons.length > 0, reasons };
  }

  public analyzeTypingBehavior(): { isBot: boolean; reasons: string[] } {
    const keystrokes = this.metrics.keystrokes;
    const reasons: string[] = [];
    
    if (keystrokes.length < 5) {
      return { isBot: false, reasons: ['Insufficient typing data'] };
    }

    // 1. Check typing rhythm uniformity
    const intervals = keystrokes.filter(k => k.interval !== undefined).map(k => k.interval!);
    if (intervals.length > 2) {
      const intervalVariance = this.calculateVariance(intervals);
      const coefficientOfVariation = Math.sqrt(intervalVariance) / (intervals.reduce((a, b) => a + b, 0) / intervals.length);
      
      if (coefficientOfVariation < this.THRESHOLDS.MAX_TYPING_UNIFORMITY) {
        reasons.push('Typing rhythm too uniform (bot-like)');
      }
    }

    // 2. Check typing speed
    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const wpm = 60000 / (avgInterval * 5); // Assume 5 chars per word
      
      if (wpm > this.THRESHOLDS.MAX_WPM) {
        reasons.push(`Typing speed too fast: ${Math.round(wpm)} WPM`);
      }
    }

    // 3. Check for natural pauses and corrections
    const formFills = this.metrics.formFills;
    for (const form of formFills) {
      const duration = form.endTime - form.startTime;
      const charCount = form.keystrokes.length;
      
      if (duration < this.THRESHOLDS.MIN_FORM_FILL_TIME && charCount > 10) {
        reasons.push(`Form filled too quickly: ${duration}ms for ${charCount} characters`);
      }
      
      if (form.pauses.length < this.THRESHOLDS.MIN_NATURAL_PAUSES && charCount > 20) {
        reasons.push('Too few natural pauses while typing');
      }
      
      const correctionRatio = form.corrections / Math.max(charCount, 1);
      if (correctionRatio < this.THRESHOLDS.MIN_CORRECTION_RATIO && charCount > 20) {
        reasons.push('No typing corrections (unnatural)');
      }
    }

    return { isBot: reasons.length > 0, reasons };
  }

  public analyzeScrollBehavior(): { isBot: boolean; reasons: string[] } {
    const scrollEvents = this.metrics.scrollEvents;
    const reasons: string[] = [];
    
    if (scrollEvents.length < 5) {
      return { isBot: false, reasons: ['Insufficient scroll data'] };
    }

    // Check scroll uniformity
    const velocities = scrollEvents.filter(s => s.velocity !== undefined).map(s => s.velocity!);
    if (velocities.length > 2) {
      const velocityVariance = this.calculateVariance(velocities);
      const coefficientOfVariation = Math.sqrt(velocityVariance) / Math.abs(velocities.reduce((a, b) => a + b, 0) / velocities.length);
      
      if (coefficientOfVariation < this.THRESHOLDS.MAX_SCROLL_UNIFORMITY) {
        reasons.push('Scroll pattern too uniform (automated)');
      }
    }

    // Check for linear scrolling (bots often scroll at constant speed)
    let constantSpeedCount = 0;
    for (let i = 1; i < scrollEvents.length; i++) {
      const current = scrollEvents[i];
      const previous = scrollEvents[i-1];
      
      if (current.velocity !== undefined && previous.velocity !== undefined) {
        const velocityDiff = Math.abs(current.velocity - previous.velocity);
        if (velocityDiff < 0.1) {
          constantSpeedCount++;
        }
      }
    }
    
    const constantSpeedRatio = constantSpeedCount / scrollEvents.length;
    if (constantSpeedRatio > 0.8) {
      reasons.push('Scroll speed too constant (bot-like)');
    }

    return { isBot: reasons.length > 0, reasons };
  }

  public analyzePageViewBehavior(): { isBot: boolean; reasons: string[] } {
    const pageVisits = this.metrics.pageVisits;
    const reasons: string[] = [];
    
    for (const visit of pageVisits) {
      if (visit.duration < this.THRESHOLDS.MIN_PAGE_VIEW_TIME) {
        reasons.push(`Page view too short: ${visit.duration}ms on ${visit.url}`);
      }
    }

    return { isBot: reasons.length > 0, reasons };
  }

  public calculateSuspicionScore(): number {
    const mouseAnalysis = this.analyzeMouseBehavior();
    const typingAnalysis = this.analyzeTypingBehavior();
    const scrollAnalysis = this.analyzeScrollBehavior();
    const pageAnalysis = this.analyzePageViewBehavior();

    let score = 0;
    const flags: string[] = [];

    // Weight different behaviors
    if (mouseAnalysis.isBot) {
      score += 25;
      flags.push(...mouseAnalysis.reasons);
    }
    
    if (typingAnalysis.isBot) {
      score += 35; // Typing is most important
      flags.push(...typingAnalysis.reasons);
    }
    
    if (scrollAnalysis.isBot) {
      score += 20;
      flags.push(...scrollAnalysis.reasons);
    }
    
    if (pageAnalysis.isBot) {
      score += 20;
      flags.push(...pageAnalysis.reasons);
    }

    this.metrics.suspicionScore = score;
    this.metrics.flags = flags;

    return score;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  public getMetrics(): BehaviorMetrics {
    this.calculateSuspicionScore();
    return { ...this.metrics };
  }

  public isLikelyBot(): boolean {
    const score = this.calculateSuspicionScore();
    return score >= 50; // 50% suspicion threshold
  }

  private async sendDetectionResults(): Promise<void> {
    try {
      const metrics = this.getMetrics();
      
      // Only send if there's meaningful data
      if (metrics.mouseMovements.length > 5 || metrics.keystrokes.length > 3) {
        await fetch('/api/bot-detection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metrics: {
              suspicionScore: metrics.suspicionScore,
              flags: metrics.flags,
              mouseMovements: metrics.mouseMovements.length,
              keystrokes: metrics.keystrokes.length,
              scrollEvents: metrics.scrollEvents.length,
              formFills: metrics.formFills.length,
              pageVisits: metrics.pageVisits
            }
          })
        });
      }
    } catch (error) {
      console.error('[BotDetection] Failed to send results:', error);
    }
  }

  // Public method to manually check if current session looks like a bot
  public performRealTimeCheck(): { isBot: boolean; score: number; flags: string[] } {
    const score = this.calculateSuspicionScore();
    return {
      isBot: this.isLikelyBot(),
      score,
      flags: this.metrics.flags
    };
  }
}

export const botDetectionService = BotDetectionService.getInstance();
