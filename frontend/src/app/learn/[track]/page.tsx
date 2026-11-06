import Link from "next/link";
import { TrackDetailSchema } from "@devpulse/contracts";
import { api } from "@/lib/api/api-client";
import { backendFetchJson, withNotFound } from "@/lib/bff";
import { LearningTrail } from "@/components/trail/learning-trail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, BookOpen, CheckCircle2 } from "lucide-react";

export default async function TrackPage({
  params,
}: {
  params: { track: string };
}) {
  // Phase 4: real DB-backed content straight from Express (server-to-server).
  // Unknown slugs render the 404 page via withNotFound; anything else bubbles
  // to the error boundary — no silent mock fallback.
  const track = await withNotFound(
    backendFetchJson(
      `/tracks/${encodeURIComponent(params.track)}`,
      TrackDetailSchema
    )
  );
  // Phase 4 boundary: user profile remains mock until Phase 5.
  const user = await api.getUserProfile();

  const completedCount = track.modules.filter((m) =>
    user.completedModuleIds.includes(m.id)
  ).length;
  const pct = Math.round((completedCount / track.modules.length) * 100);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All Tracks
        </Link>
      </div>

      {/* Track Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden bg-aurora">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <Badge variant={track.color} className="text-xs font-mono">
              Track 0{track.trackNumber}
            </Badge>
            <span className="text-foreground/30">•</span>
            <span className="text-xs font-medium text-foreground/60">
              {track.subtitle}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            {track.title}
          </h1>

          <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
            {track.description}
          </p>

          <div className="flex items-center gap-6 pt-1 text-xs text-foreground/60 font-mono">
            <span>{track.moduleCount} total modules</span>
            <span>~{track.estimatedHours} hours</span>
            <span className="text-mint font-semibold">{pct}% Completed</span>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="p-4 rounded-2xl border border-border bg-card-subtle/80 text-center shrink-0 w-full md:w-auto">
          <span className="font-display text-3xl font-bold text-mint">
            {completedCount} / {track.modules.length}
          </span>
          <p className="text-xs text-foreground/60 mt-0.5">Modules Completed</p>
        </div>
      </div>

      {/* Interactive Learning Trail with Hex Nodes */}
      <LearningTrail track={track} user={user} />
    </div>
  );
}

