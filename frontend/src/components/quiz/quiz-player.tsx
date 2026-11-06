"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QuizResult, PublicQuizQuestion } from "@/lib/contracts";
import { api } from "@/lib/api/api-client";
import { useToast } from "../ui/toast";
import { SegmentedProgressBar } from "../ui/progress-bar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { QuizResultView } from "./quiz-result";
import {
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Eye,
  Send,
  Loader2,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "../ui/dialog";

interface QuizPlayerProps {
  moduleId: string;
  moduleTitle: string;
  trackSlug: string;
  moduleSlug: string;
  // Browser-safe questions only: the public contract omits both
  // correctOptionIndex AND explanation (Phase 4).
  questions: PublicQuizQuestion[];
}

// Framer Motion variants
const questionVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 30 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.18 },
  }),
};

const optionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" },
  }),
};

export function QuizPlayer({
  moduleId,
  moduleTitle,
  trackSlug,
  moduleSlug,
  questions,
}: QuizPlayerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [direction, setDirection] = React.useState<number>(1);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [showHint, setShowHint] = React.useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<QuizResult | null>(null);
  const [selectedFlash, setSelectedFlash] = React.useState<number | null>(null);

  const currentQuestion = questions[currentIndex];
  const selectedOption = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  // Keyboard handler
  React.useEffect(() => {
    if (result || showReviewModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Ignore shortcuts while a dialog or the command palette is open
      if (document.querySelector("[role='dialog'], [cmdk-root]")) return;
      if (["1","2","3","4"].includes(e.key) && currentQuestion) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < currentQuestion.options.length) {
          e.preventDefault();
          handleSelectOption(idx);
        }
      }
      if (e.key === "Enter" && selectedOption !== undefined) {
        e.preventDefault();
        if (isLastQuestion) setShowReviewModal(true);
        else { setDirection(1); setCurrentIndex((p) => Math.min(questions.length - 1, p + 1)); setShowHint(false); }
      }
      if (e.key.toLowerCase() === "h") { e.preventDefault(); setShowHint((p) => !p); }
      if (e.key.toLowerCase() === "r") { e.preventDefault(); setShowReviewModal(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, selectedOption, isLastQuestion, questions.length, result, showReviewModal]);

  const handleSelectOption = (index: number) => {
    if (!currentQuestion) return;
    setSelectedFlash(index);
    setTimeout(() => setSelectedFlash(null), 300);
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: index }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowReviewModal(true);
    } else {
      setDirection(1);
      setCurrentIndex((p) => p + 1);
      setShowHint(false);
    }
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((p) => Math.max(0, p - 1));
    setShowHint(false);
  };

  const handleSubmit = async () => {
    // D3: the browser submits `{moduleId, answers}` only; grading is fully
    // server-side. Empty submissions are blocked before the request (the
    // backend answers 400 independently).
    if (answeredCount === 0) {
      setSubmitError("Answer at least one question before submitting.");
      setShowReviewModal(true);
      return;
    }

    setShowReviewModal(false);
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await api.submitQuiz({ moduleId, answers });
      setResult(res);
    } catch {
      // Honest failure state (no mock grading fallback exists, by design):
      // refresh restores full attempt history server-side, so no data loss.
      setSubmitError("Grading could not be completed. Please try again.");
      setIsSubmitting(false);
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
    setShowHint(false);
    setSubmitError(null);
    router.refresh();
  };

  if (result) {
    return (
      <QuizResultView
        result={result}
        trackSlug={trackSlug}
        moduleSlug={moduleSlug}
        onRetry={handleRetry}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-mint" />
        <p className="mt-4 text-sm text-foreground/55 font-mono">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-foreground/65 font-mono font-semibold">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-foreground/45">{answeredCount} answered</span>
        </div>
        <SegmentedProgressBar
          totalSegments={questions.length}
          currentSegment={currentIndex}
          completedSegments={Object.keys(answers).map((id) =>
            questions.findIndex((q) => q.id === id)
          )}
        />
      </div>

      {/* Question Card with slide animation */}
      <div className="relative overflow-hidden min-h-[360px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={questionVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl space-y-6"
          >
            {/* Topic & Hint */}
            <div className="flex items-center justify-between">
              <Badge variant="mint" className="text-xs py-0.5">
                {currentQuestion.topic}
              </Badge>

              {currentQuestion.hint && (
                <button
                  onClick={() => setShowHint(!showHint)}
                  aria-label="Toggle hint"
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all duration-150",
                    showHint
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400"
                      : "border-border text-foreground/60 hover:text-foreground hover:bg-slate-100 dark:hover:bg-card-subtle"
                  )}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>{showHint ? "Hide Hint" : "Need a Hint? (H)"}</span>
                </button>
              )}
            </div>

            {/* Question */}
            <h2 className="font-display text-lg sm:text-xl font-bold text-foreground leading-snug">
              {currentQuestion.question}
            </h2>

            {/* Hint reveal */}
            <AnimatePresence>
              {showHint && currentQuestion.hint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-300 leading-relaxed flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <span className="font-bold">Hint: </span>
                      {currentQuestion.hint}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Options */}
            <div className="space-y-3 pt-1">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isFlashing = selectedFlash === idx;
                const numberKey = idx + 1;

                return (
                  <motion.button
                    key={idx}
                    custom={idx}
                    variants={optionVariants}
                    initial="hidden"
                    animate="visible"
                    onClick={() => handleSelectOption(idx)}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "group flex items-start gap-3.5 w-full p-4 rounded-2xl border text-left text-sm transition-all duration-150 relative overflow-hidden",
                      isSelected
                        ? "border-teal-500 bg-teal-50 dark:border-mint dark:bg-mint/10 text-foreground ring-1 ring-teal-500 dark:ring-mint shadow-[0_0_24px_-5px_rgba(94,234,212,0.3)]"
                        : "border-border bg-slate-50 dark:bg-ink-950/60 text-foreground/80 hover:border-slate-300 dark:hover:border-ink-600/50 hover:bg-slate-100 dark:hover:bg-card-subtle hover:text-foreground"
                    )}
                  >
                    {/* Flash overlay */}
                    {isFlashing && (
                      <motion.div
                        initial={{ opacity: 0.4 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-mint/20 pointer-events-none"
                      />
                    )}

                    {/* Number badge */}
                    <span
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-lg text-xs font-mono font-bold shrink-0 transition-all",
                        isSelected
                          ? "bg-teal-600 text-white dark:bg-mint dark:text-ink-950"
                          : "border border-border bg-white dark:bg-card-subtle text-foreground/60 group-hover:text-foreground"
                      )}
                    >
                      {numberKey}
                    </span>

                    <span className="flex-1 leading-relaxed text-sm pt-0.5 font-medium">
                      {option}
                    </span>

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <CheckCircle className="w-5 h-5 text-teal-600 dark:text-mint shrink-0 mt-0.5" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Controls */}
            <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="md"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="text-xs"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Previous
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowReviewModal(true)}
                  className="text-xs hidden sm:inline-flex"
                >
                  <Eye className="w-4 h-4 mr-1.5 text-teal-600 dark:text-mint" /> Review (R)
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  disabled={selectedOption === undefined}
                  className="text-xs font-semibold px-5"
                >
                  {isLastQuestion ? (
                    <>Review & Submit <Send className="w-3.5 h-3.5 ml-1.5" /></>
                  ) : (
                    <>Next Question <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Keyboard hint */}
      <div className="text-center text-[11px] text-foreground/40 font-mono flex items-center justify-center gap-4">
        <span className="flex items-center gap-1.5">
          <Keyboard className="w-3.5 h-3.5" />
          Press
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-slate-100 dark:bg-card-subtle font-bold text-foreground">1-4</kbd>
          to select
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-slate-100 dark:bg-card-subtle font-bold text-foreground">Enter</kbd>
          to advance
        </span>
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogHeader onClose={() => setShowReviewModal(false)}>
          <DialogTitle>Review Answers Before Submitting</DialogTitle>
        </DialogHeader>

        <DialogContent className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <p className="text-xs text-foreground/65">
            You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
            Unanswered questions are scored as incorrect.
          </p>

          <div className="space-y-2">
            {questions.map((q, idx) => {
              const ansIdx = answers[q.id];
              const isAnswered = ansIdx !== undefined;
              return (
                <button
                  key={q.id}
                  onClick={() => { setCurrentIndex(idx); setShowReviewModal(false); }}
                  className="flex items-center justify-between w-full p-3 rounded-xl border border-border bg-slate-50 dark:bg-ink-950/40 hover:bg-slate-100 dark:hover:bg-card-subtle text-left transition-colors text-xs"
                >
                  <div className="truncate pr-3">
                    <span className="font-mono text-foreground/45 mr-2">Q{idx + 1}.</span>
                    <span className="text-foreground font-semibold truncate">{q.question}</span>
                  </div>
                  <Badge variant={isAnswered ? "emerald" : "outline"} className="shrink-0 text-[10px]">
                    {isAnswered ? `Option ${ansIdx + 1}` : "Unanswered"}
                  </Badge>
                </button>
              );
            })}
          </div>
        </DialogContent>

        <DialogFooter>
          <div className="w-full space-y-2">
            {answeredCount === 0 && (
              <p className="text-xs font-mono text-amber-600 dark:text-amber-400">
                No questions answered yet — grading is blocked until you answer
                at least one question.
              </p>
            )}
            {submitError && (
              <p className="text-xs font-mono text-rose-600 dark:text-rose-400" role="alert">
                {submitError}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowReviewModal(false)}>
            Back to Quiz
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            // D3: submitions are blocked at zero answered — the server would
            // 400, and 100%-by-emptiness must be impossible.
            disabled={answeredCount === 0}
            className="font-semibold disabled:opacity-50"
          >
            Submit for Grading (80% to Pass)
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
