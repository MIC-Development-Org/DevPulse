"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/api/api-client";
import { CertificateResource, CertificateCategory, ModuleLevel } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Award,
  Search,
  ExternalLink,
  BookOpen,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CertificatesPage() {
  const [certificates, setCertificates] = React.useState<CertificateResource[]>([]);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<string>("All");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function loadCerts() {
      try {
        const data = await api.getCertificates();
        setCertificates(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadCerts();
  }, []);

  const categories = ["All", "Web", "Cloud", "Git", "Security", "Blockchain", "AI"];
  const difficulties = ["All", "beginner", "intermediate", "advanced"];

  const filtered = certificates.filter((cert) => {
    const matchesSearch =
      cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" || cert.category === selectedCategory;

    const matchesDiff =
      selectedDifficulty === "All" || cert.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDiff;
  });

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header Banner */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 bg-aurora relative overflow-hidden shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/5 px-3 py-1 text-xs text-mint font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CURATED DIRECTORY • 100% FREE OR AUDIT ACCESSIBLE</span>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
          Industry Certification Resources
        </h1>

        <p className="text-sm sm:text-base text-foreground/70 max-w-3xl leading-relaxed">
          DevPulse pairs each curriculum milestone with prestigious, zero-cost external certifications from Linux Foundation, Stanford Online, Meta, and open-source foundations. Verify your mastery on your resume without financial barriers.
        </p>

        {/* Quick Stats */}
        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono text-foreground/60">
          <span>{certificates.length} Verified Free Certifications</span>
          <span>6 Tech Categories</span>
          <span className="text-mint font-semibold">Direct DevPulse Module Pairings</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by certificate title, provider, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-mint"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-foreground/50 font-mono hidden sm:inline">
              Difficulty:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                    selectedDifficulty === diff
                      ? "bg-mint text-ink-950 font-semibold"
                      : "bg-card border border-border text-foreground/60 hover:text-foreground"
                  )}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0",
                selectedCategory === cat
                  ? "bg-card text-teal-700 dark:text-mint border border-mint/40 shadow-sm font-semibold"
                  : "bg-card-subtle/50 text-foreground/60 hover:text-foreground border border-transparent"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Certificates Cards Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-border bg-card/40">
          <Award className="w-10 h-10 mx-auto text-foreground/30 mb-3" />
          <h3 className="font-display text-base font-semibold text-foreground">
            No matching certification resources
          </h3>
          <p className="text-xs text-foreground/50 mt-1">
            Try adjusting your search query or category filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cert) => (
            <Card
              key={cert.id}
              className="card-tilt group p-6 border-border bg-card flex flex-col justify-between hover:border-mint/40 hover:shadow-[0_0_35px_-6px_rgba(94,234,212,0.18)] transition-all duration-300 relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Provider & Cost Badge */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-foreground/60 font-medium">
                    {cert.provider}
                  </span>
                  <Badge variant="mint" className="text-[10px]">
                    {cert.cost}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-display text-lg font-bold text-foreground leading-snug">
                    {cert.title}
                  </h3>
                  <p className="text-xs text-foreground/60 mt-2 leading-relaxed">
                    {cert.description}
                  </p>
                </div>

                {/* Paired DevPulse Module */}
                {cert.pairedModuleTitle && (
                  <div className="p-3 rounded-xl border border-mint/20 bg-mint/5 space-y-1">
                    <span className="text-[10px] font-mono font-semibold uppercase text-mint flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Paired DevPulse Module
                    </span>
                    <p className="text-xs font-medium text-foreground">
                      {cert.pairedModuleTitle}
                    </p>
                  </div>
                )}

                {/* Skills Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {cert.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-ink-950 text-[10px] font-mono text-foreground/80 border border-border"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer with Time & Link Out */}
              <div className="pt-6 border-t border-border mt-4 flex items-center justify-between">
                <span className="font-mono text-xs text-foreground/50 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-mint" /> {cert.estimatedTime}
                </span>

                <a
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-mint hover:underline"
                >
                  Enroll / Learn More <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

