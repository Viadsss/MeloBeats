import type { Response, Request } from "express";
import { videoInfoService } from "#services/videoInfoService.js";
import { ERROR_MESSAGES, VALIDATION_MESSAGES } from "#utils/constants.js";
import { body } from "express-validator";
import {
  isValidYoutubePlaylistURL,
  isValidYouTubeURL,
} from "#utils/validateUtil.js";

interface VideoInfoRequest extends Request {
  body: {
    url: string;
  };
}

export class VideoInfoController {
  readonly videoInfoValidation = [
    body("url")
      .notEmpty()
      .withMessage(VALIDATION_MESSAGES.URL_REQUIRED)
      .custom((url) => {
        if (!isValidYouTubeURL(url)) {
          throw new Error(VALIDATION_MESSAGES.INVALID_YOUTUBE_URL);
        }
        return true;
      }),
  ];

  readonly playlistInfoValidation = [
    body("url")
      .notEmpty()
      .withMessage(VALIDATION_MESSAGES.URL_REQUIRED)
      .custom((url) => {
        if (!isValidYoutubePlaylistURL(url)) {
          throw new Error(VALIDATION_MESSAGES.INVALID_YOUTUBE_PLAYLIST_URL);
        }
        return true;
      }),
  ];

  async getVideoInfo(req: VideoInfoRequest, res: Response) {
    try {
      const { url } = req.body;
      const videoInfo = await videoInfoService.getVideoInfo(url);

      res.json({
        success: true,
        data: videoInfo,
      });
    } catch (error: any) {
      console.error("Error fetching video info:", error.message);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.VIDEO_INFO_FAILED,
      });
    }
  }

  async getPlaylistInfo(req: VideoInfoRequest, res: Response) {
    try {
      const { url } = req.body;
      const videoInfo = await videoInfoService.getPlaylistInfo(url);

      res.json({
        success: true,
        data: videoInfo,
      });
    } catch (error: any) {
      console.error("Error fetching video info:", error.message);
      res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.VIDEO_INFO_FAILED,
      });
    }
  }
}

export const videoInfoController = new VideoInfoController();
