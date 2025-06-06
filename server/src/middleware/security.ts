import express from "express";
import { ServerHMACService } from "../services/serverHMACServices";
import { CONFIG } from "../config/constants";

const hmacService: ServerHMACService = ServerHMACService.getInstance();

export const isValidRequest = (req: express.Request): boolean => {
  let time = parseInt(req.headers["x-timestamp"] as string);
  if (
    isNaN(time) ||
    time < Date.now() - CONFIG.TIMESTAMP_TOLERANCE ||
    time > Date.now() + CONFIG.TIMESTAMP_TOLERANCE
  ) {
    // console.error("Invalid timestamp");
    return false;
  }
  // console.log("Request timestamp:", time);

  if (!req.headers["x-signature"]) {
    // console.error("Missing HMAC signature");
    return false;
  }

  let isValidReq = hmacService.verifyHMAC(
    req.method,
    req.originalUrl,
    time,
    req.headers["x-signature"] as string,
    JSON.stringify(req.body)
  );

  if (!isValidReq) {
    // console.error("Invalid HMAC signature");
    return false;
  }
  return true;
};

export const validateRequest = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!isValidRequest(req)) {
    // console.error("Invalid request");
    return res.status(400).json({ error: "Bad Request" });
  }
  next();
};
