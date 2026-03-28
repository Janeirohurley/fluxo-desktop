import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Building2, KeyRound, Lock, Server, ShieldCheck, Trash2 } from "lucide-react";
import { getAuthErrorMessage, validateAccessKey } from "@/modules/auth/api/auth.api";
import { TenantSummaryCard } from "@/modules/auth/components/TenantSummaryCard";
import { authQueryKeys, useAccessSession, useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";
import appIcon from "@/assets/app-icon.png";
import { clearStoredAccessKey, setStoredAccessKey } from "@/shared/lib/access-key-storage";
import { hasStoredLocalAppLock, saveLocalAppLock } from "@/shared/lib/local-app-lock";
import { Alert, Button, Card, Field, Spinner, ThemeToggle } from "@/shared/ui";

export function AccessKeyPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const storedAccessKey = useStoredAccessKey();
  const { data: session, isLoading, isError, error, refetch } = useAccessSession();
  const [accessKey, setAccessKey] = useState(() => storedAccessKey ?? "");
  const [validatedAccessKey, setValidatedAccessKey] = useState<string | null>(null);
  const [localPassword, setLocalPassword] = useState("");
  const [confirmLocalPassword, setConfirmLocalPassword] = useState("");
  const [stepError, setStepError] = useState<string | null>(null);
  const hasLocalPassword = hasStoredLocalAppLock();

  useEffect(() => {
    setAccessKey(storedAccessKey ?? "");
  }, [storedAccessKey]);

  const saveAccessKeyMutation = useMutation({
    mutationFn: async (rawKey: string) => validateAccessKey(rawKey.trim()),
    onSuccess: async (validatedSession, rawKey) => {
      if (hasLocalPassword) {
        setStoredAccessKey(rawKey);
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
        toast.success("Espace de travail connecte", {
          description: `${validatedSession.company?.name ?? validatedSession.plan.name} est maintenant pret dans Fluxo.`,
        });
        navigate({ to: "/" });
        return;
      }

      setValidatedAccessKey(rawKey);
      setStepError(null);
    },
    onError: (mutationError) => {
      toast.error("Cle d'acces refusee", {
        description: getAuthErrorMessage(mutationError),
      });
    },
  });

  const handleSave = async () => {
    if (!accessKey.trim()) {
      toast.warning("Cle d'acces requise", {
        description: "Collez la cle entreprise generee apres validation de l'abonnement.",
      });
      return;
    }

    await saveAccessKeyMutation.mutateAsync(accessKey);
  };

  const handleDisconnect = () => {
    clearStoredAccessKey();
    queryClient.removeQueries({ queryKey: authQueryKeys.session });
    setValidatedAccessKey(null);
    setLocalPassword("");
    setConfirmLocalPassword("");
    setStepError(null);
    toast("Cle d'acces supprimee", {
      description: "La session tenant locale a ete retiree de cet appareil.",
    });
  };

  const finalizeAccess = async () => {
    if (!validatedAccessKey) {
      return;
    }

    setStoredAccessKey(validatedAccessKey);
    await queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    toast.success("Espace de travail connecte", {
      description: "Votre espace tenant est maintenant pret dans Fluxo.",
    });
    navigate({ to: "/" });
  };

  const handleConfigureLocalPassword = async () => {
    if (localPassword.trim().length < 4) {
      setStepError("Utilisez au moins 4 caracteres pour le mot de passe local.");
      return;
    }

    if (localPassword !== confirmLocalPassword) {
      setStepError("La confirmation du mot de passe local ne correspond pas.");
      return;
    }

    setStepError(null);
    await saveLocalAppLock(localPassword);
    toast.success("Verrouillage local active", {
      description: "Cet appareil demandera maintenant votre mot de passe local apres inactivite.",
    });
    await finalizeAccess();
  };

  const isSetupStep = Boolean(validatedAccessKey && !hasLocalPassword);

  return (
    <div className="mx-auto grid w-full max-w-md gap-6">
      <div className="flex justify-center">
        <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <ThemeToggle label="Mode sombre" size="md" />
        </div>
      </div>

      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.75)] dark:bg-slate-900">
          <img src={appIcon} alt="Fluxo" className="h-full w-full object-cover" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Accès Sécurisé ERP
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Authentification multi-tenant requise
        </p>
      </div>

      <div className="flex items-center justify-center">
        <div className="flex items-center gap-4">
          <StepCircle active={!isSetupStep}>1</StepCircle>
          <div className="h-px w-12 bg-slate-200 dark:bg-slate-700" />
          <StepCircle active={isSetupStep}>2</StepCircle>
        </div>
      </div>

      <Card className="overflow-hidden border border-slate-200 bg-white shadow-[0_30px_90px_-50px_rgba(15,23,42,0.8)] dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-8 p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              <KeyRound className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {isSetupStep ? "Protection locale" : "Cle d'entreprise"}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {isSetupStep
                ? "Ajoutez un mot de passe local pour verrouiller l'application apres inactivite. Cette etape reste facultative."
                : "Saisissez votre identifiant tenant pour acceder au systeme"}
            </p>
          </div>

          {isError ? (
            <Alert tone="danger" title="Cle invalide" icon={<ShieldCheck className="h-4 w-4" />}>
              {getAuthErrorMessage(error)}
            </Alert>
          ) : null}

          {stepError ? (
            <Alert tone="warning" title="Verification requise" icon={<ShieldCheck className="h-4 w-4" />}>
              {stepError}
            </Alert>
          ) : null}

          {isSetupStep ? (
            <div className="grid gap-4">
              <Field
                type="password"
                label="Mot de passe local"
                hint="Il sera demande pour deverrouiller l'application sur ce poste."
                placeholder="Entrez un mot de passe local"
                value={localPassword}
                onChange={(event) => setLocalPassword(event.currentTarget.value)}
              />

              <Field
                type="password"
                label="Confirmer le mot de passe"
                placeholder="Confirmez le mot de passe local"
                value={confirmLocalPassword}
                onChange={(event) => setConfirmLocalPassword(event.currentTarget.value)}
              />

              <div className="grid gap-3">
                <Button size="sm" leftIcon={<Lock className="h-4 w-4" />} onClick={() => void handleConfigureLocalPassword()}>
                  Ajouter un mot de passe local
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void finalizeAccess()}>
                  Configurer plus tard
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <Field
                type="password"
                label="Identifiant tenant"
                hint="Exemple : flx_live_..."
                placeholder="FLUX-XXX-XXXX"
                value={accessKey}
                onChange={(event) => setAccessKey(event.currentTarget.value)}
              />

              <Button
                size="sm"
                leftIcon={saveAccessKeyMutation.isPending ? <Spinner className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                onClick={() => void handleSave()}
                disabled={saveAccessKeyMutation.isPending}
              >
                Valider le tenant
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>
              {isSetupStep
                ? "Protection locale optionnelle - Verrouillage automatique - Donnees toujours masquees"
                : "Connexion securisee - Tenant isole - Audit de securite"}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <TrustCard icon={<ShieldCheck className="h-4 w-4" />} label="Protection avancee" />
        <TrustCard icon={<Server className="h-4 w-4" />} label="Infrastructure dediee" />
        <TrustCard icon={<Building2 className="h-4 w-4" />} label="Acces entreprise" />
      </div>

      {isLoading ? (
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Spinner className="text-emerald-500" />
            <p>Verification de la session en cours...</p>
          </div>
        </Card>
      ) : null}

      {session ? (
        <div className="grid gap-4">
          <TenantSummaryCard session={session} />
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="secondary" onClick={() => void refetch()}>
              Actualiser la session tenant
            </Button>
            <Button variant="secondary" leftIcon={<Trash2 className="h-4 w-4" />} onClick={handleDisconnect}>
              Supprimer la cle locale
            </Button>
            <p className="w-full text-sm text-slate-500 dark:text-slate-400">
              Prefixe de cle : {session.keyPrefix}
              {session.expiresAt
                ? ` - expire le ${new Date(session.expiresAt).toLocaleString()}`
                : " - sans expiration"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepCircle({
  children,
  active = false,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={
        active
          ? "flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white"
          : "flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      }
    >
      {children}
    </div>
  );
}

function TrustCard({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 text-center backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
        {icon}
      </div>
      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</p>
    </div>
  );
}
