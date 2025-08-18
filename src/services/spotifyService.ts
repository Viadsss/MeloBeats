import type { VideoInfo } from "#types.js";
import SpotifyWebApi from "spotify-web-api-node";
import yts from "yt-search";

export interface SpotifyTrack {
  name: string;
  artists: string[];
  duration: number;
  spotifyId: string;
}

export interface SpotifyPlaylist {
  name: string;
  tracks: SpotifyTrack[];
  totalTracks: number;
}

class SpotifyService {
  private spotify: SpotifyWebApi;

  constructor(clientId: string, clientSecret: string) {
    this.spotify = new SpotifyWebApi({ clientId, clientSecret });
  }

  async initialize() {
    try {
      const data = await this.spotify.clientCredentialsGrant();
      this.spotify.setAccessToken(data.body.access_token);
      console.log("🎵 Spotify API initialized");
    } catch (error) {
      console.error("Failed to initialize Spotify API:", error);
      throw error;
    }
  }

  async getTrackInfo(spotifyUrl: string): Promise<SpotifyTrack> {
    try {
      const trackId = this.extractTrackId(spotifyUrl);
      const track = await this.spotify.getTrack(trackId);

      return {
        name: track.body.name,
        artists: track.body.artists.map((artist) => artist.name),
        duration: track.body.duration_ms,
        spotifyId: track.body.id,
      };
    } catch {
      throw new Error("Failed to retrieve track information");
    }
  }

  async getPlaylistInfo(spotifyUrl: string): Promise<SpotifyPlaylist> {
    try {
      const playlistId = this.extractPlaylistId(spotifyUrl);
      const playlist = await this.spotify.getPlaylist(playlistId);

      const tracks: SpotifyTrack[] = playlist.body.tracks.items
        .filter(
          (item): item is typeof item & { track: SpotifyApi.TrackObjectFull } =>
            !!item.track,
        )
        .map((item) => ({
          name: item.track.name,
          artists: item.track.artists.map((a) => a.name),
          duration: item.track.duration_ms,
          spotifyId: item.track.id,
        }));

      return {
        name: playlist.body.name,
        tracks,
        totalTracks: tracks.length,
      };
    } catch {
      throw new Error("Failed to retrieve playlist information");
    }
  }

  async searchOnYoutube(track: SpotifyTrack): Promise<VideoInfo> {
    try {
      const query = `${track.artists.join(" ")} ${track.name}`;
      const search = await yts(query);
      const video = search.videos[0];
      if (!video) {
        throw new Error("No correspond video for Spotify track found");
      }

      const youtubeVideo: VideoInfo = {
        author: video.author.name,
        title: video.title,
        duration: video.duration.seconds,
        thumbnail: video.thumbnail,
        url: video.url,
      };

      return youtubeVideo;
    } catch {
      throw new Error("Failed to search on YouTube");
    }
  }

  private extractTrackId(url: string): string {
    try {
      const u = new URL(url);
      const parts = u.pathname.split("/");
      if (parts[1] !== "track" || !parts[2]) {
        throw new Error("Invalid Spotify track URL");
      }
      return parts[2];
    } catch {
      throw new Error("Invalid URL format");
    }
  }

  private extractPlaylistId(url: string): string {
    try {
      const u = new URL(url);
      const parts = u.pathname.split("/");
      if (parts[1] !== "playlist" || !parts[2]) {
        throw new Error("Invalid Spotify playlist URL");
      }
      return parts[2];
    } catch {
      throw new Error("Invalid URL format");
    }
  }
}

export const spotifyService = new SpotifyService(
  process.env.SPOTIFY_CLIENT_ID ?? "",
  process.env.SPOTIFY_CLIENT_SECRET ?? "",
);
