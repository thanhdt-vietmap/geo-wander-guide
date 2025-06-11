import express from "express";
import { healthController, usersController } from "../controllers/apiController";
import { botDetectionController } from "../controllers/botDetectionController";
import { advancedRateLimiter } from "../services/advancedRateLimiter";
import { getValidClientIP } from "../utils/ipValidation";

const router = express.Router();

router.get("/health", healthController);
router.get("/users", usersController);

// Bot detection routes
router.post("/bot-detection", botDetectionController.recordBotDetection);

// Rate limit info for current user
router.get("/rate-limit/status", (req, res) => {
  try {
    const ip = getValidClientIP(req);
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        error: "Unable to determine client IP address"
      });
    }

    const limitInfo = advancedRateLimiter.getIPLimitInfo(ip);
    
    // Return a simplified version for public API
    const publicInfo = {
      ip: limitInfo.ip,
      limits: {
        maxRequestsPerWindow: limitInfo.limits.maxRequestsPerWindow,
        windowSizeMs: limitInfo.limits.windowSizeMs,
        dailyRequestLimit: limitInfo.limits.effectiveDailyLimit
      },
      current: {
        requestCount: limitInfo.current.requestCount,
        dailyCount: limitInfo.current.dailyCount
      },
      status: {
        canMakeRequest: limitInfo.status.canMakeRequest,
        rateLimitExceeded: limitInfo.status.rateLimitExceeded,
        dailyLimitExceeded: limitInfo.status.dailyLimitExceeded,
        isQueued: limitInfo.status.isQueued
      },
      usage: limitInfo.usage,
      timestamps: {
        nextWindowReset: limitInfo.timestamps.nextWindowReset,
        nextDailyReset: limitInfo.timestamps.nextDailyReset
      }
    };
    
    res.json({
      success: true,
      data: publicInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: "Failed to get rate limit status",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
