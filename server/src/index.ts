import express from "express";
import path from "path";
import dotenv from "dotenv";
import { setupMiddleware } from "./middleware/common";
import apiRoutes from "./routes/api";
import proxyRoutes from "./routes/proxy";
import adminRoutes from "./routes/admin";
import { advancedRateLimiter } from "./services/advancedRateLimiter";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Initialize request counts for rate limiting
(app as any).requestCounts = {};

// Setup common middleware
setupMiddleware(app);

// Setup routes
app.use("/api", apiRoutes);
app.use("/admin", adminRoutes);
app.use("/proxy", proxyRoutes);

// Add direct API routes (without /proxy prefix) for backward compatibility

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// For containerized setup, we don't serve static files
// The client container handles the frontend
// All API routes should be properly prefixed and handled above

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`[${new Date().toISOString()}] Received ${signal}, starting graceful shutdown...`);
  
  // Shutdown rate limiter
  advancedRateLimiter.shutdown();
  
  process.exit(0);
};

// Handle process termination
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught Exception:`, error);
  advancedRateLimiter.emergencyCleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
  advancedRateLimiter.emergencyCleanup();
});
