import {
  Zap,
  Youtube,
  Headphones,
  Download,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState } from "react";
import { getConversionStatus, postConvert } from "@/apis/conversion";
import {
  type ConversionData,
  type PlaylistInfo,
  type SpotifyPlaylist,
  type SpotifyTrack,
  type VideoInfo,
} from "@/types";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Progress } from "../ui/progress";
import { getInfo, type GetInfoResponse } from "@/apis/info";
import { formatDuration } from "@/utils/format";
import { useQuery } from "@tanstack/react-query";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export function Main() {
  const [url, setUrl] = useState("");
  const [conversionId, setConversionId] = useState("");
  const [info, setInfo] = useState<GetInfoResponse | undefined>();
  const [infoLoading, setInfoLoading] = useState(false);
  const [parent] = useAutoAnimate();

  const { data } = useQuery({
    queryKey: ["conversionStatus", conversionId],
    queryFn: () => getConversionStatus(conversionId),
    enabled: !!conversionId,
    refetchInterval: (query) => {
      if (!query.state.data) return false;
      if (query.state.data.status === "processing") return 1000;
      else return false;
    },
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUrl("");
    setInfoLoading(true);

    try {
      const info = await getInfo(url);
      setInfo(info);
      const data = await postConvert(url);
      setConversionId(data.conversionId);
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 419) {
          toast.error(error.response.data.details[0].message);
        } else {
          toast.error(
            error.response?.data.message || "An unexpected error occurred",
          );
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setInfoLoading(false);
    }
  }

  return (
    <main
      className="container mx-auto space-y-4 border-x border-b border-dashed px-4 py-8"
      ref={parent}
    >
      <Header />
      <ConvertionCard
        url={url}
        setUrl={setUrl}
        handleSubmit={handleSubmit}
        data={data}
        infoLoading={infoLoading}
      />
      {info && data && (
        <ConvertionStatus data={data} info={info} id={conversionId} />
      )}
    </main>
  );
}

function Header() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold">Convert Your Favorite Music to MP3</h1>
      <p className="mx-auto max-w-prose">
        Easily convert YouTube videos, Spotify tracks, and entire playlists to
        high-quality MP3 files. Fast, secure, and completely free to use.
      </p>
    </div>
  );
}

function ConvertionCard({
  url,
  setUrl,
  handleSubmit,
  data,
  infoLoading,
}: {
  url: string;
  setUrl: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  status?: ConversionData;
  data: ConversionData | undefined;
  infoLoading: boolean;
}) {
  const isLoading = infoLoading || data?.status === "processing";

  return (
    <Card className="mx-auto mb-12 max-w-full shadow md:max-w-4/5">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Start Converting</CardTitle>
        <CardDescription>
          Paste your YouTube or Spotify link below (videos, tracks, or
          playlists) and get your MP3 files instantly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="url-input" className="text-sm font-medium">
            YouTube or Spotify URL (Videos, Tracks, or Playlists)
          </Label>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <Input
              id="url-input"
              name="url"
              className="placeholder:text-muted-foreground flex-1 placeholder:opacity-75"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer"
            >
              <Zap />
              {isLoading ? "Converting..." : "Convert"}
            </Button>
          </form>
        </div>

        {/* Platform Badges */}
        <div className="flex items-center justify-center gap-4 pt-1">
          <Badge variant="secondary" className="flex items-center gap-2">
            <Youtube className="h-4 w-4" />
            YouTube
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Headphones className="h-4 w-4" />
            Spotify
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ConvertionStatus({
  info,
  data,
  id,
}: {
  info: GetInfoResponse;
  data: ConversionData;
  id: string;
}) {
  if (!info.data) {
    return null;
  }

  const infoType = info.info;

  if (infoType === "youtube_single") {
    return (
      <YoutubeSingleInfo info={info.data as VideoInfo} data={data} id={id} />
    );
  }

  if (infoType === "youtube_playlist") {
    return (
      <YoutubePlaylistInfo
        info={info.data as PlaylistInfo}
        data={data}
        id={id}
      />
    );
  }

  if (infoType === "spotify_single") {
    return (
      <SpotifySingleInfo info={info.data as SpotifyTrack} data={data} id={id} />
    );
  }

  if (infoType === "spotify_playlist") {
    return (
      <SpotifyPlaylistInfo
        info={info.data as SpotifyPlaylist}
        data={data}
        id={id}
      />
    );
  }
}

function YoutubeSingleInfo({
  info,
  data,
  id,
}: {
  info: VideoInfo;
  data: ConversionData;
  id: string;
}) {
  return (
    <div className="bg-card mx-auto mb-12 flex max-w-full flex-col items-center p-4 shadow sm:flex-row md:max-w-4/5">
      {/* Thumbnail Image */}
      <div className="mr-4 flex-shrink-0">
        <img
          src={info.thumbnail || "/youtube-cover.png"}
          alt={info.title}
          className="aspect-video w-48 rounded-lg object-cover"
        />
      </div>
      {/* Content Section */}
      <div className="min-w-0 flex-1">
        {/* Title */}
        <h3 className="text-foreground mb-2 text-center text-lg font-semibold sm:text-left">
          {info.title}
        </h3>

        {/* Author */}
        <p className="text-muted-foreground mb-3 text-center text-sm sm:text-left">
          {info.author} • {formatDuration(info.duration)}
        </p>

        {/* Processing Progress Bar (only show when processing) */}
        {data.status === "processing" && (
          <div className="mb-3 w-full">
            <div className="text-muted-foreground mb-1 flex justify-between text-xs">
              <span>Processing...</span>
              <span>{Math.round(data.progress)}%</span>
            </div>
            <Progress value={data.progress} className="h-2" />
          </div>
        )}

        {/* Download Button (only show when processing is complete) */}
        {data.status === "completed" && (
          <Button asChild>
            <a
              href={`${import.meta.env.VITE_BACKEND_URL}/api/convert/${id}/download`}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function SpotifySingleInfo({
  info,
  data,
  id,
}: {
  info: SpotifyTrack;
  data: ConversionData;
  id: string;
}) {
  return (
    <div className="bg-card mx-auto mb-12 flex max-w-full flex-col items-center p-4 shadow sm:flex-row md:max-w-4/5">
      {/* Album/Track Image */}
      <div className="mr-4 flex-shrink-0">
        <img
          src={info.thumbnail || "/spotify-cover.png"}
          alt={info.name}
          className="aspect-square w-48 rounded-lg object-cover"
        />
      </div>
      {/* Content Section */}
      <div className="min-w-0 flex-1">
        {/* Track Name */}
        <h3 className="text-foreground mb-2 text-center text-lg font-semibold sm:text-left">
          {info.name}
        </h3>

        {/* Artists and Duration */}
        <p className="text-muted-foreground mb-3 text-center text-sm sm:text-left">
          {info.artists.join(", ")} •{" "}
          {formatDuration(info.duration, "milliseconds")}
        </p>

        {/* Processing Progress Bar (only show when processing) */}
        {data.status === "processing" && (
          <div className="mb-3 w-full">
            <div className="text-muted-foreground mb-1 flex justify-between text-xs">
              <span>Processing...</span>
              <span>{Math.round(data.progress)}%</span>
            </div>
            <Progress value={data.progress} className="h-2" />
          </div>
        )}

        {/* Download Button (only show when processing is complete) */}
        {data.status === "completed" && (
          <Button asChild>
            <a
              href={`${import.meta.env.VITE_BACKEND_URL}/api/convert/${id}/download`}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function YoutubePlaylistInfo({
  info,
  data,
  id,
}: {
  info: PlaylistInfo;
  data: ConversionData;
  id: string;
}) {
  const processedCount = data.processedTracks || 0;
  const totalCount = data.totalTracks || info.itemCount;

  return (
    <div className="mx-auto mb-12 max-w-full space-y-6 md:max-w-4/5">
      {/* Main Playlist Card */}
      <div className="bg-card flex flex-col items-center p-4 shadow sm:flex-row">
        {/* Playlist Thumbnail */}
        <div className="mr-4 flex-shrink-0">
          <img
            src={info.thumbnail || "/spotify-cover.png"}
            alt={info.title}
            className="aspect-square w-48 rounded-lg object-cover"
          />
        </div>

        {/* Playlist Content */}
        <div className="flex min-w-0 flex-1 flex-col sm:block">
          {/* Playlist Name */}
          <h3 className="text-foreground my-2 text-center text-lg font-semibold sm:text-left">
            {info.title}
          </h3>

          {/* Playlist Stats */}
          <p className="text-muted-foreground mb-3 text-center text-sm sm:text-left">
            Playlist • {totalCount} tracks
          </p>

          {data.status === "processing" && (
            <div className="mb-3 w-full">
              <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                <span>Current track progress...</span>
                <span>{Math.round(data.progress)}%</span>
              </div>
              <Progress value={data.progress} className="h-2" />
            </div>
          )}

          {/* Download Button (only show when all processing is complete) */}
          {data.status === "completed" && (
            <Button asChild>
              <a
                href={`${import.meta.env.VITE_BACKEND_URL}/api/convert/${id}/download`}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Playlist
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Track Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {info.videos.map((track, index) => {
          const isProcessed = index < processedCount;
          const isCurrentlyProcessing =
            index === processedCount && data.status === "processing";
          const isPending = index > processedCount;

          return (
            <SingleCard
              key={track.url || index}
              video={track}
              isProcessed={isProcessed}
              isCurrentlyProcessing={isCurrentlyProcessing}
              isPending={isPending}
              videoNumber={index + 1}
            />
          );
        })}
      </div>
    </div>
  );
}

function SingleCard({
  video,
  isProcessed,
  isCurrentlyProcessing,
  isPending,
  videoNumber,
}: {
  video: VideoInfo;
  isProcessed: boolean;
  isCurrentlyProcessing: boolean;
  isPending: boolean;
  videoNumber: number;
}) {
  return (
    <div
      className={`bg-card relative flex items-center space-x-3 rounded-lg p-3 shadow transition-all duration-200 ${
        isPending ? "opacity-50" : "opacity-100"
      } ${isCurrentlyProcessing ? "ring-ring ring-2" : ""}`}
    >
      {/* Track Image */}
      <div className="relative flex-shrink-0">
        <img
          src={video.thumbnail || "/spotify-cover.png"}
          alt={video.title}
          className={`h-12 w-12 rounded object-cover ${
            isPending ? "grayscale" : ""
          }`}
        />

        {/* Status Indicator */}
        <div className="absolute -right-1 -bottom-1">
          {isProcessed && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 dark:bg-green-600">
              <Check className="h-3 w-3" />
            </div>
          )}
          {isCurrentlyProcessing && (
            <div className="bg-ring flex h-5 w-5 items-center justify-center rounded-full text-white">
              <Loader2 className="h-2 w-2 animate-spin" />
            </div>
          )}
          {isPending && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-400">
              <span className="text-xs text-white">{videoNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            isPending ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {video.title}
        </p>
        <p
          className={`truncate text-xs ${
            isPending ? "text-muted-foreground/70" : "text-muted-foreground"
          }`}
        >
          {video.author}
        </p>
        <p
          className={`text-xs ${
            isPending ? "text-muted-foreground/70" : "text-muted-foreground"
          }`}
        >
          {formatDuration(video.duration)}
        </p>
      </div>
    </div>
  );
}

function SpotifyPlaylistInfo({
  info,
  data,
  id,
}: {
  info: SpotifyPlaylist;
  data: ConversionData;
  id: string;
}) {
  const processedCount = data.processedTracks || 0;
  const totalCount = data.totalTracks || info.totalTracks;

  return (
    <div className="mx-auto mb-12 max-w-full space-y-6 md:max-w-4/5">
      {/* Main Playlist Card */}
      <div className="bg-card flex flex-col items-center p-4 shadow sm:flex-row">
        {/* Playlist Thumbnail */}
        <div className="mr-4 flex-shrink-0">
          <img
            src={info.thumbnail || "/spotify-cover.png"}
            alt={info.name}
            className="aspect-square w-48 rounded-lg object-cover"
          />
        </div>

        {/* Playlist Content */}
        <div className="flex min-w-0 flex-1 flex-col sm:block">
          {/* Playlist Name */}
          <h3 className="text-foreground my-2 text-center text-lg font-semibold sm:text-left">
            {info.name}
          </h3>

          {/* Playlist Stats */}
          <p className="text-muted-foreground mb-3 text-center text-sm sm:text-left">
            Playlist • {totalCount} tracks
          </p>

          {data.status === "processing" && (
            <div className="mb-3 w-full">
              <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                <span>Current track progress...</span>
                <span>{Math.round(data.progress)}%</span>
              </div>
              <Progress value={data.progress} className="h-2" />
            </div>
          )}

          {/* Download Button (only show when all processing is complete) */}
          {data.status === "completed" && (
            <Button asChild>
              <a
                href={`${import.meta.env.VITE_BACKEND_URL}/api/convert/${id}/download`}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Playlist
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Track Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {info.tracks.map((track, index) => {
          const isProcessed = index < processedCount;
          const isCurrentlyProcessing =
            index === processedCount && data.status === "processing";
          const isPending = index > processedCount;

          return (
            <TrackCard
              key={track.spotifyId || index}
              track={track}
              isProcessed={isProcessed}
              isCurrentlyProcessing={isCurrentlyProcessing}
              isPending={isPending}
              trackNumber={index + 1}
            />
          );
        })}
      </div>
    </div>
  );
}

function TrackCard({
  track,
  isProcessed,
  isCurrentlyProcessing,
  isPending,
  trackNumber,
}: {
  track: SpotifyTrack;
  isProcessed: boolean;
  isCurrentlyProcessing: boolean;
  isPending: boolean;
  trackNumber: number;
}) {
  return (
    <div
      className={`bg-card relative flex items-center space-x-3 rounded-lg p-3 shadow transition-all duration-200 ${
        isPending ? "opacity-50" : "opacity-100"
      } ${isCurrentlyProcessing ? "ring-ring ring-2" : ""}`}
    >
      {/* Track Image */}
      <div className="relative flex-shrink-0">
        <img
          src={track.thumbnail || "/spotify-cover.png"}
          alt={track.name}
          className={`h-12 w-12 rounded object-cover ${
            isPending ? "grayscale" : ""
          }`}
        />

        {/* Status Indicator */}
        <div className="absolute -right-1 -bottom-1">
          {isProcessed && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 dark:bg-green-600">
              <Check className="h-3 w-3" />
            </div>
          )}
          {isCurrentlyProcessing && (
            <div className="bg-ring flex h-5 w-5 items-center justify-center rounded-full text-white">
              <Loader2 className="h-2 w-2 animate-spin" />
            </div>
          )}
          {isPending && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-400">
              <span className="text-xs text-white">{trackNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            isPending ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {track.name}
        </p>
        <p
          className={`truncate text-xs ${
            isPending ? "text-muted-foreground/70" : "text-muted-foreground"
          }`}
        >
          {track.artists.join(", ")}
        </p>
        <p
          className={`text-xs ${
            isPending ? "text-muted-foreground/70" : "text-muted-foreground"
          }`}
        >
          {formatDuration(track.duration, "milliseconds")}
        </p>
      </div>
    </div>
  );
}
