import express from "express";
import { advancedRateLimiter } from "../services/advancedRateLimiter";

const router = express.Router();

// Get rate limiter statistics
router.get("/rate-limiter/stats", (req, res) => {
  try {
    const stats = advancedRateLimiter.getStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: "Failed to get rate limiter stats",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Emergency cleanup (only for critical memory issues)
router.post("/rate-limiter/emergency-cleanup", (req, res) => {
  try {
    advancedRateLimiter.emergencyCleanup();
    res.json({ 
      success: true, 
      message: "Emergency cleanup completed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: "Failed to perform emergency cleanup",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Health check with memory info
router.get("/health", (req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)} minutes`,
    memoryUsage: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    },
    rateLimiter: advancedRateLimiter.getStats()
  });
});

export default router;
