"use client";

import * as React from "react";
import { Terminal, Cpu, Layers, Play, CheckCircle2, Copy, Check, Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

type TrackKey = "web" | "fullstack" | "blockchain";

export function InteractiveHeroShowcase() {
  const [activeTrack, setActiveTrack] = React.useState<TrackKey>("web");
  const [copied, setCopied] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);

  // Auto-advance step for dynamic life
  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(timer);
  }, [activeTrack]);

  const tabs = [
    {
      id: "web" as TrackKey,
      topic: "Websites",
      label: "Track 0: Web Foundations",
      badge: "HTTP/3 & Git DAG",
      color: "mint" as const,
      icon: Terminal,
    },
    {
      id: "fullstack" as TrackKey,
      topic: "Apps & Databases",
      label: "Track 1: Full-Stack Systems",
      badge: "React Fiber & Postgres",
      color: "blue" as const,
      icon: Layers,
    },
    {
      id: "blockchain" as TrackKey,
      topic: "Blockchain",
      label: "Track 2: Blockchain & EVM",
      badge: "EVM Opcodes & Gas",
      color: "amber" as const,
      icon: Cpu,
    },
  ];

  // One-sentence plain-English translation of what the terminal shows.
  const plainEnglish: Record<TrackKey, string> = {
    web: "Your browser and the website “shake hands” over HTTP/3 — a faster version of the internet’s language — while git keeps a time-machine history of every change to the project.",
    fullstack:
      "React keeps pages fast by updating only what changed — like repainting one wall instead of the whole house. Below is the scheduler that makes that possible at 60 frames per second.",
    blockchain:
      "The EVM is the blockchain’s calculator, and every calculation costs a small fee called “gas”. Below: a tiny program spending exactly 15 gas to run and prove its result.",
  };

  const trackContent = {
    web: {
      filename: "transport-handshake.sh",
      lang: "bash",
      status: "HTTP/3 QUIC Connection Established (0-RTT)",
      code: [
        "$ quic-trace https://api.devpulse.org:443",
        "[CLIENT] --> Initial UDP Packet (TLS 1.3 ClientHello + SNI)",
        "[SERVER] <-- ACK + TLS ServerHello + EncryptedExtensions",
        "[STATUS] Handshake completed in 1.4ms via UDP datagram transport",
        "$ git log --graph --oneline --decorate",
        "*   94a2f8b (HEAD -> main) merge: incorporate zero-copy parser",
        "|\\  ",
        "| * 3b71c4a (feature/quic) feat: add UDP datagram fragmentation engine",
        "|/  ",
        "* 1c9e830 init: root socket multiplexer",
      ].join("\n"),
      metrics: [
        { label: "Handshake Latency", value: "1.4 ms", color: "text-teal-300 dark:text-mint" },
        { label: "Protocol", value: "HTTP/3 / QUIC", color: "text-slate-100" },
        { label: "Git Graph", value: "3-Way Merge DAG", color: "text-slate-100" },
      ],
    },
    fullstack: {
      filename: "fiber-reconciler.ts",
      lang: "typescript",
      status: "Concurrent Work Loop Active (Lane 4 Priority)",
      code: [
        "// React 18 Concurrent Work Loop (Fiber Reconciler)",
        "function performUnitOfWork(unitOfWork: Fiber): Fiber | null {",
        "  const current = unitOfWork.alternate;",
        "  let next = beginWork(current, unitOfWork, renderLanes);",
        "  unitOfWork.memoizedProps = unitOfWork.pendingProps;",
        "",
        "  if (shouldYieldToHost()) {",
        "    // Interruptible: Browser main thread retains 60fps responsiveness",
        "    return null; // Pauses and yields to user keystrokes",
        "  }",
        "  return next;",
        "}",
      ].join("\n"),
      metrics: [
        { label: "Reconciliation", value: "Interruptible", color: "text-blue-300 dark:text-track-1" },
        { label: "Input Jitter", value: "0.2 ms", color: "text-slate-100" },
        { label: "Frame Rate", value: "60.0 fps", color: "text-slate-100" },
      ],
    },
    blockchain: {
      filename: "evm-stack-machine.evm",
      lang: "solidity",
      status: "EVM Opcodes Executing: Gas Limit 30,000,000",
      code: [
        "// EVM Opcode Execution & Gas Metering",
        "0x00: PUSH1 0x42        ; Push constant 66 onto stack       [Gas: 3]",
        "0x02: PUSH1 0x00        ; Target memory offset 0            [Gas: 3]",
        "0x04: MSTORE            ; Store 0x42 into memory[0x00]      [Gas: 6]",
        "0x05: PUSH1 0x20        ; Return byte length (32 bytes)     [Gas: 3]",
        "0x07: PUSH1 0x00        ; Memory offset                     [Gas: 3]",
        "0x09: RETURN            ; Halt execution and return buffer  [Gas: 0]",
        "",
        "; Total Execution Cost: 15 gas | State Root Verified",
      ].join("\n"),
      metrics: [
        { label: "Gas Consumed", value: "15 gas", color: "text-amber-300 dark:text-track-2" },
        { label: "Stack Depth", value: "2 words", color: "text-slate-100" },
        { label: "Memory Expansion", value: "32 bytes", color: "text-slate-100" },
      ],
    },
  };

  const current = trackContent[activeTrack];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-border bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden text-left transition-all">
      {/* Top Header Bar with Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-border bg-slate-50/80 dark:bg-ink-950/70 p-2 sm:px-4 sm:py-2.5 gap-2">
        {/* Window dots */}
        <div className="hidden sm:flex items-center gap-1.5 mr-1 shrink-0">
          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>

        {/* Track Tabs — stays horizontally scrollable at ALL widths so the
            close button is never pushed out of the rounded overflow-hidden frame */}
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto min-w-0 flex-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTrack === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTrack(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium font-mono transition-all shrink-0 whitespace-nowrap",
                  isActive
                    ? "bg-card text-foreground shadow-sm border border-border font-semibold"
                    : "text-foreground/60 hover:text-foreground hover:bg-card-subtle border border-transparent"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-teal-700 dark:text-mint" : "text-foreground/40")} />
                <span>{tab.topic}</span>
                <span className="hidden lg:inline text-[10px] text-foreground/40">· {tab.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Copy Button */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[11px] font-mono text-foreground/60 hover:text-foreground px-2.5 py-1 rounded-lg border border-border/60 hover:bg-card transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code / Visualizer Body */}
      <div className="p-4 sm:p-6 bg-slate-900 dark:bg-black font-mono text-xs text-slate-100 space-y-4">
        {/* Plain-English explainer for beginners */}
        <motion.div
          key={activeTrack}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-2.5 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3.5 py-2.5 font-sans text-[11px] leading-relaxed text-slate-300"
        >
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span>
            <span className="font-semibold text-slate-100">In plain English: </span>
            {plainEnglish[activeTrack]}
          </span>
        </motion.div>

        {/* Status Line */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2.5">
          <span className="flex items-center gap-2 text-teal-400 dark:text-mint font-semibold">
            <span className="w-2 h-2 rounded-full bg-teal-400 dark:bg-mint animate-ping" />
            {current.status}
          </span>
          <span className="text-slate-500">{current.filename}</span>
        </div>

        {/* Preformatted Code Content */}
        <pre className="overflow-x-auto text-xs leading-relaxed text-slate-200 py-1 font-mono">
          <code>{current.code}</code>
        </pre>

        {/* Real-Time Metrics Strip */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center sm:text-left">
          {current.metrics.map((m, i) => (
            <div key={i} className="p-2 rounded-lg bg-slate-800/50 border border-slate-800">
              <span className="block text-[10px] text-slate-400 font-mono">{m.label}</span>
              <span className={cn("text-xs font-bold font-mono", m.color)}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

