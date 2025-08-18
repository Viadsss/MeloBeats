import ytdl from "@distube/ytdl-core";
import type { PlaylistInfo, VideoInfo } from "#types.js";
import ytpl from "ytpl";

class VideoInfoService {
  async getVideoInfo(url: string): Promise<VideoInfo> {
    const info = await ytdl.getInfo(url);

    return {
      url: info.videoDetails.video_url,
      title: info.videoDetails.title,
      duration: Number(info.videoDetails.lengthSeconds),
      thumbnail: info.videoDetails.thumbnails[0]?.url || undefined,
      author: info.videoDetails.author.name,
    };
  }

  async getPlaylistInfo(url: string): Promise<PlaylistInfo> {
    const playlist = await ytpl(url);

    const playlistInfo: PlaylistInfo = {
      title: playlist.title,
      url: playlist.url,
      itemCount: playlist.estimatedItemCount,
      thumbnail: playlist.bestThumbnail.url ?? undefined,
      videos: playlist.items.map((item) => ({
        url: item.shortUrl,
        title: item.title,
        author: item.author.name,
        duration: item.durationSec ?? 0,
        thumbnail: item.bestThumbnail.url ?? undefined,
      })),
    };
    return playlistInfo;
  }
}

export const videoInfoService = new VideoInfoService();
