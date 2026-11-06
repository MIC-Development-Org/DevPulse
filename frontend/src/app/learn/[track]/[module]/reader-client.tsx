"use client";

import * as React from "react";
import Link from "next/link";
import { Track, ModuleMeta, ModuleDetail } from "@/lib/contracts";
import { TableOfContents, TocItem } from "@/components/reader/table-of-contents";
import { Callout } from "@/components/reader/callout";
import { CodeBlock } from "@/components/reader/code-block";
import { VideoCard } from "@/components/reader/video-card";
import { ModuleNotes } from "@/components/reader/module-notes";
import { GitVisualizer } from "@/components/interactive/git-visualizer";
import { CheatSheetModal } from "@/components/reader/cheat-sheet-modal";
import { ProgressStartBeacon } from "@/components/reader/progress-start-beacon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addXP } from "@/lib/gamification/xp";
import { XPGainToast } from "@/components/gamification/achievement-toast";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  FileCode2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ListTodo,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleReaderClientProps {
  track: Track;
  moduleData: ModuleDetail;
  prevModule: ModuleMeta | null;
  nextModule: ModuleMeta | null;
}

export function ModuleReaderClient({
  track,
  moduleData,
  prevModule,
  nextModule,
}: ModuleReaderClientProps) {
  const [cheatSheetOpen, setCheatSheetOpen] = React.useState<boolean>(false);
  const [practiceCompleted, setPracticeCompleted] = React.useState<boolean>(false);
  const [showXpToast, setShowXpToast] = React.useState<boolean>(false);
  const practiceXpAwardedRef = React.useRef<boolean>(false);

  const handleTogglePractice = () => {
    const nextState = !practiceCompleted;
    setPracticeCompleted(nextState);
    // Award XP only the first time the task is completed (no farming)
    if (nextState && !practiceXpAwardedRef.current) {
      practiceXpAwardedRef.current = true;
      addXP(100);
      setShowXpToast(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("devpulse:xp-gain"));
      }
    }
  };

  const tocItems: TocItem[] = [
    { id: "learning-goals", title: "1. Learning Goals", level: 2 },
    { id: "core-concept", title: "2. Core Concept & Internals", level: 2 },
    ...(moduleData.hasGitVisualizer
      ? [{ id: "interactive-tool", title: "3. Interactive Git Visualiser", level: 2 }]
      : []),
    ...(moduleData.video
      ? [{ id: "video-deep-dive", title: "4. Video Lecture", level: 2 }]
      : []),
    { id: "worked-example", title: "5. Worked Example", level: 2 },
    { id: "common-mistakes", title: "6. Common Mistakes", level: 2 },
    { id: "practice-task", title: "7. Hands-on Practice", level: 2 },
    { id: "summary", title: "8. Summary & Next Steps", level: 2 },
    { id: "citations", title: "9. Further Reading & Citations", level: 2 },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Phase 5: opening a module records engagement (never completes it). */}
      <ProgressStartBeacon moduleId={moduleData.id} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
          <Link
            href={`/learn/${track.slug}`}
            className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to {track.title} Trail
          </Link>

          <div className="flex items-center gap-2">
            {moduleData.cheatSheet && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCheatSheetOpen(true)}
                className="text-xs h-8"
              >
                <FileCode2 className="w-3.5 h-3.5 text-mint mr-1.5" /> Cheat Sheet
              </Button>
            )}

            {moduleData.quizQuestionCount > 0 ? (
              <Link href={`/learn/${track.slug}/${moduleData.slug}/quiz`}>
                <Button variant="primary" size="sm" className="text-xs h-8 font-semibold">
                  Take Quiz <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            ) : (
              // Authored quiz bank not published yet — honest coming-soon chip.
              <span
                className="inline-flex items-center h-8 px-2.5 rounded-md border border-border bg-card-subtle/60 text-[11px] font-mono text-foreground/40"
                aria-disabled
                title="The mastery quiz for this module has not been published yet"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" /> Quiz coming soon
              </span>
            )}
          </div>
        </div>

        {/* Module Reader Header */}
        <header className="space-y-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={track.color} className="text-xs font-mono">
              Track 0{track.trackNumber}
            </Badge>
            <span className="text-foreground/30">•</span>
            <span className="font-mono text-xs text-foreground/50">
              Module 0{track.trackNumber}.{moduleData.order}
            </span>
            <span className="text-foreground/30">•</span>
            <span className="font-mono text-xs text-mint flex items-center gap-1">
              <Clock className="w-3 h-3" /> ~{moduleData.estimatedMinutes} min read
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
            {moduleData.title}
          </h1>

          <p className="text-base sm:text-lg text-foreground/70 leading-relaxed">
            {moduleData.description}
          </p>
        </header>

        {/* 2-Column Reader Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Reading Column (8 cols) */}
          <article className="lg:col-span-8 space-y-12 text-foreground/90 leading-relaxed text-sm sm:text-base">
            {/* 1. LEARNING GOALS */}
            <section id="learning-goals" className="scroll-mt-24 space-y-4">
              <div className="rounded-2xl border border-mint/20 bg-mint/5 p-5 space-y-3">
                <h2 className="font-display text-base font-semibold text-mint flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Core Learning Outcomes
                </h2>
                <ul className="space-y-2 text-xs sm:text-sm text-foreground/80">
                  {moduleData.learningOutcomes.map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-mint shrink-0 mt-0.5" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 2. CONCEPT DEEP DIVE */}
            <section id="core-concept" className="scroll-mt-24 space-y-6">
              <h2 className="font-display text-2xl font-bold text-foreground">
                2. Core Concept & Architectural Internals
              </h2>

              {moduleData.slug === "git-basics" ? (
                <div className="space-y-4 text-foreground/80 leading-relaxed">
                  <p>
                    Git is fundamentally not a delta-based version control system like Subversion or Perforce. Underneath porcelain commands like <code>git add</code> and <code>git commit</code>, Git is a <strong>content-addressable directed acyclic graph (DAG)</strong> layered on top of an immutable key-value object store.
                  </p>

                  <p>
                    Every entity in Git is identified by the SHA cryptographic hash of its payload. Git recognizes four primitive object types:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                    <div className="p-3.5 rounded-xl border border-border bg-slate-50 dark:bg-ink-950/40 shadow-sm">
                      <strong className="text-teal-700 dark:text-mint text-xs font-mono block mb-1">1. Blobs (Binary Large Objects)</strong>
                      <p className="text-xs text-foreground/70">
                        Stores compressed file content bytes. Blobs contain neither filenames nor permission bits.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border bg-slate-50 dark:bg-ink-950/40 shadow-sm">
                      <strong className="text-teal-700 dark:text-mint text-xs font-mono block mb-1">2. Trees</strong>
                      <p className="text-xs text-foreground/70">
                        Equivalent to directories. Maps human-readable filenames to blob SHAs or sub-tree SHAs.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border bg-slate-50 dark:bg-ink-950/40 shadow-sm">
                      <strong className="text-teal-700 dark:text-mint text-xs font-mono block mb-1">3. Commits</strong>
                      <p className="text-xs text-foreground/70">
                        A snapshot pointer containing the root Tree SHA, parent commit SHAs, author metadata, and message.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border bg-slate-50 dark:bg-ink-950/40 shadow-sm">
                      <strong className="text-teal-700 dark:text-mint text-xs font-mono block mb-1">4. Annotated Tags</strong>
                      <p className="text-xs text-foreground/70">
                        Permanent cryptographic pointers to specific commit hashes, signed with GPG keys.
                      </p>
                    </div>
                  </div>

                  <Callout type="tip" title="The Content-Addressable Invariant">
                    If two files in completely different folders or branches have identical byte contents, Git stores only <strong>one single blob object</strong> on disk in <code>.git/objects/</code>. Both directory trees simply point to the exact same SHA hash!
                  </Callout>
                </div>
              ) : moduleData.slug === "react" ? (
                <div className="space-y-4 text-foreground/80 leading-relaxed">
                  <p>
                    React 18&apos;s concurrency is founded upon the <strong>Fiber Reconciliation Engine</strong>. Prior to Fiber, React utilized the synchronous Stack Reconciler, which traversed the component tree recursively. If a render pass took 45ms, the browser main thread would be blocked, dropping animation frames and delaying user keystrokes.
                  </p>

                  <p>
                    Fiber completely restructured reconciliation into a <strong>singly-linked list work loop</strong> with interruptible priority lanes:
                  </p>

                  <div className="p-4 rounded-xl border border-border bg-slate-900 dark:bg-ink-950 font-mono text-xs text-mint space-y-1 shadow-sm">
                    <p className="text-foreground/40">// Fiber Node Pointer Architecture</p>
                    <p>fiber.child       -&gt; points to first immediate child</p>
                    <p>fiber.sibling     -&gt; points to adjacent child node</p>
                    <p>fiber.return      -&gt; points to parent container</p>
                    <p>fiber.alternate   -&gt; points to mirrored buffer tree</p>
                  </div>

                  <Callout type="note" title="Double Buffering Mechanics">
                    Just like high-performance graphics engines, React operates two trees simultaneously: <code>current</code> (rendered on the user&apos;s screen) and <code>workInProgress</code> (built incrementally off-screen). During the Commit phase, React simply swaps the pointer in a single synchronous tick!
                  </Callout>
                </div>
              ) : (
                <div className="space-y-4 text-foreground/80 leading-relaxed">
                  <p>
                    This module covers core production architecture, RFC specifications, and mental models essential for this discipline. Review the worked examples and common pitfalls below.
                  </p>
                </div>
              )}
            </section>

            {/* 3. INTERACTIVE GIT VISUALISER (If applicable) */}
            {moduleData.hasGitVisualizer && (
              <section id="interactive-tool" className="scroll-mt-24 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    3. Interactive Git Visualiser
                  </h2>
                  <Badge variant="mint" className="text-xs">
                    Live Simulator
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-foreground/70">
                  Execute Git porcelain commands below to observe real-time DAG mutation, branch pointer shifts, and merge commit creation.
                </p>

                <GitVisualizer />
              </section>
            )}

            {/* 4. EMBEDDED VIDEO CARD (If present) */}
            {moduleData.video && (
              <section id="video-deep-dive" className="scroll-mt-24 space-y-4">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  4. Curated Video Lecture
                </h2>
                <VideoCard video={moduleData.video} />
              </section>
            )}

            {/* 5. WORKED EXAMPLE */}
            <section id="worked-example" className="scroll-mt-24 space-y-4">
              <h2 className="font-display text-2xl font-bold text-foreground">
                5. Worked Example & Code Patterns
              </h2>

              {moduleData.slug === "git-basics" ? (
                <>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Here is how to inspect Git&apos;s raw internal plumbing directly in your terminal using <code>git cat-file</code> and <code>git rev-parse</code>:
                  </p>

                  <CodeBlock
                    language="bash"
                    filename="git-internals-demo.sh"
                    code={`# 1. Discover the commit SHA that HEAD points to
$ git rev-parse HEAD
b49de8a71923cb912048f0293e8912301fec841a

# 2. Inspect the commit object (type, size, contents)
$ git cat-file -p HEAD
tree 4f981a2938dc81a982103f9821389021a839d012
parent 3f7bc901a823901bcae812903123891023a98123
author Alex Rivera <alex@micdev.org> 1730563200 +0000
committer Alex Rivera <alex@micdev.org> 1730563200 +0000

Add responsive layout grid

# 3. Inspect the root Tree object pointed to by the commit
$ git cat-file -p 4f981a2938dc81a982103f9821389021a839d012
100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    index.html
100644 blob 8a123f098231a098213908123908120398120398    style.css
040000 tree d123908120398120398120398120398120398120    src/`}
                    highlightLines={[2, 6, 15]}
                  />
                </>
              ) : moduleData.slug === "react" ? (
                <>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Implementing non-blocking concurrent transitions using <code>useTransition</code> with optimistic fallback:
                  </p>

                  <CodeBlock
                    language="tsx"
                    filename="FilterableCatalog.tsx"
                    code={`import React, { useState, useTransition } from 'react';

export function FilterableCatalog({ items }: { items: Product[] }) {
  const [filter, setFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextQuery = e.target.value;
    
    // Urgent update: Input reflects keystrokes immediately
    setFilter(nextQuery);

    // Non-urgent transition: Complex graph sorting & recalculation
    startTransition(() => {
      // Fiber reconciliation executes in low-priority lane
      // Interruptible by next keystroke!
    });
  };

  return (
    <div className="space-y-4">
      <input 
        value={filter} 
        onChange={handleFilterChange} 
        className="input" 
        placeholder="Search 10,000 items..."
      />
      {isPending && <span className="text-xs text-mint">Updating results...</span>}
    </div>
  );
}`}
                    highlightLines={[6, 12, 17]}
                  />
                </>
              ) : (
                <CodeBlock
                  language="typescript"
                  code={`// Example implementation\nexport async function executeModuleWorkflow() {\n  const res = await fetch('/api/v1/resource');\n  return res.json();\n}`}
                />
              )}
            </section>

            {/* 6. COMMON MISTAKES */}
            <section id="common-mistakes" className="scroll-mt-24 space-y-4">
              <h2 className="font-display text-2xl font-bold text-foreground">
                6. Common Production Mistakes
              </h2>

              {moduleData.slug === "git-basics" ? (
                <>
                  <Callout type="mistake" title="Mistake: Running 'git rebase' on Shared Remote Branches">
                    Rebasing rewrites commit hashes. If you rebase a branch that teammates have already pulled, their local histories will diverge, causing chaotic duplicate merge commits when pushed back. <em>Rule: Never rebase commits that exist on remote main.</em>
                  </Callout>

                  <Callout type="warning" title="Accidentally Discarding Work with 'git reset --hard'">
                    Unlike <code>git reset --soft</code>, <code>git reset --hard</code> forcefully overwrites uncommitted working tree changes. If you haven&apos;t committed your changes to at least a temporary branch, those files cannot be recovered via <code>git reflog</code>!
                  </Callout>
                </>
              ) : moduleData.slug === "react" ? (
                <>
                  <Callout type="mistake" title="Mistake: Dependency Array Closures in useEffect">
                    Omitting state variables from the dependency array to prevent effect re-runs causes the effect function to capture a stale closure of state from the initial render pass, resulting in subtle calculation bugs.
                  </Callout>

                  <Callout type="warning" title="Indiscriminate useMemo Overuse">
                    Wrapping every single primitive arithmetic operation or inline object in <code>useMemo</code> adds memory allocation overhead for the dependency array and comparison checks that often cost more than re-evaluating the operation.
                  </Callout>
                </>
              ) : (
                <Callout type="mistake" title="Common Configuration Oversight">
                  Failing to validate inputs at runtime boundary before state mutation.
                </Callout>
              )}
            </section>

            {/* 7. PRACTICE TASK */}
            <section id="practice-task" className="scroll-mt-24 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-mint" />
                    <h2 className="font-display text-lg font-bold text-foreground">
                      Hands-on Practice Task
                    </h2>
                  </div>
                  <Badge variant={practiceCompleted ? "emerald" : "outline"} className="text-xs">
                    {practiceCompleted ? "Task Completed" : "Action Required"}
                  </Badge>
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed">
                  {moduleData.slug === "git-basics"
                    ? "In the interactive visualizer above or in your local shell: Create a new branch named 'feature/tokens', commit two simulated changes, switch back to 'main', and merge 'feature/tokens' using a 3-way merge strategy."
                    : "Refactor a component that renders a large array: identify unnecessary re-renders using React DevTools Profiler and introduce useTransition to eliminate input latency."}
                </p>

                {/* Interactive Completion Toggle */}
                <div className="pt-2">
                  <button
                    onClick={handleTogglePractice}
                    className={cn(
                      "flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all",
                      practiceCompleted
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-card-subtle border-border text-foreground/70 hover:text-foreground"
                    )}
                  >
                    {practiceCompleted ? (
                      <>
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Completed Practice Task</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        <span>Mark Practice Task Complete</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Collapsible Solution Block */}
                <CodeBlock
                  isCollapsible
                  defaultExpanded={false}
                  language="bash"
                  filename="Solution Steps"
                  code={`# Step 1: Create and switch to new branch
git switch -c feature/tokens

# Step 2: Make two commits
git commit -m "feat: add color tokens"
git commit -m "feat: add typography clamp tokens"

# Step 3: Switch back to main
git switch main

# Step 4: Perform 3-way merge without fast-forward
git merge --no-ff feature/tokens -m "merge: incorporate design tokens"`}
                />
              </div>
            </section>

            {/* 8. SUMMARY */}
            <section id="summary" className="scroll-mt-24 space-y-4">
              <h2 className="font-display text-2xl font-bold text-foreground">
                8. Summary & Mastery Check
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed">
                You have examined the internal state mechanics of this topic. To
                complete this module and unlock the next milestone on the track
                trail, you must pass the{" "}
                {moduleData.quizQuestionCount > 0
                  ? `${moduleData.quizQuestionCount}-question mastery quiz with a minimum score of `
                  : "mastery quiz with a minimum score of "}
                <strong>80%</strong>
                {moduleData.quizQuestionCount > 0
                  ? "."
                  : " as soon as the authored quiz is published."}
              </p>

              <div className="pt-2">
                {moduleData.quizQuestionCount > 0 ? (
                  <Link href={`/learn/${track.slug}/${moduleData.slug}/quiz`}>
                    <Button size="lg" variant="primary" className="font-semibold shadow-lg">
                      Launch Mastery Quiz (80% Required) <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  // Authored quiz bank not published yet — honest coming-soon chip.
                  <span
                    className="inline-flex items-center h-10 pl-4 pr-5 rounded-lg border border-border bg-card-subtle/60 text-sm font-mono text-foreground/40"
                    aria-disabled
                    title="The mastery quiz for this module has not been published yet"
                  >
                    <Clock className="w-4 h-4 mr-2" /> Mastery quiz coming soon
                  </span>
                )}
              </div>
            </section>

            {/* 9. CITATIONS & FURTHER READING */}
            <section id="citations" className="scroll-mt-24 space-y-4 pt-6 border-t border-border">
              <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-mint" /> Cited Sources & Further Reading
              </h2>
              <p className="text-xs text-foreground/60">
                DevPulse adheres to strict academic citation hygiene. All external sources are credited below:
              </p>

              <div className="space-y-2">
                {moduleData.sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-border bg-slate-50 dark:bg-ink-950/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{source.title}</p>
                      <p className="text-[11px] text-foreground/50">
                        License: <span className="font-mono text-mint">{source.license}</span>
                      </p>
                    </div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-mint hover:underline font-semibold shrink-0"
                    >
                      Visit Source <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* Prev / Next Navigation Footer */}
            <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              {prevModule ? (
                <Link href={`/learn/${track.slug}/${prevModule.slug}`} className="w-full sm:w-auto">
                  <Button variant="outline" size="md" className="w-full text-xs">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous: {prevModule.title}
                  </Button>
                </Link>
              ) : (
                <div />
              )}

              {nextModule ? (
                <Link href={`/learn/${track.slug}/${nextModule.slug}`} className="w-full sm:w-auto">
                  <Button variant="secondary" size="md" className="w-full text-xs font-semibold">
                    Next: {nextModule.title}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href={`/learn/${track.slug}`} className="w-full sm:w-auto">
                  <Button variant="secondary" size="md" className="w-full text-xs font-semibold">
                    Return to Track Path <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </article>

          {/* Right Sticky Sidebar (4 cols) */}
          <aside className="lg:col-span-4 space-y-6 sticky top-20">
            {/* Table of Contents */}
            <TableOfContents items={tocItems} />

            {/* Private Autosaved Notes Card */}
            <ModuleNotes
              moduleId={moduleData.id}
              moduleTitle={moduleData.title}
            />
          </aside>
        </div>
      </div>

      {/* Cheat Sheet Modal */}
      {moduleData.cheatSheet && (
        <CheatSheetModal
          cheatSheet={moduleData.cheatSheet}
          moduleTitle={moduleData.title}
          open={cheatSheetOpen}
          onOpenChange={setCheatSheetOpen}
        />
      )}

      {/* Gamification XP Toast */}
      {showXpToast && (
        <XPGainToast
          amount={100}
          label="Hands-on Practice Mastered"
          onDismiss={() => setShowXpToast(false)}
        />
      )}
    </div>
  );
}

