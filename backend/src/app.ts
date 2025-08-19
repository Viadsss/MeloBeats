import express from "express";
import cors from "cors";
import { cleanupAllFiles, initializeDirectories } from "#utils/fileUtil.js";
import { config } from "#config.js";
import { fileCleanupService } from "#services/fileCleanupService.js";
import { setupRoutes } from "#routes/index.js";
import { errorHandler } from "#middlewares/errorHandler.js";
import { spotifyService } from "#services/spotifyService.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Initialize
console.log("🚀 Initializing YouTube to MP3 API...");
initializeDirectories();
cleanupAllFiles();
fileCleanupService.start();
try {
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    await spotifyService.initialize();
  } else {
    console.warn(
      "⚠️ Spotify credentials not found. Spotify features disabled.",
    );
  }
} catch (error) {
  console.warn(
    "⚠️ Spotify service failed to initialize. Spotify URLs will not work.",
  );
}

// Routes
setupRoutes(app);

// Error Handling
app.use(errorHandler);

process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT. Gracefully shutting down...");
  fileCleanupService.stop();
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

app.listen(config.port, () => {
  console.log(`🚀 YouTube to MP3 API server running on port ${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/api/health`);
});
