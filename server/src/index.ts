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

// Serve static files from React build
app.use(express.static(path.join(__dirname, "../../client/dist")));

app.get("*", (req, res) => {
  // Skip API routes - let them return 404 if not found
  console.log(req.path);
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/proxy/') || 
      req.path.startsWith('/admin/') ||
      req.path.startsWith('/autocomplete/') ||
      req.path.startsWith('/place/') ||
      req.path.startsWith('/route') ||
      req.path.startsWith('/reverse/')) {

  }else{
  // Serve React app for all other routes
  const filePath = path.join(__dirname, "../../client/dist/index.html");
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Internal Server Error');
    }
  });
  }

});

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
