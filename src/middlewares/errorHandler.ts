import type { Request, Response, NextFunction } from "express";
import { ERROR_MESSAGES } from "#utils/constants.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Unhandled error:", err.message);
  console.error("Stack trace:", err.stack);

  // Don't send stack trace in production
  const isDevelopment = process.env.NODE_ENV !== "production";

  res.status(500).json({
    success: false,
    error: ERROR_MESSAGES.INTERNAL_ERROR,
    ...(isDevelopment && { details: err.message, stack: err.stack }),
  });
};
