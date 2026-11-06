"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { CommandPalette } from "../global/command-palette";
import { ShortcutsModal } from "../global/shortcuts-modal";
import { ScrollProgress } from "../global/scroll-progress";
import { BackToTop } from "../global/back-to-top";
import { MockDataBanner } from "../global/mock-banner";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState<boolean>(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = React.useState<boolean>(false);

  return (
    // SessionProvider (Phase 2): exposes Auth.js session state to the navbar
    // and other client components via useSession.
    <SessionProvider>
      <ScrollProgress />
      <Navbar
        onOpenSearch={() => setCommandPaletteOpen(true)}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
      />
      {/* Keyed by pathname so each route re-runs the page-enter animation */}
      <main key={pathname} className="page-enter flex-1 w-full">
        {children}
      </main>
      <Footer />

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
      <ShortcutsModal
        open={shortcutsModalOpen}
        onOpenChange={setShortcutsModalOpen}
      />
      <BackToTop />
      {/* Phase 3: explicit mock-mode visibility (adapter.ts guard is authoritative) */}
      <MockDataBanner />
    </SessionProvider>
  );
}

