import fs from "fs";
import path from "path";
import { config } from "#config.js";
import { conversionService } from "./conversionService.js";
import { deleteFile } from "#utils/fileUtil.js";

class FileCleanupService {
  private intervalId: NodeJS.Timeout | null = null;

  start(): void {
    if (this.intervalId) {
      console.log("🧹 File cleanup service already running");
      return;
    }

    console.log(
      `🧹 Starting file cleanup service (interval: ${config.cleanupInterval / 1000}s)`,
    );

    this.intervalId = setInterval(() => {
      this.cleanupFiles();
    }, config.cleanupInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("🧹 File cleanup service stopped");
    }
  }

  private async cleanupFiles(): Promise<void> {
    const cutoffTime = new Date(Date.now() - config.maxFileAge);

    // Clean up tracked conversions and their files
    const conversions = conversionService.getAllConversions();
    const filesToDelete: string[] = [];

    conversions.forEach((conversion) => {
      if (conversion.createdAt < cutoffTime) {
        const filePath = path.join(config.downloadsDir, conversion.filename);
        filesToDelete.push(filePath);
        conversionService.deleteConversion(conversion.id);
      }
    });

    // Delete files
    for (const filePath of filesToDelete) {
      await deleteFile(filePath);
    }

    // Also clean up any orphaned files in downloads directory
    try {
      if (fs.existsSync(config.downloadsDir)) {
        const files = fs.readdirSync(config.downloadsDir);
        for (const file of files) {
          const filePath = path.join(config.downloadsDir, file);
          const stats = fs.statSync(filePath);

          if (stats.birthtime < cutoffTime) {
            await deleteFile(filePath);
          }
        }
      }
    } catch (error) {
      console.error("Error during orphaned file cleanup:", error);
    }

    // Clean up old conversions from memory
    conversionService.cleanupOldConversions();
  }

  // Manual cleanup method
  async runCleanup(): Promise<void> {
    console.log("🧹 Running manual cleanup...");
    await this.cleanupFiles();
  }
}

export const fileCleanupService = new FileCleanupService();
