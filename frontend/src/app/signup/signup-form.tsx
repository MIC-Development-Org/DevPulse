"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ArrowRight, Github, Lock, Mail, User } from "lucide-react";

interface RegisterErrorBody {
  error?: string;
  details?: Record<string, string[]>;
}

export function SignupForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [githubAvailable, setGithubAvailable] = React.useState<boolean>(false);

  React.useEffect(() => {
    let active = true;
    fetch("/api/auth/providers")
      .then((r) => (r.ok ? r.json() : null))
      .then((providers: Record<string, unknown> | null) => {
        if (active) setGithubAvailable(Boolean(providers?.github));
      })
      .catch(() => active && setGithubAvailable(false));
    return () => {
      active = false;
    };
  }, []);

  const summarizeDetails = (details?: RegisterErrorBody["details"]): string | undefined => {
    if (!details) return undefined;
    const first = Object.values(details).flat()[0];
    return first;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 10) {
      showToast({
        title: "Password too short",
        description: "Please use at least 10 characters.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: create the account through the BFF (Express hashes/verifies).
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          password,
        }),
      });

      const body = (await res.json().catch(() => null)) as (RegisterErrorBody & { id?: string }) | null;

      if (res.status === 409) {
        showToast({
          title: "Account not created",
          description: body?.error ?? "This email cannot be used to create an account.",
          type: "error",
        });
        return;
      }

      if (!res.ok) {
        showToast({
          title: "Registration failed",
          description:
            body?.error ??
            summarizeDetails(body?.details) ??
            "Please check your details and try again.",
          type: "error",
        });
        return;
      }

      // Step 2: sign in immediately with the fresh account via the BFF
      // credentials route (database-session compatible).
      const loginRes = await fetch("/api/auth/credentials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!loginRes.ok) {
        showToast({
          title: "Account created",
          description: "Please sign in to continue.",
          type: "success",
        });
        router.push("/login");
        return;
      }

      showToast({
        title: "Account created!",
        description: "Welcome to DevPulse.",
        type: "success",
      });
      // Full navigation so ClientShell's SessionProvider mounts fresh and
      // picks up the brand-new session (see login-form for the same fix).
      window.location.assign("/dashboard");
    } catch {
      showToast({
        title: "Registration failed",
        description: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHub = () => {
    if (!githubAvailable) return;
    void signIn("github", { redirect: true });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-aurora hex-grid-pattern">
      <div className="w-full max-w-md space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="text-center space-y-2"
        >
          <Logo size="lg" className="justify-center" />
          <p className="text-xs text-foreground/60 font-mono">
            JOIN THE 2026-27 COHORT
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
        >
        <Card className="border-border bg-card/90 backdrop-blur-xl shadow-2xl p-2 sm:p-4">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Create DevPulse Account</CardTitle>
            <CardDescription>
              Start Track 0, save private notes, and earn verified certifications.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-mint" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Alex Rivera"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-ink-950/40 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-mint" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-ink-950/40 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-mint" /> Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 10 characters"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-ink-950/40 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full font-semibold mt-2"
                isLoading={isLoading}
              >
                Join Cohort & Begin <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            {githubAvailable && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={handleGitHub}
                  className="w-full text-xs font-medium gap-2"
                >
                  <Github className="w-4 h-4" /> Sign up with GitHub
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="justify-center border-t border-border pt-4 text-xs text-foreground/60">
            Already registered?{" "}
            <Link href="/login" className="text-mint font-semibold hover:underline ml-1">
              Sign in
            </Link>
          </CardFooter>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
