import { validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";
import { ERROR_MESSAGES } from "#utils/constants.js";

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.VALIDATION_FAILED,
      details: errors.array().map((err) => ({
        field: err.type === "field" ? err.path : "unknown",
        message: err.msg,
      })),
    });
  }

  next();
};
