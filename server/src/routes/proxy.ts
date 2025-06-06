import express from "express";
import { validateRequest } from "../middleware/security";
import { limitReqByIp } from "../middleware/rateLimiter";
import {
  autocompleteController,
  placeController,
  routeController,
  reverseController
} from "../controllers/proxyController";

const router = express.Router();

// Apply validation and rate limiting to all proxy routes
router.use(validateRequest);
router.use(limitReqByIp);

router.get("/autocomplete/v3", autocompleteController);
router.get("/place/v3", placeController);
router.get("/route", routeController);
router.get("/reverse/v3", reverseController);

export default router;
