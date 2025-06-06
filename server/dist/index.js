"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const common_1 = require("./middleware/common");
const api_1 = __importDefault(require("./routes/api"));
const proxy_1 = __importDefault(require("./routes/proxy"));
const admin_1 = __importDefault(require("./routes/admin"));
const advancedRateLimiter_1 = require("./services/advancedRateLimiter");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5005;
// Setup common middleware
(0, common_1.setupMiddleware)(app);
// Setup routes
app.use("/api", api_1.default);
app.use("/admin", admin_1.default);
app.use("/", proxy_1.default);
// Serve static files from React build
app.use(express_1.default.static(path_1.default.join(__dirname, "../../client/dist")));
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../../client/dist/index.html"));
});
app.listen(PORT, () => {
    // console.log(`Server running on port ${PORT}`);
});
// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    console.log(`[${new Date().toISOString()}] Received ${signal}, starting graceful shutdown...`);
    // Shutdown rate limiter
    advancedRateLimiter_1.advancedRateLimiter.shutdown();
    process.exit(0);
};
// Handle process termination
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    console.error(`[${new Date().toISOString()}] Uncaught Exception:`, error);
    // Trigger emergency cleanup before exit
    advancedRateLimiter_1.advancedRateLimiter.emergencyCleanup();
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
    // Trigger emergency cleanup
    advancedRateLimiter_1.advancedRateLimiter.emergencyCleanup();
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
        advancedRateLimiter_1.advancedRateLimiter.emergencyCleanup();
    }
}, 10 * 60 * 1000); // Every 10 minutes
//# sourceMappingURL=index.js.map