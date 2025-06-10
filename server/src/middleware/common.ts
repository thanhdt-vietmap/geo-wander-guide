import express from "express";
import cors from "cors";
import helmet from "helmet";

export const setupMiddleware = (app: express.Application) => {
  // Security middleware
  app.use(helmet());
  app.use(cors());
  
  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Content Security Policy
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "worker-src 'self' blob:; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https:; " +
      "font-src 'self' data: https://fonts.gstatic.com;"
    );
    next();
  });
};
