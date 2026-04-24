import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/site-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen text-[var(--cp-text)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--cp-accent)]/50" />
      <div className="relative flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
