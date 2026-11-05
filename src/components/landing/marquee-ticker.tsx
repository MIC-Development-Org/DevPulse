"use client";

import * as React from "react";
import { Cpu, Database, GitBranch, Globe, Lock, Network, Zap, Workflow, Boxes, Binary } from "lucide-react";

const TOPICS = [
  { icon: Network, label: "TCP / IP Internals" },
  { icon: Workflow, label: "React Fiber Reconciler" },
  { icon: Database, label: "Postgres Query Planning" },
  { icon: GitBranch, label: "Directed Acyclic Graphs" },
  { icon: Lock, label: "EVM Opcodes" },
  { icon: Globe, label: "HTTP/2 Multiplexing" },
  { icon: Binary, label: "Merkle Trees" },
  { icon: Cpu, label: "Cache Localization" },
  { icon: Zap, label: "Server-Verified Mastery" },
  { icon: Boxes, label: "Free Certifications" },
];

export function MarqueeTicker() {
  const row = [...TOPICS, ...TOPICS];

  return (
    <div
      className="relative py-8 border-b border-border/60 overflow-hidden bg-background/60"
      aria-label="Topics covered by the curriculum"
      role="list"
    >
      {/* Soft fade on both edges — airy, never a hard cut */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      />
      <div className="marquee-track flex w-max items-center gap-3 px-3 hover:[animation-play-state:paused]">
        {row.map((topic, i) => (
          <span
            key={`${topic.label}-${i}`}
            role="listitem"
            aria-hidden={i >= TOPICS.length ? "true" : undefined}
            className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card/70 px-4 text-xs font-mono text-foreground/65 backdrop-blur-sm transition-colors hover:border-mint/40 hover:text-mint"
          >
            <topic.icon className="h-3.5 w-3.5 text-mint/80" aria-hidden="true" />
            {topic.label}
          </span>
        ))}
      </div>
    </div>
  );
}
