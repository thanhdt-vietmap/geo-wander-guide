import express from "express";
import { CONFIG } from "../config/constants";

export const limitReqByIp = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const ip = req.ip || req.connection.remoteAddress;
  const currentTime = Date.now();
  if (!ip) return res.status(400).json({ error: "Unauthorized" });

  const requestCount = (req.app as any).requestCounts[ip] || {
    count: 0,
    lastRequestTime: currentTime,
  };
  
  // console.log(
  //   `Request from IP: ${ip}, Count: ${
  //     requestCount.count
  //   }, Last Request Time: ${new Date(
  //     requestCount.lastRequestTime
  //   ).toISOString()}`
  // );
  
  if (!requestCount.lastRequestTime) {
    requestCount.lastRequestTime = currentTime;
  }
  
  const timeSinceLastRequest = currentTime - requestCount.lastRequestTime;
  const requestLimit = CONFIG.RATE_LIMIT.MAX_REQUESTS; // Max requests per time window
  const resetTime = CONFIG.RATE_LIMIT.RESET_TIME; // Reset time window
  
  if (timeSinceLastRequest > resetTime) {
    requestCount.count = 0; // Reset count if more than a minute has passed
    requestCount.lastRequestTime = currentTime;
  }
  
  requestCount.count += 1;
  (req.app as any).requestCounts[ip] = requestCount;
  
  if (requestCount.count > requestLimit) {
    // console.error(`Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({ error: "Too Many Requests" });
  }
  
  next();
};
