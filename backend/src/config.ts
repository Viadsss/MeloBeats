import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import type { BitRateOptions } from "#types.js";

export const config = {
  port: process.env.PORT ?? 3000,
  downloadsDir: path.join(process.cwd(), "downloads"),
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  maxFileAge: 30 * 60 * 1000, // 30 minutes
  defaultBitrate: 128 satisfies BitRateOptions as BitRateOptions,
};

// Initialize FFmpeg
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(String(ffmpegPath));
}
