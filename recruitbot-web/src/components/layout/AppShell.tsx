import type { ReactNode } from 'react';

/**
 * AppShell
 *
 * Outer flex container: fixed-width sidebar column + full-height main
 * column. Fills the viewport; children are the sidebar and main content.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-base text-text-primary">
      {children}
    </div>
  );
}
