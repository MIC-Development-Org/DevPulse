import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 relative overflow-hidden bg-aurora hex-grid-pattern">
      <div className="max-w-md w-full text-center space-y-6 relative z-10 p-8 rounded-3xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-mono text-mint">
          <span>ERROR 404</span>
          <span className="text-foreground/40">•</span>
          <span>DISCONNECTED NODE</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          Trail Divergence
        </h1>

        <p className="text-sm text-foreground/70 leading-relaxed">
          The requested module or resource does not exist in the curriculum DAG. Check the URL or return to known coordinates.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">
              <Home className="w-4 h-4 mr-2" /> Back to Base
            </Button>
          </Link>
          <Link href="/learn" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              <Compass className="w-4 h-4 mr-2" /> All Tracks
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

