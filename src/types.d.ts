import { Request } from "express";

export interface VideoInfo {
  url: string;
  title: string;
  author: string;
  duration: number;
  thumbnail?: string | undefined;
}

export interface PlaylistInfo {
  url: string;
  title: string;
  itemCount: number;
  thumbnail?: string | undefined;
  videos: VideoInfo[];
}

export interface ConversionData {
  status: "processing" | "completed" | "failed";
  title: string;
  filename: string;
  stripedFileName: string;
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  isPlaylist?: boolean;
  totalTracks?: number;
  processedTracks?: number;
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
