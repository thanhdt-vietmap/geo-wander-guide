import express from "express";
import path from "path";
import dotenv from "dotenv";
import { setupMiddleware } from "./middleware/common";
import apiRoutes from "./routes/api";
import proxyRoutes from "./routes/proxy";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Initialize request counts for rate limiting
(app as any).requestCounts = {};

// Setup common middleware
setupMiddleware(app);

// Setup routes
app.use("/api", apiRoutes);
app.use("/proxy", proxyRoutes);

// Serve static files from React build
app.use(express.static(path.join(__dirname, "../../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

app.listen(PORT, () => {
  // console.log(`Server running on port ${PORT}`);
});
