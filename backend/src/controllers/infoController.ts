import { spotifyService } from "#services/spotifyService.js";
import { videoInfoService } from "#services/videoInfoService.js";
import { VALIDATION_MESSAGES } from "#utils/constants.js";
import {
  isValidSpotifyPlaylistURL,
  isValidSpotifyTrackURL,
  isValidYoutubePlaylistURL,
  isValidYouTubeURL,
} from "#utils/validateUtil.js";
import type { Request, Response } from "express";
import { body } from "express-validator";

interface InfoRequest extends Request {
  body: {
    url: string;
  };
}

type InfoOptions =
  | "youtube_single"
  | "youtube_playlist"
  | "spotify_single"
  | "spotify_playlist"
  | undefined;

export class InfoController {
  readonly infoValidation = [
    body("url").notEmpty().withMessage(VALIDATION_MESSAGES.URL_REQUIRED),
  ];

  async getInfo(req: InfoRequest, res: Response) {
    const { url } = req.body;

    let info: InfoOptions;
    if (isValidSpotifyTrackURL(url)) info = "spotify_single";
    if (isValidSpotifyPlaylistURL(url)) info = "spotify_playlist";
    if (isValidYouTubeURL(url)) info = "youtube_single";
    if (isValidYoutubePlaylistURL(url)) info = "youtube_playlist";

    if (!info) {
      return res.status(400).json({
        success: false,
        message: VALIDATION_MESSAGES.INVALID_URL,
      });
    }

    const data = await this.infoData(info, url);

    res.json({
      info,
      success: true,
      data,
    });
  }

  private async infoData(info: InfoOptions, url: string) {
    let data;
    if (info === "spotify_single") {
      data = await spotifyService.getTrackInfo(url);
    }
    if (info === "spotify_playlist") {
      data = await spotifyService.getPlaylistInfo(url);
    }
    if (info === "youtube_single") {
      data = await videoInfoService.getVideoInfo(url);
    }
    if (info === "youtube_playlist") {
      data = await videoInfoService.getPlaylistInfo(url);
    }
    return data;
  }
}

export const infoController = new InfoController();
