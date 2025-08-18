import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import type { ConversionData, BitRateOptions } from "#types.js";
import { config } from "#config.js";
import { sanitizeFilename } from "#utils/fileUtil.js";

class ConversionService {
  private conversions = new Map<string, ConversionData>();

  async startConversion(
    url: string,
    quality = "highestaudio",
    bitrate: BitRateOptions = 128,
  ): Promise<{ conversionId: string; title: string }> {
    const info = await ytdl.getInfo(url);
    const conversionId = uuidv4();

    const title = sanitizeFilename(info.videoDetails.title);
    const filename = `${title}_${conversionId}.mp3`;
    const outputPath = path.join(config.downloadsDir, filename);

    this.conversions.set(conversionId, {
      status: "processing",
      title: info.videoDetails.title,
      filename,
      progress: 0,
      createdAt: new Date(),
    });

    // Start conversion asynchronously
    this.convertVideo(url, outputPath, conversionId, quality, bitrate);

    return {
      conversionId,
      title: info.videoDetails.title,
    };
  }

  getConversion(conversionId: string): ConversionData | undefined {
    return this.conversions.get(conversionId);
  }

  getAllConversions(): Array<{ id: string } & ConversionData> {
    return Array.from(this.conversions.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }

  deleteConversion(conversionId: string): boolean {
    return this.conversions.delete(conversionId);
  }

  getActiveConversionsCount(): number {
    return Array.from(this.conversions.values()).filter(
      (conversion) => conversion.status === "processing",
    ).length;
  }

  getTotalConversionsCount(): number {
    return this.conversions.size;
  }

  private async convertVideo(
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
            const conversion = this.conversions.get(conversionId);
            if (conversion) {
              conversion.progress = Math.round(progress.percent || 0);
              this.conversions.set(conversionId, conversion);
            }
          })
          .on("end", () => {
            const conversion = this.conversions.get(conversionId);
            if (conversion) {
              conversion.status = "completed";
              conversion.progress = 100;
              conversion.completedAt = new Date();
              this.conversions.set(conversionId, conversion);
            }
            console.log(`✅ Conversion completed: ${conversionId}`);
            resolve();
          })
          .on("error", (err) => {
            const conversion = this.conversions.get(conversionId);
            if (conversion) {
              conversion.status = "failed";
              conversion.error = err.message;
              this.conversions.set(conversionId, conversion);
            }
            console.error(`❌ Conversion failed: ${conversionId}`, err.message);
            reject(err);
          })
          .save(outputPath);
      });
    } catch (error: any) {
      console.error(`❌ Conversion ${conversionId} failed:`, error.message);
      const conversion = this.conversions.get(conversionId);
      if (conversion) {
        conversion.status = "failed";
        conversion.error = error.message;
        this.conversions.set(conversionId, conversion);
      }
    }
  }

  cleanupOldConversions(): void {
    const cutoffTime = new Date(Date.now() - config.maxFileAge);
    let cleanedCount = 0;

    this.conversions.forEach((conversion, id) => {
      if (conversion.createdAt < cutoffTime) {
        this.conversions.delete(id);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old conversions from memory`);
    }
  }
}

export const conversionService = new ConversionService();
