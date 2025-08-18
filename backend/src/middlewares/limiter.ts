import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

const rateLimitHandler = (req: Request, res: Response) => {
  // Type assertion to access rateLimit property
  const rateLimitData = (req as any).rateLimit;
  const resetTime = rateLimitData
    ? new Date(rateLimitData.resetTime)
    : new Date(Date.now() + 60000);
  const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000);

  res.status(429).json({
    success: false,
    error: "Rate limit exceeded",
    message: "Too many requests. Please try again later.",
    retryAfter: retryAfter,
    timestamp: new Date().toISOString(),
  });
};

// export const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 200,
//   handler: rateLimitHandler,
//   standardHeaders: true,
//   legacyHeaders: false,
// });

export const conversionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

export const downloadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});
