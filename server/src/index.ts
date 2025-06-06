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

// Setup common middleware
setupMiddleware(app);

// Setup routes
app.use("/api", apiRoutes);
app.use("/admin", adminRoutes);
app.use("/", proxyRoutes);

// Serve static files from React build
app.use(express.static(path.join(__dirname, "../../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

app.listen(PORT, () => {
  // console.log(`Server running on port ${PORT}`);
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
  // Trigger emergency cleanup before exit
  advancedRateLimiter.emergencyCleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
  // Trigger emergency cleanup
  advancedRateLimiter.emergencyCleanup();
});

// Memory monitoring
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);
  
  // Log memory usage every 10 minutes
  console.log(`[${new Date().toISOString()}] Memory usage: heap=${heapUsedMB}MB, rss=${rssMB}MB`);
  
  // Trigger emergency cleanup if memory usage is critically high
  if (heapUsedMB > 800 || rssMB > 1000) {
    console.log(`[${new Date().toISOString()}] Critical memory usage detected, triggering emergency cleanup`);
    advancedRateLimiter.emergencyCleanup();
  }
}, 10 * 60 * 1000); // Every 10 minutes
