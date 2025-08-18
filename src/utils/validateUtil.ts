import ytdl from "@distube/ytdl-core";

export const isValidYouTubeURL = (url: string): boolean => {
  return ytdl.validateURL(url);
};

export const isValidBitrate = (bitrate: any): boolean => {
  const validBitrates = [64, 128, 192, 256, 320];
  return validBitrates.includes(Number(bitrate));
};
