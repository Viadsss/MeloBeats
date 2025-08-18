import ytdl from "@distube/ytdl-core";
import ytpl from "ytpl";

export const isValidYouTubeURL = (url: string): boolean => {
  return ytdl.validateURL(url);
};

export const isValidYoutubePlaylistURL = (url: string): boolean => {
  return ytpl.validateID(url);
};

export const isValidSpotifyTrackURL = (url: string): boolean => {
  try {
    const u = new URL(url);
    return (
      u.hostname === "open.spotify.com" && u.pathname.startsWith("/track/")
    );
  } catch {
    return false;
  }
};

export const isValidSpotifyPlaylistURL = (url: string): boolean => {
  try {
    const u = new URL(url);
    return (
      u.hostname === "open.spotify.com" && u.pathname.startsWith("/playlist/")
    );
  } catch {
    return false;
  }
};

export const isValidBitrate = (bitrate: any): boolean => {
  const validBitrates = [64, 128, 192, 256, 320];
  return validBitrates.includes(Number(bitrate));
};
