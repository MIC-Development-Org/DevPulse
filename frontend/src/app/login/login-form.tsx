"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ArrowRight, Github, Lock, Mail } from "lucide-react";

export function LoginForm() {
  const { showToast } = useToast();
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [githubAvailable, setGithubAvailable] = React.useState<boolean>(false);

  // GitHub provider is optional per deployment — check what Auth.js exposes
  // publicly (no secrets involved) and render the button only when configured.
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Custom BFF credentials sign-in (database-session compatible): see
      // src/app/api/auth/credentials/route.ts. Auth.js continues to resolve
      // the session afterwards via the same HttpOnly cookie.
      const res = await fetch("/api/auth/credentials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        // Generic only — never disclose whether the email exists.
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        showToast({
          title: "Sign in failed",
          description: body?.error ?? "Invalid email or password.",
          type: "error",
        });
        return;
      }

      showToast({
        title: "Welcome back!",
        description: "Successfully authenticated.",
        type: "success",
      });
      // Full navigation: remounts ClientShell so SessionProvider fetches the
      // freshly created session (client-side push would keep a stale null
      // session in the cached provider state).
      window.location.assign("/dashboard");
    } catch {
      showToast({
        title: "Sign in failed",
        description: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHub = () => {
    if (!githubAvailable) return;
    // Full redirect flow for OAuth (consent handshake).
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
            MEMBER LOGIN
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
        >
        <Card className="border-border bg-card/90 backdrop-blur-xl shadow-2xl p-2 sm:p-4">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Sign In to DevPulse</CardTitle>
            <CardDescription>
              Continue your streak, track progress, and level up your craft.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-mint" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-ink-950/40 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-mint" /> Password
                  </label>
                  <a href="#" className="text-[11px] text-mint hover:underline">
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
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
                Sign In to Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            {githubAvailable && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={handleGitHub}
                  className="w-full text-xs font-medium gap-2"
                >
                  <Github className="w-4 h-4" /> Continue with GitHub
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="justify-center border-t border-border pt-4 text-xs text-foreground/60">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-mint font-semibold hover:underline ml-1">
              Create an account
            </Link>
          </CardFooter>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
