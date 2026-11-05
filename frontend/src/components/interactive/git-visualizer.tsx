"use client";

import * as React from "react";
import {
  GitBranch,
  GitCommit,
  GitMerge,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  HelpCircle,
  Eye,
  FileCode,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

export interface CommitNode {
  id: string; // short SHA
  fullSha: string;
  message: string;
  author: string;
  timestamp: string;
  parents: string[];
  branchName?: string;
  filesChanged?: { name: string; additions: number; deletions: number }[];
  lane: number; // 0 = main (middle), -1 = upper branch, 1 = lower branch
  step: number; // horizontal column index (0, 1, 2...)
}

const INITIAL_COMMITS: CommitNode[] = [
  {
    id: "c18a4",
    fullSha: "c18a49f82d129038ba718921a902189031238910",
    message: "Initial repository commit",
    author: "Alex Rivera <alex@micdev.org>",
    timestamp: "2 days ago",
    parents: [],
    lane: 0,
    step: 0,
    filesChanged: [{ name: "README.md", additions: 15, deletions: 0 }],
  },
  {
    id: "e92f1",
    fullSha: "e92f109283ba1290831a98210398120398120398",
    message: "Add basic HTML layout structure",
    author: "Alex Rivera <alex@micdev.org>",
    timestamp: "1 day ago",
    parents: ["c18a4"],
    lane: 0,
    step: 1,
    filesChanged: [
      { name: "index.html", additions: 42, deletions: 0 },
      { name: "style.css", additions: 28, deletions: 0 },
    ],
  },
  {
    id: "3f7bc",
    fullSha: "3f7bc901a823901bcae812903123891023a98123",
    message: "Implement navigation bar and hero",
    author: "Alex Rivera <alex@micdev.org>",
    timestamp: "18 hours ago",
    parents: ["e92f1"],
    lane: 0,
    step: 2,
    filesChanged: [{ name: "src/navbar.ts", additions: 35, deletions: 4 }],
  },
  {
    id: "b49de",
    fullSha: "b49de8a71923cb912048f0293e8912301fec841a",
    message: "Add responsive grid layout clamps",
    author: "Alex Rivera <alex@micdev.org>",
    timestamp: "6 hours ago",
    parents: ["3f7bc"],
    lane: -1, // upper lane
    step: 3,
    filesChanged: [{ name: "src/grid.css", additions: 19, deletions: 2 }],
  },
  {
    id: "7a15c",
    fullSha: "7a15c89120381092381209381209381209381209",
    message: "Draft auth token middleware validation",
    author: "Alex Rivera <alex@micdev.org>",
    timestamp: "2 hours ago",
    parents: ["3f7bc"],
    lane: 1, // lower lane
    step: 3,
    filesChanged: [{ name: "src/auth.ts", additions: 54, deletions: 0 }],
  },
];

const INITIAL_BRANCHES: Record<string, string> = {
  main: "3f7bc",
  "feature/ui": "b49de",
  "feature/auth": "7a15c",
};

export function GitVisualizer({ className }: { className?: string }) {
  const [commits, setCommits] = React.useState<CommitNode[]>(INITIAL_COMMITS);
  const [branches, setBranches] = React.useState<Record<string, string>>(INITIAL_BRANCHES);
  const [headBranch, setHeadBranch] = React.useState<string>("main");
  const [selectedCommitId, setSelectedCommitId] = React.useState<string>("3f7bc");
  const [commandInput, setCommandInput] = React.useState<string>("");
  const [terminalLogs, setTerminalLogs] = React.useState<string[]>([
    "DevPulse Git DAG Engine v3.0 (Interactive Plumbing & Porcelain)",
    "HEAD pointing to branch 'main' (commit 3f7bc)",
    "Type 'help' or click presets to interact with the repository.",
  ]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const canvasScrollRef = React.useRef<HTMLDivElement | null>(null);

  const activeCommitId = branches[headBranch] || commits[commits.length - 1].id;
  const inspectedCommit = commits.find((c) => c.id === selectedCommitId) || commits[commits.length - 1];

  // Auto-scroll canvas to rightmost commit when commits change
  React.useEffect(() => {
    if (canvasScrollRef.current) {
      canvasScrollRef.current.scrollTo({
        left: canvasScrollRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  }, [commits]);

  const executeCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      try {
        if (trimmed === "help" || trimmed === "git help") {
          setTerminalLogs((prev) => [
            ...prev,
            `$ ${trimmed}`,
            "Available Commands:",
            "  git commit -m \"<message>\"    - Create a commit on active branch",
            "  git branch <name>             - Create new branch reference",
            "  git branch                    - List all branch heads",
            "  git checkout <name>           - Switch to branch",
            "  git checkout -b <name>        - Create & switch to branch",
            "  git switch <name>             - Switch branch",
            "  git switch -c <name>          - Create & switch branch",
            "  git merge <branch>            - Create true 3-way merge commit",
            "  git reset --soft HEAD~1       - Move branch head back one commit",
            "  git log                       - Print history graph",
            "  git status                    - Check working tree state",
          ]);
          setIsLoading(false);
          return;
        }

        if (!trimmed.startsWith("git")) {
          throw new Error("Command must start with 'git' (e.g. 'git commit', 'git status', 'help')");
        }

        const parts = trimmed.split(" ").filter(Boolean);
        const sub = parts[1];

        if (sub === "status") {
          setTerminalLogs((prev) => [
            ...prev,
            `$ ${trimmed}`,
            `On branch ${headBranch}`,
            "Your branch is up to date with 'origin/" + headBranch + "'.",
            "nothing to commit, working tree clean",
          ]);
        } else if (sub === "log") {
          const logLines = commits
            .slice()
            .reverse()
            .map((c) => `* ${c.id} - (${c.author.split("<")[0].trim()}) ${c.message}`);
          setTerminalLogs((prev) => [...prev, `$ ${trimmed}`, ...logLines.slice(0, 6)]);
        } else if (sub === "branch" && parts.length === 2) {
          // git branch (list)
          const list = Object.keys(branches).map((b) => (b === headBranch ? `* ${b}` : `  ${b}`));
          setTerminalLogs((prev) => [...prev, `$ ${trimmed}`, ...list]);
        } else if (sub === "branch" && parts.length > 2) {
          // git branch <name>
          const newBranchName = parts[2];
          if (branches[newBranchName]) {
            throw new Error(`fatal: A branch named '${newBranchName}' already exists.`);
          }
          setBranches((prev) => ({ ...prev, [newBranchName]: activeCommitId }));
          setTerminalLogs((prev) => [
            ...prev,
            `$ ${trimmed}`,
            `Created branch '${newBranchName}' at ${activeCommitId}`,
          ]);
        } else if (sub === "checkout" || sub === "switch") {
          const isCreate = parts.includes("-b") || parts.includes("-c");
          const target = parts[parts.length - 1];

          if (isCreate) {
            setBranches((prev) => ({ ...prev, [target]: activeCommitId }));
            setHeadBranch(target);
            setSelectedCommitId(activeCommitId);
            setTerminalLogs((prev) => [
              ...prev,
              `$ ${trimmed}`,
              `Switched to a new branch '${target}'`,
            ]);
          } else if (branches[target]) {
            setHeadBranch(target);
            setSelectedCommitId(branches[target]);
            setTerminalLogs((prev) => [
              ...prev,
              `$ ${trimmed}`,
              `Switched to branch '${target}'`,
            ]);
          } else {
            // Checkout a commit SHA (detached HEAD)
            const commit = commits.find((c) => c.id === target);
            if (commit) {
              setSelectedCommitId(commit.id);
              setTerminalLogs((prev) => [
                ...prev,
                `$ ${trimmed}`,
                `Note: switching to '${target}'.`,
                `HEAD is now detached at ${target}`,
              ]);
            } else {
              throw new Error(`error: pathspec '${target}' did not match any branch or commit known to git`);
            }
          }
        } else if (sub === "commit") {
          const match = trimmed.match(/-m\s+["'](.+)["']/);
          const msg = match ? match[1] : "Update module implementation";
          const newSha = Math.random().toString(36).substring(2, 7);
          const current = commits.find((c) => c.id === activeCommitId) || commits[commits.length - 1];

          const newStep = current.step + 1;
          const newCommit: CommitNode = {
            id: newSha,
            fullSha: `${newSha}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
            message: msg,
            author: "Alex Rivera <alex@micdev.org>",
            timestamp: "just now",
            parents: [activeCommitId],
            lane: current.lane,
            step: newStep,
            filesChanged: [{ name: "src/changes.ts", additions: 14, deletions: 1 }],
          };

          setCommits((prev) => [...prev, newCommit]);
          setBranches((prev) => ({ ...prev, [headBranch]: newSha }));
          setSelectedCommitId(newSha);
          setTerminalLogs((prev) => [
            ...prev,
            `$ ${trimmed}`,
            `[${headBranch} ${newSha}] ${msg}`,
            " 1 file changed, 14 insertions(+), 1 deletion(-)",
          ]);
        } else if (sub === "merge") {
          const incoming = parts[2];
          const incomingSha = branches[incoming];
          if (!incomingSha) {
            throw new Error(`merge: ${incoming} - not something we can merge`);
          }
          if (incoming === headBranch) {
            throw new Error(`Already up to date with self.`);
          }

          const mergeSha = Math.random().toString(36).substring(2, 7);
          const current = commits.find((c) => c.id === activeCommitId) || commits[commits.length - 1];
          const incomingCommit = commits.find((c) => c.id === incomingSha) || commits[commits.length - 1];
          const maxStep = Math.max(current.step, incomingCommit.step) + 1;

          const mergeCommit: CommitNode = {
            id: mergeSha,
            fullSha: `${mergeSha}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
            message: `Merge branch '${incoming}' into ${headBranch}`,
            author: "Alex Rivera <alex@micdev.org>",
            timestamp: "just now",
            parents: [activeCommitId, incomingSha],
            lane: 0, // merge into main lane
            step: maxStep,
            filesChanged: [{ name: "src/merged-feature.ts", additions: 68, deletions: 5 }],
          };

          setCommits((prev) => [...prev, mergeCommit]);
          setBranches((prev) => ({ ...prev, [headBranch]: mergeSha }));
          setSelectedCommitId(mergeSha);
          setTerminalLogs((prev) => [
            ...prev,
            `$ ${trimmed}`,
            `Merge made by the 'ort' strategy.`,
            `Created 3-way merge commit ${mergeSha}`,
          ]);
        } else if (sub === "reset") {
          const current = commits.find((c) => c.id === activeCommitId);
          if (current && current.parents.length > 0) {
            const parentSha = current.parents[0];
            setBranches((prev) => ({ ...prev, [headBranch]: parentSha }));
            setSelectedCommitId(parentSha);
            setTerminalLogs((prev) => [
              ...prev,
              `$ ${trimmed}`,
              `HEAD is now at ${parentSha}`,
            ]);
          } else {
            throw new Error("Cannot reset root commit");
          }
        } else {
          throw new Error(`git: '${sub}' is unrecognized. Type 'help' for available commands.`);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message);
        setTerminalLogs((prev) => [...prev, `$ ${trimmed}`, `ERR: ${error.message}`]);
      } finally {
        setIsLoading(false);
        setCommandInput("");
      }
    }, 200);
  };

  const handleResetSession = () => {
    setCommits(INITIAL_COMMITS);
    setBranches(INITIAL_BRANCHES);
    setHeadBranch("main");
    setSelectedCommitId("3f7bc");
    setErrorMsg(null);
    setTerminalLogs(["Session reset to default repository state."]);
  };

  // Node coordinate calculations
  const maxStep = Math.max(...commits.map((c) => c.step), 4);
  const svgWidth = Math.max(760, (maxStep + 1.5) * 125);
  const svgHeight = 260;

  const getCoordinates = (step: number, lane: number) => {
    const x = 70 + step * 125;
    const y = 130 + lane * 60;
    return { x, y };
  };

  return (
    <div className={cn("rounded-2xl border border-border bg-card overflow-hidden shadow-xl", className)}>
      {/* 1. TOP TOOLBAR & PRESETS */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border bg-card-subtle">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-mint/15 text-mint border border-mint/30">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              Interactive Git Visualiser
              <Badge variant="mint" className="text-[10px] py-0 px-1.5 font-mono">LIVE DAG</Badge>
            </h3>
            <p className="text-xs text-foreground/70 font-mono">
              Branch: <span className="font-bold text-mint">{headBranch}</span> | HEAD: <span className="text-foreground">{activeCommitId}</span>
            </p>
          </div>
        </div>

        {/* Quick Simulator Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => executeCommand('git commit -m "Refactor state selector hooks"')}
            disabled={isLoading}
            className="text-xs h-8 px-2.5"
          >
            <GitCommit className="w-3.5 h-3.5 text-mint mr-1" /> Commit
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              headBranch === "main"
                ? executeCommand("git checkout feature/auth")
                : executeCommand("git checkout main")
            }
            disabled={isLoading}
            className="text-xs h-8 px-2.5"
          >
            <GitBranch className="w-3.5 h-3.5 text-track-1 mr-1" />
            {headBranch === "main" ? "Switch Auth" : "Switch Main"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              headBranch === "main"
                ? executeCommand("git merge feature/auth")
                : executeCommand("git merge main")
            }
            disabled={isLoading}
            className="text-xs h-8 px-2.5"
          >
            <GitMerge className="w-3.5 h-3.5 text-track-2 mr-1" /> Merge
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => executeCommand("git reset --soft HEAD~1")}
            disabled={isLoading}
            className="text-xs h-8 px-2.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500 mr-1" /> Soft Reset
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetSession}
            title="Reset DAG Session"
            className="text-xs h-8 px-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-foreground/60" />
          </Button>
        </div>
      </div>

      {/* 2. DYNAMIC HORIZONTAL SCROLLABLE DAG CANVAS */}
      <div
        ref={canvasScrollRef}
        className="relative w-full h-64 sm:h-72 overflow-x-auto bg-slate-50 dark:bg-ink-950/70 border-b border-border hex-grid-pattern transition-colors"
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="h-full min-w-full"
        >
          <defs>
            <linearGradient id="gitEdgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0D9488" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.6" />
            </linearGradient>
            <filter id="gitGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#5EEAD4" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Lane Guide Lines */}
          <line x1="0" y1="70" x2={svgWidth} y2="70" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="4 4" />
          <line x1="0" y1="130" x2={svgWidth} y2="130" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 2" />
          <line x1="0" y1="190" x2={svgWidth} y2="190" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="4 4" />

          {/* Lane Labels */}
          <text x="15" y="74" className="font-mono text-[10px] fill-foreground/40 font-semibold select-none">feature/ui</text>
          <text x="15" y="134" className="font-mono text-[10px] fill-teal-700 dark:fill-mint font-bold select-none">main</text>
          <text x="15" y="194" className="font-mono text-[10px] fill-foreground/40 font-semibold select-none">feature/auth</text>

          {/* Render Parent-Child Bezier Edges */}
          {commits.map((commit) => {
            const { x: childX, y: childY } = getCoordinates(commit.step, commit.lane);

            return commit.parents.map((pSha) => {
              const parent = commits.find((c) => c.id === pSha);
              if (!parent) return null;
              const { x: parentX, y: parentY } = getCoordinates(parent.step, parent.lane);

              // Smooth cubic bezier
              const cX1 = parentX + (childX - parentX) * 0.5;
              const cY1 = parentY;
              const cX2 = parentX + (childX - parentX) * 0.5;
              const cY2 = childY;

              return (
                <path
                  key={`${pSha}->${commit.id}`}
                  d={`M ${parentX} ${parentY} C ${cX1} ${cY1}, ${cX2} ${cY2}, ${childX} ${childY}`}
                  fill="none"
                  stroke="url(#gitEdgeGradient)"
                  strokeWidth="2.5"
                  strokeDasharray={commit.parents.length > 1 ? "4 3" : "none"}
                />
              );
            });
          })}

          {/* Render Commit Nodes */}
          {commits.map((commit) => {
            const { x, y } = getCoordinates(commit.step, commit.lane);
            const isHead = commit.id === activeCommitId;
            const isSelected = commit.id === selectedCommitId;
            const branchRefs = Object.entries(branches).filter(([_, sha]) => sha === commit.id);

            return (
              <g
                key={commit.id}
                onClick={() => setSelectedCommitId(commit.id)}
                className="cursor-pointer group"
              >
                {/* Outer Ripple for HEAD */}
                {isHead && (
                  <circle
                    cx={x}
                    cy={y}
                    r="22"
                    fill="none"
                    stroke="#5EEAD4"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    className="animate-ping"
                  />
                )}

                {/* Node Body */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHead ? "18" : isSelected ? "16" : "14"}
                  className={cn(
                    "transition-all duration-200",
                    isHead
                      ? "fill-card stroke-mint stroke-[3px]"
                      : isSelected
                      ? "fill-card stroke-track-1 stroke-[2.5px]"
                      : "fill-card stroke-slate-300 dark:stroke-slate-700 stroke-2 group-hover:stroke-mint"
                  )}
                  filter={isHead ? "url(#gitGlow)" : undefined}
                />

                {/* Center Core Pip */}
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  className={cn(
                    isHead ? "fill-mint" : isSelected ? "fill-track-1" : "fill-slate-500 dark:fill-slate-400"
                  )}
                />

                {/* Short SHA Label */}
                <text
                  x={x}
                  y={y + 30}
                  textAnchor="middle"
                  className={cn(
                    "font-mono text-[11px] font-bold select-none",
                    isSelected ? "fill-mint font-extrabold" : "fill-foreground"
                  )}
                >
                  {commit.id}
                </text>

                {/* Branch Reference Badges */}
                {branchRefs.map(([bName], idx) => {
                  const isCurrentHead = bName === headBranch;
                  const badgeY = y - 36 - idx * 22;

                  return (
                    <g key={bName} transform={`translate(${x - 40}, ${badgeY})`}>
                      <rect
                        width="80"
                        height="20"
                        rx="5"
                        className={cn(
                          isCurrentHead
                            ? "fill-mint text-ink-950 shadow-md"
                            : "fill-white dark:fill-ink-900 stroke-slate-300 dark:stroke-slate-700 stroke-1"
                        )}
                      />
                      <text
                        x="40"
                        y="14"
                        textAnchor="middle"
                        className={cn(
                          "font-mono text-[10px] font-bold select-none",
                          isCurrentHead ? "fill-ink-950 font-extrabold" : "fill-foreground"
                        )}
                      >
                        {isCurrentHead ? `HEAD -> ${bName}` : bName}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 3. COMMIT INSPECTOR & TERMINAL (2-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border bg-card">
        {/* Left Column: Interactive Commit Inspector (5 cols) */}
        <div className="md:col-span-5 p-4 space-y-3 bg-card-subtle/50">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-semibold uppercase font-mono tracking-wider text-foreground/70 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-mint" /> Commit Inspector
            </span>
            <Badge variant="mint" className="text-[10px] font-mono">
              {inspectedCommit.id}
            </Badge>
          </div>

          <div className="space-y-1.5 text-xs">
            <p className="font-semibold text-foreground text-sm leading-snug">
              {inspectedCommit.message}
            </p>
            <div className="font-mono text-[11px] text-foreground/70 space-y-0.5">
              <p>Author: <span className="text-foreground">{inspectedCommit.author}</span></p>
              <p>SHA: <span className="text-teal-700 dark:text-mint font-semibold">{inspectedCommit.fullSha.substring(0, 18)}...</span></p>
              <p>Parents: <span className="text-foreground">{inspectedCommit.parents.join(", ") || "Root"}</span></p>
            </div>
          </div>

          {/* Files Changed */}
          {inspectedCommit.filesChanged && inspectedCommit.filesChanged.length > 0 && (
            <div className="pt-2 border-t border-border/60">
              <span className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider block mb-1">
                Modified Files
              </span>
              <div className="space-y-1">
                {inspectedCommit.filesChanged.map((f, i) => (
                  <div key={i} className="flex items-center justify-between font-mono text-[11px] p-1.5 rounded bg-card border border-border">
                    <span className="text-foreground flex items-center gap-1">
                      <FileCode className="w-3 h-3 text-mint" /> {f.name}
                    </span>
                    <span className="text-emerald-500 font-bold">+{f.additions}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Context Action */}
          <div className="pt-2 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeCommand(`git checkout ${inspectedCommit.id}`)}
              className="text-xs h-7 w-full"
            >
              Checkout Commit SHA
            </Button>
          </div>
        </div>

        {/* Right Column: Terminal Console (7 cols) */}
        <div className="md:col-span-7 p-4 bg-slate-900 dark:bg-black font-mono text-xs text-slate-100 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-mint" />
              <span>bash - git terminal session</span>
            </div>
            <span>Type &apos;help&apos; for commands</span>
          </div>

          <div className="space-y-1 max-h-32 overflow-y-auto pr-2 text-[11px]">
            {terminalLogs.slice(-6).map((log, i) => (
              <div
                key={i}
                className={cn(
                  log.startsWith("$")
                    ? "text-mint font-bold"
                    : log.startsWith("ERR:")
                    ? "text-rose-400 font-semibold"
                    : "text-slate-300"
                )}
              >
                {log}
              </div>
            ))}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-2 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeCommand(commandInput);
            }}
            className="flex items-center gap-2 pt-2 border-t border-slate-800"
          >
            <span className="text-mint font-bold">$</span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="e.g. git commit -m 'Update schema', git branch, git status, help"
              className="flex-1 bg-transparent text-white placeholder:text-slate-500 text-xs focus:outline-none"
            />
            <Button size="sm" type="submit" disabled={isLoading || !commandInput.trim()} className="h-7 text-xs px-3">
              <Play className="w-3 h-3 mr-1" /> Run
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
