import type { PropsWithChildren } from "react";

export function PublicAuthShell({ children }: PropsWithChildren) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,65,122,0.2),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_25%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-10">
        <div className="w-full">
          {children}
        </div>
      </div>
    </main>
  );
}
