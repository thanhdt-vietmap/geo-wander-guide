import express from "express";
import { healthController, usersController } from "../controllers/apiController";

const router = express.Router();

router.get("/health", healthController);
router.get("/users", usersController);

export default router;
