import { useEffect, useRef, useState } from 'react';
import { botDetectionService, BehaviorMetrics } from '../services/botDetection';

interface BotDetectionHook {
  isBot: boolean;
  suspicionScore: number;
  flags: string[];
  metrics: BehaviorMetrics | null;
  performCheck: () => { isBot: boolean; score: number; flags: string[] };
}

export const useBotDetection = (enabled: boolean = true): BotDetectionHook => {
  const [isBot, setIsBot] = useState(false);
  const [suspicionScore, setSuspicionScore] = useState(0);
  const [flags, setFlags] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<BehaviorMetrics | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Start tracking when component mounts
    if (!hasStartedRef.current) {
      botDetectionService.startTracking();
      hasStartedRef.current = true;
    }

    // Perform periodic checks every 30 seconds
    checkIntervalRef.current = setInterval(() => {
      const result = botDetectionService.performRealTimeCheck();
      setIsBot(result.isBot);
      setSuspicionScore(result.score);
      setFlags(result.flags);
      setMetrics(botDetectionService.getMetrics());

      // Log suspicious behavior
      if (result.isBot && result.score > 70) {
        console.warn('[BotDetection] High suspicion score detected:', {
          score: result.score,
          flags: result.flags
        });
      }
    }, 30000); // Every 30 seconds

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [enabled]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (hasStartedRef.current) {
        botDetectionService.stopTracking();
        hasStartedRef.current = false;
      }
    };
  }, []);

  const performCheck = () => {
    const result = botDetectionService.performRealTimeCheck();
    setIsBot(result.isBot);
    setSuspicionScore(result.score);
    setFlags(result.flags);
    setMetrics(botDetectionService.getMetrics());
    return result;
  };

  return {
    isBot,
    suspicionScore,
    flags,
    metrics,
    performCheck
  };
};
