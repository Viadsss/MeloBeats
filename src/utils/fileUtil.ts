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
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // If it's a directory, delete it recursively
        await deleteDirectory(filePath);
      } else {
        // If it's a file, delete it normally
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted file: ${path.basename(filePath)}`);
      }
    }
  } catch (error) {
    console.error(`Failed to delete file/directory ${filePath}:`, error);
  }
};

export const deleteDirectory = async (dirPath: string): Promise<void> => {
  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);

      // Delete all files and subdirectories first
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          await deleteDirectory(fullPath); // Recursive call for subdirectories
        } else {
          fs.unlinkSync(fullPath); // Delete file
        }
      }

      // Now delete the empty directory
      fs.rmdirSync(dirPath);
      console.log(`🗑️ Deleted directory: ${path.basename(dirPath)}`);
    }
  } catch (error) {
    console.error(`Failed to delete directory ${dirPath}:`, error);
  }
};

export const cleanupAllFiles = (): void => {
  if (!fs.existsSync(config.downloadsDir)) {
    initializeDirectories();
    return;
  }

  const items = fs.readdirSync(config.downloadsDir);
  let deletedCount = 0;

  items.forEach((item) => {
    const itemPath = path.join(config.downloadsDir, item);
    try {
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        // Delete directory recursively
        deleteDirectory(itemPath);
        deletedCount++;
      } else {
        // Delete file
        fs.unlinkSync(itemPath);
        deletedCount++;
      }
    } catch (error) {
      console.error(`Error deleting ${item}:`, error);
    }
  });

  console.log(`🧹 Cleaned up ${deletedCount} items on startup`);
};

export const cleanupTempDirectory = async (tempDir: string): Promise<void> => {
  try {
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        await deleteFile(path.join(tempDir, file));
      }
      fs.rmdirSync(tempDir);
    }
  } catch (error) {
    console.error("Error cleaning up temp directory:", error);
  }
};

export const sanitizeFilename = (title: string): string => {
  return title
    .replace(/[^\w\s-]/gi, "")
    .replace(/\s+/g, "_")
    .substring(0, 100); // Limit filename length
};
