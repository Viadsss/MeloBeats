export const VALIDATION_MESSAGES = {
  URL_REQUIRED: "URL is required",
  INVALID_YOUTUBE_URL: "Invalid YouTube URL or playlist URL",
  INVALID_YOUTUBE_PLAYLIST_URL: "Invalid YouTube playlist URL",
  INVALID_URL: "Invalid URL. Only YouTube and Spotify URLs are supported",
  INVALID_BITRATE:
    "Invalid bitrate. Supported bitrates: 64, 128, 192, 256, 320",
  CONVERSION_ID_REQUIRED: "Conversion ID is required",
  INVALID_CONVERSION_ID: "Invalid conversion ID format",
} as const;

export const ERROR_MESSAGES = {
  VALIDATION_FAILED: "Validation failed",
  CONVERSION_NOT_FOUND: "Conversion not found",
  CONVERSION_NOT_COMPLETED: "Conversion not completed yet",
  FILE_NOT_FOUND: "File not found",
  DOWNLOAD_FAILED: "Failed to download file",
  CONVERSION_START_FAILED: "Failed to start conversion",
  VIDEO_INFO_FAILED: "Failed to fetch video information",
  INTERNAL_ERROR: "Internal server error",
} as const;
