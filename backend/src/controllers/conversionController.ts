import type { Request, Response } from "express";
import type { BitRateOptions } from "#types.js";
import { conversionService } from "#services/conversionService.js";
import { spotifyService } from "#services/spotifyService.js";
import { deleteFile } from "#utils/fileUtil.js";
import { config } from "#config.js";
import {
  ERROR_MESSAGES,
  isKnownUserError,
  VALIDATION_MESSAGES,
} from "#utils/constants.js";
import path from "path";
import fs from "fs";
import { body, param } from "express-validator";
import {
  isValidBitrate,
  isValidYoutubePlaylistURL,
  isValidYouTubeURL,
  isValidSpotifyTrackURL,
  isValidSpotifyPlaylistURL,
} from "#utils/validateUtil.js";

export interface ConvertRequest extends Request {
  body: {
    url: string;
    bitrate?: BitRateOptions;
  };
}

export interface ConversionIdRequest extends Request {
  params: {
    conversionId: string;
  };
}

export class ConversionController {
  readonly convertValidation = [
    body("url")
      .notEmpty()
      .withMessage(VALIDATION_MESSAGES.URL_REQUIRED)
      .custom((url) => {
        const isYoutube =
          isValidYouTubeURL(url) || isValidYoutubePlaylistURL(url);
        const isSpotify =
          isValidSpotifyTrackURL(url) || isValidSpotifyPlaylistURL(url);

        if (!isYoutube && !isSpotify) {
          throw new Error(VALIDATION_MESSAGES.INVALID_URL);
        }
        return true;
      }),
    body("bitrate")
      .optional()
      .isInt()
      .custom((bitrate) => {
        if (bitrate && !isValidBitrate(bitrate)) {
          throw new Error(VALIDATION_MESSAGES.INVALID_BITRATE);
        }
        return true;
      }),
  ];

  readonly conversionIdValidation = [
    param("conversionId")
      .notEmpty()
      .withMessage(VALIDATION_MESSAGES.CONVERSION_ID_REQUIRED)
      .isUUID()
      .withMessage(VALIDATION_MESSAGES.INVALID_CONVERSION_ID),
  ];

  async convert(req: ConvertRequest, res: Response) {
    try {
      const { url, bitrate = config.defaultBitrate } = req.body;

      let result;

      // Handle YouTube URLs
      if (isValidYoutubePlaylistURL(url)) {
        result = await conversionService.startPlaylistConversion(url, bitrate);
      } else if (isValidYouTubeURL(url)) {
        result = await conversionService.startConversion(url, bitrate);
      }
      // Handle Spotify URLs
      else if (isValidSpotifyPlaylistURL(url)) {
        const playlistInfo = await spotifyService.getPlaylistInfo(url);
        result = await conversionService.startSpotifyPlaylistConversion(
          playlistInfo,
          bitrate,
        );
      } else if (isValidSpotifyTrackURL(url)) {
        const trackInfo = await spotifyService.getTrackInfo(url);
        const youtubeVideo = await spotifyService.searchOnYoutube(trackInfo);
        result = await conversionService.startConversion(
          youtubeVideo.url,
          bitrate,
        );
      } else {
        // This should never happen if validation is working correctly
        throw new Error("Unsupported URL format");
      }

      res.json({
        success: true,
        ...result,
        message: "Conversion started",
      });
    } catch (error: any) {
      console.error("Error starting conversion:", error.message);
      res.status(500).json({
        success: false,
        error: isKnownUserError(error.message)
          ? error.message
          : ERROR_MESSAGES.CONVERSION_START_FAILED,
      });
    }
  }

  getStatus(req: ConversionIdRequest, res: Response) {
    const { conversionId } = req.params;

    const conversion = conversionService.getConversion(conversionId);

    if (!conversion) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.CONVERSION_NOT_FOUND,
      });
    }

    res.json({
      success: true,
      data: conversion,
    });
  }

  async download(req: ConversionIdRequest, res: Response) {
    const { conversionId } = req.params;

    const conversion = conversionService.getConversion(conversionId);

    if (!conversion) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.CONVERSION_NOT_FOUND,
      });
    }

    if (conversion.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.CONVERSION_NOT_COMPLETED,
      });
    }

    const filePath = path.join(config.downloadsDir, conversion.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.FILE_NOT_FOUND,
      });
    }

    // Set appropriate content type for ZIP files
    if (conversion.isPlaylist && conversion.filename.endsWith(".zip")) {
      res.setHeader("Content-Type", "application/zip");
    }

    res.download(filePath, conversion.stripedFileName, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).json({
          success: false,
          error: ERROR_MESSAGES.DOWNLOAD_FAILED,
        });
      }
    });
  }

  async deleteConversion(req: ConversionIdRequest, res: Response) {
    const { conversionId } = req.params;

    const conversion = conversionService.getConversion(conversionId);

    if (!conversion) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.CONVERSION_NOT_FOUND,
      });
    }

    // Delete file
    const filePath = path.join(config.downloadsDir, conversion.filename);
    await deleteFile(filePath);

    // Remove from memory
    conversionService.deleteConversion(conversionId);

    res.json({
      success: true,
      message: "Conversion deleted",
    });
  }

  getAllConversions(req: Request, res: Response) {
    const conversions = conversionService.getAllConversions();
    res.json({
      success: true,
      data: conversions,
    });
  }
}

export const conversionController = new ConversionController();
