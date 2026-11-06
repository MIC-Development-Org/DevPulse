import Link from "next/link";
import {
  ModuleDetailSchema,
  PublicQuizQuestionListSchema,
  TrackDetailSchema,
} from "@devpulse/contracts";
import { backendFetchJson, withNotFound } from "@/lib/bff";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function QuizPage({
  params,
}: {
  params: { track: string; module: string };
}) {
  // Phase 4: real DB-backed content straight from Express (server-to-server).
  // Unknown slugs render the 404 page via withNotFound.
  const [track, moduleData] = await Promise.all([
    withNotFound(
      backendFetchJson(
        `/tracks/${encodeURIComponent(params.track)}`,
        TrackDetailSchema
      )
    ),
    withNotFound(
      backendFetchJson(
        `/tracks/${encodeURIComponent(params.track)}/modules/${encodeURIComponent(params.module)}`,
        ModuleDetailSchema
      )
    ),
  ]);

  // Public questions only (no answer keys/explanations by contract). Empty
  // list = the module has no authored bank yet (honest "coming soon" — never
  // placeholder or fabricated questions).
  const questions = await withNotFound(
    backendFetchJson(
      `/tracks/${encodeURIComponent(track.slug)}/modules/${encodeURIComponent(moduleData.slug)}/quiz`,
      PublicQuizQuestionListSchema
    )
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 relative">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between pb-6 border-b border-border/80">
        <Link
          href={`/learn/${track.slug}/${moduleData.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground font-mono transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Lesson
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="mint" className="text-[11px] font-mono">
            80% PASS THRESHOLD
          </Badge>
          <span className="text-foreground/30">•</span>
          <span className="text-xs text-foreground/50 font-mono">
            SERVER-GRADED
          </span>
        </div>
      </div>

      {/* Quiz Player Container */}
      {questions.length === 0 ? (
        // Authored bank not yet published — no placeholders, ever.
        <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
            <HelpCircle className="h-6 w-6 text-foreground/40" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Quiz not published yet
          </h1>
          <p className="text-sm text-foreground/60 max-w-md mx-auto leading-relaxed">
            The mastery quiz for “{moduleData.title}” is still being authored.
            It will appear here as soon as it is published — we never show
            placeholder questions.
          </p>
          <Link href={`/learn/${track.slug}/${moduleData.slug}`}>
            <Button variant="outline" size="md">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Lesson
            </Button>
          </Link>
        </div>
      ) : (
        <QuizPlayer
          moduleId={moduleData.id}
          moduleTitle={moduleData.title}
          trackSlug={track.slug}
          moduleSlug={moduleData.slug}
          questions={questions}
        />
      )}
    </div>
  );
}

