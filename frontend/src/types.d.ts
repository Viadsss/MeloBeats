interface InitialConvert {
  success: boolean;
  conversionId: string;
  title: string;
  message: string;
}

type BitRateOptions = 64 | 128 | 192 | 256 | 320;

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

export interface SpotifyTrack {
  name: string;
  artists: string[];
  thumbnail: string | undefined;
  duration: number;
  spotifyId: string;
}

export interface SpotifyPlaylist {
  name: string;
  thumbnail: string | undefined;
  tracks: SpotifyTrack[];
  totalTracks: number;
}

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

type InfoOptions =
  | "youtube_single"
  | "youtube_playlist"
  | "spotify_single"
  | "spotify_playlist"
  | undefined;

type Info =
  | SpotifyTrack
  | SpotifyPlaylist
  | VideoInfo
  | PlaylistInfo
  | undefined;
