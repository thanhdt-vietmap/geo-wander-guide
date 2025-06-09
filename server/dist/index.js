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
// Initialize request counts for rate limiting
app.requestCounts = {};
// Setup common middleware
(0, common_1.setupMiddleware)(app);
// Setup routes
app.use("/api", api_1.default);
app.use("/admin", admin_1.default);
app.use("/proxy", proxy_1.default);
// Add direct API routes (without /proxy prefix) for backward compatibility
// Serve static files from React build
app.use(express_1.default.static(path_1.default.join(__dirname, "../../client/dist")));
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
    }
    else {
        // Serve React app for all other routes
        const filePath = path_1.default.join(__dirname, "../../client/dist/index.html");
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
    advancedRateLimiter_1.advancedRateLimiter.emergencyCleanup();
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
    advancedRateLimiter_1.advancedRateLimiter.emergencyCleanup();
});
//# sourceMappingURL=index.js.map