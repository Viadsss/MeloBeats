import yts from "yt-search";
import ytpl from "ytpl";

const playlist = await ytpl(
  "https://www.youtube.com/playlist?list=PLMLjcvmulIdQGIjLCmBDHVDCOQIyktMtZ",
);

async function isPlaylist(url) {
  return await ytpl.validateID(url); // true if it's a valid playlist
}

const isAPlaylist = await isPlaylist(
  "https://youtube.com/playlist?list=PLiSbGMQD1ilbwuoL2hceRcWXJuh7DOqW8&si=LfT12Ez0nDtapBWr",
);

console.log("IS A Playlist? : ", isAPlaylist);

const playlistData = {
  title: playlist.title,
  url: playlist.url,
  itemCount: playlist.estimatedItemCount,
  thumbnail: playlist.bestThumbnail.url ?? undefined,
  videos: playlist.items.map((item) => ({
    url: item.shortUrl,
    title: item.title,
    author: item.author.name,
    duration: item.durationSec,
    thumbnail: item.bestThumbnail.url ?? undefined,
  })),
};

console.log(playlistData);
