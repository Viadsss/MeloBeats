import ytdl from "@distube/ytdl-core";
import ytpl from "ytpl";
import ffmpeg from "fluent-ffmpeg";
import archiver from "archiver";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import type { ConversionData, BitRateOptions } from "#types.js";
import type { SpotifyPlaylist } from "#services/spotifyService.js";
import { spotifyService } from "#services/spotifyService.js";
import { config } from "#config.js";
import {
  sanitizeFilename,
  deleteFile,
  cleanupTempDirectory,
} from "#utils/fileUtil.js";

class ConversionService {
  private conversions = new Map<string, ConversionData>();

  async startConversion(
    url: string,
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
      stripedFileName: title,
      filename,
      progress: 0,
      createdAt: new Date(),
      isPlaylist: false,
    });

    // Start conversion asynchronously
    this.convertVideo(url, outputPath, conversionId, bitrate);

    return {
      conversionId,
      title: info.videoDetails.title,
    };
  }

  async startPlaylistConversion(
    playlistUrl: string,
    bitrate: BitRateOptions = 128,
  ): Promise<{ conversionId: string; title: string; totalTracks: number }> {
    const playlist = await ytpl(playlistUrl);
    const conversionId = uuidv4();

    const title = sanitizeFilename(playlist.title);
    const filename = `${title}_${conversionId}.zip`;

    this.conversions.set(conversionId, {
      status: "processing",
      title: playlist.title,
      filename,
      stripedFileName: title,
      progress: 0,
      createdAt: new Date(),
      isPlaylist: true,
      totalTracks: playlist.items.length,
      processedTracks: 0,
    });

    // Start playlist conversion asynchronously
    this.convertPlaylist(playlist, conversionId, bitrate);

    return {
      conversionId,
      title: playlist.title,
      totalTracks: playlist.items.length,
    };
  }

  async startSpotifyPlaylistConversion(
    playlistInfo: SpotifyPlaylist,
    bitrate: BitRateOptions = 128,
  ): Promise<{ conversionId: string; title: string; totalTracks: number }> {
    const conversionId = uuidv4();
    const title = sanitizeFilename(playlistInfo.name);
    const filename = `${title}_${conversionId}.zip`;

    this.conversions.set(conversionId, {
      status: "processing",
      title: playlistInfo.name,
      filename,
      stripedFileName: title,
      progress: 0,
      createdAt: new Date(),
      isPlaylist: true,
      totalTracks: playlistInfo.totalTracks,
      processedTracks: 0,
    });

    // Start Spotify playlist conversion asynchronously
    this.convertSpotifyPlaylist(playlistInfo, conversionId, bitrate);

    return {
      conversionId,
      title: playlistInfo.name,
      totalTracks: playlistInfo.totalTracks,
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
    bitrate: BitRateOptions,
  ): Promise<void> {
    try {
      const stream = ytdl(url, {
        filter: "audioonly",
        quality: "highestaudio",
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

  private async convertPlaylist(
    playlist: any,
    conversionId: string,
    bitrate: BitRateOptions,
  ): Promise<void> {
    const tempDir = path.join(config.downloadsDir, `temp_${conversionId}`);
    const zipPath = path.join(
      config.downloadsDir,
      this.conversions.get(conversionId)!.filename,
    );

    try {
      // Create temporary directory for individual MP3 files
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const totalVideos = playlist.items.length;
      let processedCount = 0;
      const failedConversions: string[] = [];

      // Process each video in the playlist
      for (const item of playlist.items) {
        try {
          const videoTitle = sanitizeFilename(item.title);
          const videoFilename = `${videoTitle}.mp3`;
          const videoPath = path.join(tempDir, videoFilename);

          // Convert individual video
          await this.convertSingleVideoToFile(
            item.shortUrl,
            videoPath,
            bitrate,
          );

          processedCount++;

          // Update progress
          const conversion = this.conversions.get(conversionId);
          if (conversion) {
            conversion.processedTracks = processedCount;
            conversion.progress = Math.round(
              (processedCount / totalVideos) * 90,
            ); // Leave 10% for zipping
            this.conversions.set(conversionId, conversion);
          }

          console.log(
            `✅ Processed ${processedCount}/${totalVideos}: ${item.title}`,
          );
        } catch (error: any) {
          console.error(`❌ Failed to convert: ${item.title}`, error.message);
          failedConversions.push(item.title);
        }
      }

      // Create ZIP file from all MP3s
      await this.createZipFromDirectory(tempDir, zipPath);

      // Update final status
      const conversion = this.conversions.get(conversionId);
      if (conversion) {
        conversion.status = "completed";
        conversion.progress = 100;
        conversion.completedAt = new Date();
        if (failedConversions.length > 0) {
          conversion.error = `Failed to convert ${failedConversions.length} tracks: ${failedConversions.slice(0, 3).join(", ")}${failedConversions.length > 3 ? "..." : ""}`;
        }
        this.conversions.set(conversionId, conversion);
      }

      // Clean up temporary directory
      await cleanupTempDirectory(tempDir);

      console.log(
        `✅ Playlist conversion completed: ${conversionId} (${processedCount}/${totalVideos} tracks)`,
      );
    } catch (error: any) {
      console.error(
        `❌ Playlist conversion ${conversionId} failed:`,
        error.message,
      );
      const conversion = this.conversions.get(conversionId);
      if (conversion) {
        conversion.status = "failed";
        conversion.error = error.message;
        this.conversions.set(conversionId, conversion);
      }

      // Clean up on failure
      await cleanupTempDirectory(tempDir);
      await deleteFile(zipPath);
    }
  }

  // NEW METHOD: Handle Spotify playlist conversion
  private async convertSpotifyPlaylist(
    playlistInfo: SpotifyPlaylist,
    conversionId: string,
    bitrate: BitRateOptions,
  ): Promise<void> {
    const tempDir = path.join(config.downloadsDir, `temp_${conversionId}`);
    const zipPath = path.join(
      config.downloadsDir,
      this.conversions.get(conversionId)!.filename,
    );

    try {
      // Create temporary directory for individual MP3 files
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const totalTracks = playlistInfo.tracks.length;
      let processedCount = 0;
      const failedConversions: string[] = [];

      // Process each track in the Spotify playlist
      for (const track of playlistInfo.tracks) {
        try {
          // Search for the track on YouTube
          const youtubeVideo = await spotifyService.searchOnYoutube(track);

          const trackTitle = sanitizeFilename(
            `${track.artists.join(", ")} - ${track.name}`,
          );
          const trackFilename = `${trackTitle}.mp3`;
          const trackPath = path.join(tempDir, trackFilename);

          // Convert the YouTube video to MP3
          await this.convertSingleVideoToFile(
            youtubeVideo.url,
            trackPath,
            bitrate,
          );

          processedCount++;

          // Update progress
          const conversion = this.conversions.get(conversionId);
          if (conversion) {
            conversion.processedTracks = processedCount;
            conversion.progress = Math.round(
              (processedCount / totalTracks) * 90,
            ); // Leave 10% for zipping
            this.conversions.set(conversionId, conversion);
          }

          console.log(
            `✅ Processed ${processedCount}/${totalTracks}: ${track.artists.join(", ")} - ${track.name}`,
          );
        } catch (error: any) {
          console.error(
            `❌ Failed to convert: ${track.artists.join(", ")} - ${track.name}`,
            error.message,
          );
          failedConversions.push(`${track.artists.join(", ")} - ${track.name}`);
        }
      }

      // Create ZIP file from all MP3s
      await this.createZipFromDirectory(tempDir, zipPath);

      // Update final status
      const conversion = this.conversions.get(conversionId);
      if (conversion) {
        conversion.status = "completed";
        conversion.progress = 100;
        conversion.completedAt = new Date();
        if (failedConversions.length > 0) {
          conversion.error = `Failed to convert ${failedConversions.length} tracks: ${failedConversions.slice(0, 3).join(", ")}${failedConversions.length > 3 ? "..." : ""}`;
        }
        this.conversions.set(conversionId, conversion);
      }

      // Clean up temporary directory
      await cleanupTempDirectory(tempDir);

      console.log(
        `✅ Spotify playlist conversion completed: ${conversionId} (${processedCount}/${totalTracks} tracks)`,
      );
    } catch (error: any) {
      console.error(
        `❌ Spotify playlist conversion ${conversionId} failed:`,
        error.message,
      );
      const conversion = this.conversions.get(conversionId);
      if (conversion) {
        conversion.status = "failed";
        conversion.error = error.message;
        this.conversions.set(conversionId, conversion);
      }

      // Clean up on failure
      await cleanupTempDirectory(tempDir);
      await deleteFile(zipPath);
    }
  }

  private async convertSingleVideoToFile(
    url: string,
    outputPath: string,
    bitrate: BitRateOptions,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = ytdl(url, {
        filter: "audioonly",
        quality: "highestaudio",
      });

      ffmpeg(stream)
        .audioBitrate(bitrate)
        .format("mp3")
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(outputPath);
    });
  }

  private async createZipFromDirectory(
    sourceDir: string,
    zipPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        console.log(`📦 ZIP created: ${archive.pointer()} total bytes`);
        resolve();
      });

      archive.on("error", (err) => reject(err));
      archive.pipe(output);

      // Add all MP3 files from the temp directory
      const files = fs.readdirSync(sourceDir);
      files.forEach((file) => {
        if (file.endsWith(".mp3")) {
          const filePath = path.join(sourceDir, file);
          archive.file(filePath, { name: file });
        }
      });

      archive.finalize();
    });
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
