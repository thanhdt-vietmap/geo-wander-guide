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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5005;
// Initialize request counts for rate limiting
app.requestCounts = {};
// Setup common middleware
(0, common_1.setupMiddleware)(app);
// Setup routes
app.use("/api", api_1.default);
app.use("/proxy", proxy_1.default);
// Serve static files from React build
app.use(express_1.default.static(path_1.default.join(__dirname, "../../client/dist")));
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../../client/dist/index.html"));
});
app.listen(PORT, () => {
    // console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map