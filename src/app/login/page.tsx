"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ArrowRight, Github, Lock, Mail, Sparkles, UserCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = React.useState<string>("alex.rivera@micdev.org");
  const [password, setPassword] = React.useState<string>("••••••••••••");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      showToast({
        title: "Welcome back, Alex!",
        description: "Successfully authenticated with DevPulse.",
        type: "success",
      });
      router.push("/dashboard");
    }, 600);
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast({
        title: "Signed in as Demo Student",
        description: "Loaded verified test session.",
        type: "success",
      });
      router.push("/dashboard");
    }, 400);
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
            MIC DEVELOPMENT PLATFORM AUTHENTICATION
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
              Resume your progress, track stats, and quiz certifications.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Quick Demo 1-Click Login Button */}
            <div className="p-3 rounded-xl border border-mint/30 bg-mint/5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-mint flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 1-Click Demo Account
                </p>
                <p className="text-[11px] text-foreground/60">
                  Alex Rivera (14-day streak, 4 modules)
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={handleDemoLogin}
                isLoading={isLoading}
                className="text-xs h-8 px-3 font-semibold"
              >
                Sign In <UserCheck className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink mx-3 text-[11px] font-mono uppercase text-foreground/40">
                Or continue with credentials
              </span>
              <div className="flex-grow border-t border-border" />
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-mint" /> Email Address
                </label>
                <input
                  type="email"
                  required
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

            {/* Social Auth Providers */}
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={handleDemoLogin}
                className="w-full text-xs font-medium gap-2"
              >
                <Github className="w-4 h-4" /> Continue with GitHub
              </Button>
            </div>
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

