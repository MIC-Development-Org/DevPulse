import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api/api-client";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function QuizPage({
  params,
}: {
  params: { track: string; module: string };
}) {
  const track = await api.getTrackBySlug(params.track);
  if (!track) notFound();

  const moduleData = await api.getModuleBySlug(params.track, params.module);
  if (!moduleData) notFound();

  const questions = await api.getQuizQuestions(moduleData.id);

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
      <QuizPlayer
        moduleId={moduleData.id}
        moduleTitle={moduleData.title}
        trackSlug={track.slug}
        moduleSlug={moduleData.slug}
        questions={questions}
      />
    </div>
  );
}

