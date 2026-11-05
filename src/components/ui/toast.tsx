"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "error" | "info" | "warning";
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { ...toast, id }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
      >
        {toasts.map((toast, index) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
            warning: <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />,
            info: <Info className="w-5 h-5 text-teal-600 dark:text-mint shrink-0" />,
          };

          // Premium stack: older toasts recede slightly behind the newest.
          // Outer wrapper carries the stagger (the inner keeps its entrance
          // animation with fill-mode-both, which would override inline styles).
          const depth = toasts.length - 1 - index;
          const scale = Math.max(0.94, 1 - depth * 0.02);
          const opacity = depth === 0 ? 1 : Math.max(0.75, 1 - depth * 0.1);

          return (
            <div
              key={toast.id}
              style={{ transform: `scale(${scale})`, opacity }}
              className="transition-all duration-300 pointer-events-none"
            >
              <div
                role="alert"
                className={cn(
                  "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-border bg-card shadow-lg text-card-foreground transition-all duration-300 toast-in"
                )}
              >
                {icons[toast.type || "info"]}
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-foreground">{toast.title}</p>
                  {toast.description && (
                    <p className="text-foreground/70 mt-0.5 text-xs">{toast.description}</p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="text-foreground/50 hover:text-foreground transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

