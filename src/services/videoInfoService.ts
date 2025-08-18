import ytdl from "@distube/ytdl-core";
import type { VideoInfo } from "#types.js";

class VideoInfoService {
  async getVideoInfo(url: string): Promise<VideoInfo> {
    const info = await ytdl.getInfo(url);

    return {
      title: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails[0]?.url || undefined,
      author: info.videoDetails.author.name,
      viewCount: info.videoDetails.viewCount,
      description:
        info.videoDetails.description?.substring(0, 200) || undefined,
    };
  }
}

export const videoInfoService = new VideoInfoService();
