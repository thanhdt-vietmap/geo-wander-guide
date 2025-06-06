import express from "express";
import { advancedRateLimiter } from "../services/advancedRateLimiter";

// Simple rate limiter (legacy - kept for compatibility)
export const limitReqByIp = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Use the advanced rate limiter
  advancedRateLimiter.middleware(req, res, next);
};

// Advanced rate limiter with all features
export const advancedRateLimit = advancedRateLimiter.middleware;
