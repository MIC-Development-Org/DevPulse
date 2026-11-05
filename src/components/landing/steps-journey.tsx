"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCheck, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    n: "01",
    icon: BookOpen,
    title: "Read & interact",
    body: "Document-first lessons paired with live tools — visualise git objects, trace packets, inspect query plans.",
    accent: "mint" as const,
  },
  {
    n: "02",
    icon: CheckCheck,
    title: "Prove mastery",
    body: "Server-scored quizzes at an 80% threshold with concept explanations, so understanding is earned, not assumed.",
    accent: "blue" as const,
  },
  {
    n: "03",
    icon: Award,
    title: "Unlock credentials",
    body: "Completed modules route you to curated, completely free industry certifications — a portfolio, not just notes.",
    accent: "amber" as const,
  },
];

const ACCENT = {
  mint: { text: "text-mint", chip: "bg-mint/10 border-mint/30", line: "from-mint/60" },
  blue: { text: "text-track-1", chip: "bg-track-1/10 border-track-1/30", line: "from-track-1/60" },
  amber: { text: "text-track-2", chip: "bg-track-2/10 border-track-2/30", line: "from-track-2/60" },
};

export function StepsJourney() {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
        className="text-center space-y-3 max-w-2xl mx-auto mb-16"
      >
        <Badge variant="blue" className="text-xs uppercase font-mono tracking-wider">
          The Journey
        </Badge>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Three steps, zero shortcuts
        </h2>
        <p className="text-sm sm:text-base text-foreground/60">
          A loop simple enough to repeat daily, rigorous enough to be worth repeating.
        </p>
      </motion.div>

      <div ref={ref} className="relative grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Animated connector line (desktop) */}
        <div
          aria-hidden="true"
          className="absolute top-[52px] left-[12%] right-[12%] hidden md:block h-px bg-border overflow-visible"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1], delay: 0.25 }}
            className="absolute inset-0 origin-left bg-gradient-to-r from-mint/60 via-track-1/60 to-track-2/60"
          />
        </div>

        {STEPS.map((step, i) => {
          const accent = ACCENT[step.accent];
          const Icon = step.icon;
          return (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.15 + i * 0.16, ease: [0.23, 1, 0.32, 1] }}
              className="group relative rounded-3xl border border-border bg-card/80 p-6 sm:p-8 text-center backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-border/0 hover:shadow-[0_20px_60px_-20px_rgba(15,23,42,0.4)]"
            >
              <div className="relative mx-auto mb-6 w-[72px] h-[72px]">
                <div
                  className={`flex h-full w-full items-center justify-center rounded-2xl border ${accent.chip} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className={`h-7 w-7 ${accent.text}`} />
                </div>
                <span
                  className={`absolute -top-2 -right-3 rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] ${accent.text}`}
                >
                  {step.n}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-foreground/60 leading-relaxed">{step.body}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.65 }}
        className="mt-12 text-center"
      >
        <Link href="/learn/web-foundations">
          <Button variant="secondary" className="font-semibold">
            Enter the loop <BookOpen className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
