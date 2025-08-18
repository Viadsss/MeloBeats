// Install: npm install express-validator

import express from "express";
import type { Request, Response, NextFunction } from "express";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { body, param, validationResult } from "express-validator";
import type {
  BitRateOptions,
  ConversionData,
  ConvertRequest,
  VideoInfo,
  VideoInfoRequest,
} from "./types.js";

// Custom validation helpers
const isValidYouTubeURL = (url: string): boolean => {
  return ytdl.validateURL(url);
};

const isValidBitrate = (bitrate: any): boolean => {
  const validBitrates = [64, 128, 192, 256, 320];
  return validBitrates.includes(Number(bitrate));
};

// Validation rules
const videoInfoValidation = [
  body("url")
    .notEmpty()
    .withMessage("URL is required")
    .custom((url) => {
      if (!isValidYouTubeURL(url)) {
        throw new Error("Invalid YouTube URL");
      }
      return true;
    }),
];

const convertValidation = [
  body("url")
    .notEmpty()
    .withMessage("URL is required")
    .custom((url) => {
      if (!isValidYouTubeURL(url)) {
        throw new Error("Invalid YouTube URL");
      }
      return true;
    }),
  body("bitrate")
    .optional()
    .isInt()
    .custom((bitrate) => {
      if (bitrate && !isValidBitrate(bitrate)) {
        throw new Error("Bitrate must be one of: 64, 128, 192, 256, 320");
      }
      return true;
    }),
];

const conversionIdValidation = [
  param("conversionId")
    .notEmpty()
    .withMessage("Conversion ID is required")
    .isUUID()
    .withMessage("Invalid conversion ID format"),
];

// Error handling middleware
const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((err) => ({
        field: err.type === "field" ? err.path : "unknown",
        message: err.msg,
      })),
    });
  }

  next();
};

// Set FFmpeg path
if (ffmpegPath) {
  const pathString = String(ffmpegPath);
  ffmpeg.setFfmpegPath(pathString);
}

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT ?? 3000;
const conversions = new Map<string, ConversionData>();

const downloadsDir = path.join(process.cwd(), "downloads");
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// Get video info - with express-validator
app.post(
  "/api/video-info",
  videoInfoValidation,
  handleValidationErrors,
  async (req: VideoInfoRequest, res: Response) => {
    try {
      const { url } = req.body;

      const info = await ytdl.getInfo(url);
      const videoDetails: VideoInfo = {
        title: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds,
        thumbnail: info.videoDetails.thumbnails[0]?.url || undefined,
        author: info.videoDetails.author.name,
        viewCount: info.videoDetails.viewCount,
        description:
          info.videoDetails.description?.substring(0, 200) || undefined,
      };

      res.json({ success: true, data: videoDetails });
    } catch (error: any) {
      console.error("Error fetching video info:", error.message);
      res.status(500).json({ error: "Failed to fetch video information" });
    }
  },
);

// Start conversion - with express-validator
app.post(
  "/api/convert",
  convertValidation,
  handleValidationErrors,
  async (req: ConvertRequest, res: Response) => {
    try {
      const { url, bitrate = 128 } = req.body;

      // Generate unique conversion ID
      const conversionId = uuidv4();

      // Get video info
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title
        .replace(/[^\w\s-]/gi, "")
        .replace(/\s+/g, "_");
      const filename = `${title}_${conversionId}.mp3`;
      const outputPath = path.join(downloadsDir, filename);

      // Store conversion info
      conversions.set(conversionId, {
        status: "processing",
        title: info.videoDetails.title,
        filename,
        progress: 0,
        createdAt: new Date(),
      });

      // Start conversion asynchronously
      convertVideo(url, outputPath, conversionId, "highestaudio", bitrate);

      res.json({
        success: true,
        conversionId,
        message: "Conversion started",
        title: info.videoDetails.title,
      });
    } catch (error: any) {
      console.error("Error starting conversion:", error.message);
      res.status(500).json({ error: "Failed to start conversion" });
    }
  },
);

// Check conversion status - with express-validator
app.get(
  "/api/status/:conversionId",
  conversionIdValidation,
  handleValidationErrors,
  (req: Request, res: Response) => {
    const { conversionId } = req.params as { conversionId: string };
    const conversion = conversions.get(conversionId);

    if (!conversion) {
      return res.status(404).json({ error: "Conversion not found" });
    }

    res.json({ success: true, data: conversion });
  },
);

// Download converted file - with express-validator
app.get(
  "/api/download/:conversionId",
  conversionIdValidation,
  handleValidationErrors,
  (req: Request, res: Response) => {
    const { conversionId } = req.params as { conversionId: string };
    const conversion = conversions.get(conversionId);

    if (!conversion) {
      return res.status(404).json({ error: "Conversion not found" });
    }

    if (conversion.status !== "completed") {
      return res.status(400).json({ error: "Conversion not completed yet" });
    }

    const filePath = path.join(downloadsDir, conversion.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.download(filePath, conversion.filename, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).json({ error: "Failed to download file" });
      }
    });
  },
);

// Delete conversion and file - with express-validator
app.delete(
  "/api/conversion/:conversionId",
  conversionIdValidation,
  handleValidationErrors,
  (req: Request, res: Response) => {
    const { conversionId } = req.params as { conversionId: string };
    const conversion = conversions.get(conversionId);

    if (!conversion) {
      return res.status(404).json({ error: "Conversion not found" });
    }

    // Delete file if exists
    const filePath = path.join(downloadsDir, conversion.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from memory
    conversions.delete(conversionId);

    res.json({ success: true, message: "Conversion deleted" });
  },
);

// Get all conversions (for admin/debugging)
app.get("/api/conversions", (req: Request, res: Response) => {
  const allConversions = Array.from(conversions.entries()).map(
    ([id, data]) => ({
      id,
      ...data,
    }),
  );

  res.json({ success: true, data: allConversions });
});

app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
    activeConversions: conversions.size,
  });
});

// Conversion function (unchanged)
async function convertVideo(
  url: string,
  outputPath: string,
  conversionId: string,
  quality: string,
  bitrate: BitRateOptions,
): Promise<void> {
  try {
    const stream = ytdl(url, {
      filter: "audioonly",
      quality: quality as any,
    });

    await new Promise<void>((resolve, reject) => {
      ffmpeg(stream)
        .audioBitrate(bitrate)
        .format("mp3")
        .on("progress", (progress) => {
          const conversion = conversions.get(conversionId);
          if (conversion) {
            conversion.progress = Math.round(progress.percent || 0);
            conversions.set(conversionId, conversion);
          }
        })
        .on("end", () => {
          const conversion = conversions.get(conversionId);
          if (conversion) {
            conversion.status = "completed";
            conversion.progress = 100;
            conversion.completedAt = new Date();
            conversions.set(conversionId, conversion);
          }
          resolve();
        })
        .on("error", (err) => {
          const conversion = conversions.get(conversionId);
          if (conversion) {
            conversion.status = "failed";
            conversion.error = err.message;
            conversions.set(conversionId, conversion);
          }
          reject(err);
        })
        .save(outputPath);
    });
  } catch (error: any) {
    console.error(`Conversion ${conversionId} failed:`, error.message);
    const conversion = conversions.get(conversionId);
    if (conversion) {
      conversion.status = "failed";
      conversion.error = error.message;
      conversions.set(conversionId, conversion);
    }
  }
}

function cleanupFiles() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes instead of 1 hour

  // Clean up tracked conversions
  conversions.forEach((conversion, id) => {
    if (conversion.createdAt < thirtyMinutesAgo) {
      const filePath = path.join(downloadsDir, conversion.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${conversion.filename}`);
      }
      conversions.delete(id);
    }
  });
}

// Startup cleanup - remove ALL files on startup
function startupCleanup() {
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
    return;
  }

  const files = fs.readdirSync(downloadsDir);
  files.forEach((file) => {
    const filePath = path.join(downloadsDir, file);
    fs.unlinkSync(filePath);
  });

  console.log(`🧹 Cleaned up ${files.length} files on startup`);
}

// Clean everything on startup
startupCleanup();

// Run cleanup every 5 minutes
setInterval(
  () => {
    cleanupFiles();
  },
  5 * 60 * 1000,
); // 5 minutes

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 YouTube to MP3 API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
