"use client";

import * as React from "react";
import { EmbeddedVideo } from "@/lib/contracts";
import { Play, ExternalLink, Clock, ShieldCheck, Video } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: EmbeddedVideo;
  className?: string;
}

export function VideoCard({ video, className }: VideoCardProps) {
  const [currentSeconds, setCurrentSeconds] = React.useState<number>(0);
  const [hasError, setHasError] = React.useState<boolean>(false);

  const youtubeUrl = `https://www.youtube.com/embed/${video.youtubeId}?start=${currentSeconds}&rel=0`;
  const directWatchUrl = `https://www.youtube.com/watch?v=${video.youtubeId}${
    currentSeconds > 0 ? `&t=${currentSeconds}s` : ""
  }`;

  return (
    <div
      className={cn(
        "my-8 rounded-2xl border border-border bg-card overflow-hidden shadow-xl",
        className
      )}
    >
      {/* Video Player Frame or Fallback */}
      <div className="relative aspect-video w-full bg-ink-950 flex items-center justify-center">
        {!hasError ? (
          <iframe
            src={youtubeUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={() => setHasError(true)}
            className="w-full h-full border-0"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <Video className="w-12 h-12 text-slate-500" />
            <p className="text-sm text-slate-300 font-medium max-w-sm">
              Embedded player unavailable or restricted in your browser
            </p>
            <a
              href={directWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-mint hover:underline"
            >
              Open on YouTube <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Video Meta & Attribution */}
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="font-display text-base font-semibold text-foreground">
              {video.title}
            </h4>
            <p className="text-xs text-foreground/60 mt-0.5">
              Creator: <span className="font-medium text-foreground/90">{video.channel}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="mint" className="text-[10px]">
              <ShieldCheck className="w-3 h-3 mr-1" />
              {video.license}
            </Badge>

            <a
              href={directWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground border border-border rounded-lg px-2.5 py-1 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Watch on YouTube</span>
            </a>
          </div>
        </div>

        {/* Chapter Timestamps */}
        {video.chapters && video.chapters.length > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-mint" /> Chapter Timestamps
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {video.chapters.map((chapter) => (
                <button
                  key={chapter.timestamp}
                  onClick={() => setCurrentSeconds(chapter.seconds)}
                  className={cn(
                    "flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left transition-colors border",
                    currentSeconds === chapter.seconds
                      ? "bg-mint/10 border-mint/30 text-mint font-semibold"
                      : "bg-card-subtle/50 border-border/50 text-foreground/70 hover:bg-card-subtle hover:text-foreground"
                  )}
                >
                  <span className="truncate pr-2">{chapter.title}</span>
                  <span className="font-mono text-[11px] text-foreground/50 shrink-0">
                    {chapter.timestamp}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

