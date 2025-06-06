import express from "express";
import { healthController, usersController } from "../controllers/apiController";
import { botDetectionController } from "../controllers/botDetectionController";

const router = express.Router();

router.get("/health", healthController);
router.get("/users", usersController);

// Bot detection routes
router.post("/bot-detection", botDetectionController.recordBotDetection);

export default router;
