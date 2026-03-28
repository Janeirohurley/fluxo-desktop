import { Navigate, Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { PublicAuthShell } from "@/app/shell/PublicAuthShell";
import { MainShell } from "@/app/shell/MainShell";
import { isBackendUnavailableError } from "@/modules/auth/api/auth.api";
import { useAccessSession, useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";
import { Spinner } from "@/shared/ui";

function RootLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const storedAccessKey = useStoredAccessKey();
  const { data: session, isLoading, isError, error } = useAccessSession();
  const isAccessRoute = pathname.startsWith("/auth/access-key");
  const isWaitingForBackend = isError && isBackendUnavailableError(error);

  if (storedAccessKey && (isLoading || isWaitingForBackend)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="grid max-w-md justify-items-center gap-3 px-6 text-center">
          <Spinner className="h-6 w-6 text-emerald-500" />
          <p className="font-semibold">
            {isWaitingForBackend ? "Connexion au serveur Fluxo en attente..." : "Verification de l'acces tenant..."}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isWaitingForBackend
              ? "Le backend n'est pas encore joignable. Fluxo va reessayer automatiquement toutes les 10 secondes."
              : "Fluxo verifie la cle entreprise enregistree sur cet appareil."}
          </p>
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
