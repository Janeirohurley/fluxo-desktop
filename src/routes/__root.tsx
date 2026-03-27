import { Navigate, Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { PublicAuthShell } from "@/app/shell/PublicAuthShell";
import { MainShell } from "@/app/shell/MainShell";
import { useAccessSession, useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";
import { Spinner } from "@/shared/ui";

function RootLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const storedAccessKey = useStoredAccessKey();
  const { data: session, isLoading } = useAccessSession();
  const isAccessRoute = pathname.startsWith("/auth/access-key");

  if (storedAccessKey && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="grid justify-items-center gap-3">
          <Spinner className="h-6 w-6 text-emerald-500" />
          <p className="font-semibold">Checking tenant access...</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Fluxo is validating the stored enterprise key.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    if (!isAccessRoute) {
      return <Navigate to="/auth/access-key" replace />;
    }

    return (
      <PublicAuthShell>
        <Outlet />
      </PublicAuthShell>
    );
  }

  return (
    <MainShell>
      <Outlet />
    </MainShell>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
