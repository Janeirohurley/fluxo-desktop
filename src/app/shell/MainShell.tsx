import { useState, type PropsWithChildren } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useAccessSession, useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";
import { ThemeToggle } from "@/shared/ui";

export function MainShell({ children }: PropsWithChildren) {
  const [opened, setOpened] = useState(false);
  const { data: session } = useAccessSession();
  const storedAccessKey = useStoredAccessKey();
  const hasStoredKey = Boolean(storedAccessKey);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur dark:bg-slate-950/80">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setOpened((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-foreground sm:hidden dark:bg-slate-950"
            >
              {opened ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link to="/" className="rounded-full px-2 py-1 transition hover:bg-secondary">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_40px_-22px_rgba(29,65,122,0.95)]">
                  <span className="text-sm font-bold">F</span>
                </div>
                <div>
                  <p className="text-lg font-bold">Fluxo</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tenant workspace</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle label="Mode sombre" size="md" />
            <div className="text-right">
              <p className="font-semibold">{session?.company?.name ?? "No tenant connected"}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {session
                  ? `${session.plan.name} - ${session.modules.length} module(s)`
                  : hasStoredKey
                    ? "Stored key waiting for validation"
                    : "Connect an access key"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
  

        <div className="min-w-0 flex-1 py-2">{children}</div>
      </div>
    </div>
  );
}
