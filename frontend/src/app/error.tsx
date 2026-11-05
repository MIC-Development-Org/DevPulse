"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, AlertTriangle, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Runtime exception:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 relative overflow-hidden bg-aurora">
      <div className="max-w-md w-full text-center space-y-6 relative z-10 p-8 rounded-3xl border border-rose-500/30 bg-card/90 backdrop-blur-xl shadow-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-mono text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>SYSTEM FAULT 500</span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Uncaught Execution Error
        </h1>

        <p className="text-xs text-slate-300 leading-relaxed font-mono bg-ink-950 p-3 rounded-xl border border-border overflow-x-auto text-left">
          {error.message || "An unexpected error occurred during rendering."}
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="danger" onClick={() => reset()} className="w-full sm:w-auto">
            <RotateCcw className="w-4 h-4 mr-2" /> Retry Operation
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" /> Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

