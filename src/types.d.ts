import { Request } from "express";

export interface VideoInfo {
  title: string;
  duration: string;
  thumbnail?: string | undefined;
  author: string;
  viewCount: string;
  description?: string | undefined;
}

export interface ConversionData {
  status: "processing" | "completed" | "failed";
  title: string;
  filename: string;
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface VideoInfoRequest extends Request {
  body: {
    url: string;
  };
}

export interface ConvertRequest extends Request {
  body: {
    url: string;
    bitrate?: BitRateOptions;
  };
}

type BitRateOptions = 64 | 128 | 192 | 256 | 320;

type VideoQuality =
  | "144p"
  | "240p"
  | "360p"
  | "480p"
  | "720p"
  | "1080p"
  | "highest";
