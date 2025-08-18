import { conversionService } from "#services/conversionService.js";
import infoRoutes from "./info.js";
import conversionRoutes from "./conversion.js";
import type { Application, Request, Response } from "express";

export const setupRoutes = (app: Application): void => {
  app.use("/api/info", infoRoutes);
  app.use("/api/convert", conversionRoutes);

  // Root endpoint
  app.get("/", (req: Request, res: Response) => {
    res.json({
      success: true,
      message: "YouTube to MP3 API",
      version: "1.0.0",
      endpoints: {
        health: "/api/health",
        videoInfo: "POST /api/video/info",
        convert: "POST /api/convert",
        status: "GET /api/convert/:id/status",
        download: "GET /api/convert/:id/download",
      },
    });
  });

  app.get("/health", (req: Request, res: Response) => {
    res.json({
      success: true,
      message: "API is running",
      timestamp: new Date().toISOString(),
      activeConversions: conversionService.getActiveConversionsCount(),
      totalConversions: conversionService.getTotalConversionsCount(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: "Endpoint not found",
    });
  });
};
