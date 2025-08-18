import fs from "fs";
import path from "path";
import { config } from "#config.js";

export const initializeDirectories = (): void => {
  if (!fs.existsSync(config.downloadsDir)) {
    fs.mkdirSync(config.downloadsDir, { recursive: true });
    console.log(`📁 Created downloads directory: ${config.downloadsDir}`);
  }
};

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
  }
};

export const cleanupAllFiles = (): void => {
  if (!fs.existsSync(config.downloadsDir)) {
    initializeDirectories();
    return;
  }

  const files = fs.readdirSync(config.downloadsDir);
  files.forEach((file) => {
    const filePath = path.join(config.downloadsDir, file);
    fs.unlinkSync(filePath);
  });

  console.log(`🧹 Cleaned up ${files.length} files on startup`);
};

export const sanitizeFilename = (title: string): string => {
  return title
    .replace(/[^\w\s-]/gi, "")
    .replace(/\s+/g, "_")
    .substring(0, 100); // Limit filename length
};
