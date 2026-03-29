import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Building2, KeyRound, Lock, Server, ShieldCheck, Trash2 } from "lucide-react";
import { getAuthErrorMessage, validateAccessKey } from "@/modules/auth/api/auth.api";
import { TenantSummaryCard } from "@/modules/auth/components/TenantSummaryCard";
import { authQueryKeys, useAccessSession, useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";
import appIcon from "@/assets/app-icon.png";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { clearStoredAccessKey, setStoredAccessKey } from "@/shared/lib/access-key-storage";
import { hasStoredLocalAppLock, saveLocalAppLock } from "@/shared/lib/local-app-lock";
import { Alert, Button, Card, Field, Spinner, ThemeToggle } from "@/shared/ui";

export function AccessKeyPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const storedAccessKey = useStoredAccessKey();
  const { data: session, isLoading, isError, error, refetch } = useAccessSession();
  const { t } = useTranslation(["auth", "common"]);
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
        toast.success(t("auth:messages.workspaceConnectedTitle"), {
          description: t("auth:messages.workspaceConnectedDescription", {
            name: validatedSession.company?.name ?? validatedSession.plan.name,
          }),
        });
        navigate({ to: "/" });
        return;
      }

      setValidatedAccessKey(rawKey);
      setStepError(null);
    },
    onError: (mutationError) => {
      toast.error(t("auth:messages.keyRejectedTitle"), {
        description: getAuthErrorMessage(mutationError),
      });
    },
  });

  const handleSave = async () => {
    if (!accessKey.trim()) {
      toast.warning(t("auth:messages.accessKeyRequiredTitle"), {
        description: t("auth:messages.accessKeyRequiredDescription"),
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
    toast(t("auth:messages.localKeyRemovedTitle"), {
      description: t("auth:messages.localKeyRemovedDescription"),
    });
  };

  const finalizeAccess = async () => {
    if (!validatedAccessKey) {
      return;
    }

    setStoredAccessKey(validatedAccessKey);
    await queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    toast.success(t("auth:messages.workspaceConnectedTitle"), {
      description: t("auth:messages.workspaceConnectedDefault"),
    });
    navigate({ to: "/" });
  };

  const handleConfigureLocalPassword = async () => {
    if (localPassword.trim().length < 4) {
      setStepError(t("auth:validation.localPasswordMinLength"));
      return;
    }

    if (localPassword !== confirmLocalPassword) {
      setStepError(t("auth:validation.localPasswordMismatch"));
      return;
    }

    setStepError(null);
    await saveLocalAppLock(localPassword);
    toast.success(t("auth:messages.localLockEnabledTitle"), {
      description: t("auth:messages.localLockEnabledDescription"),
    });
    await finalizeAccess();
  };

  const isSetupStep = Boolean(validatedAccessKey && !hasLocalPassword);

  return (
    <div className="mx-auto grid w-full max-w-md gap-6">
      <div className="flex items-center justify-center gap-3">
        <LanguageSwitcher />
        <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <ThemeToggle label={t("common:theme.darkMode")} size="md" />
        </div>
      </div>

      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.75)] dark:bg-slate-900">
          <img src={appIcon} alt="Fluxo" className="h-full w-full object-cover" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {t("auth:page.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("auth:page.subtitle")}</p>
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
              {isSetupStep ? t("auth:steps.localProtection") : t("auth:steps.accessKey")}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {isSetupStep ? t("auth:descriptions.localProtection") : t("auth:descriptions.accessKey")}
            </p>
          </div>

          {isError ? (
            <Alert tone="danger" title={t("auth:alerts.invalidKey")} icon={<ShieldCheck className="h-4 w-4" />}>
              {getAuthErrorMessage(error)}
            </Alert>
          ) : null}

          {stepError ? (
            <Alert tone="warning" title={t("auth:alerts.verificationRequired")} icon={<ShieldCheck className="h-4 w-4" />}>
              {stepError}
            </Alert>
          ) : null}

          {isSetupStep ? (
            <div className="grid gap-4">
              <Field
                type="password"
                label={t("auth:fields.localPassword")}
                hint={t("auth:fields.localPasswordHint")}
                placeholder={t("auth:fields.localPasswordPlaceholder")}
                value={localPassword}
                onChange={(event) => setLocalPassword(event.currentTarget.value)}
              />

              <Field
                type="password"
                label={t("auth:fields.confirmLocalPassword")}
                placeholder={t("auth:fields.confirmLocalPasswordPlaceholder")}
                value={confirmLocalPassword}
                onChange={(event) => setConfirmLocalPassword(event.currentTarget.value)}
              />

              <div className="grid gap-3">
                <Button size="sm" leftIcon={<Lock className="h-4 w-4" />} onClick={() => void handleConfigureLocalPassword()}>
                  {t("auth:actions.addLocalPassword")}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void finalizeAccess()}>
                  {t("common:actions.configureLater")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <Field
                type="password"
                label={t("auth:fields.tenantId")}
                hint={t("auth:fields.tenantHint")}
                placeholder={t("auth:fields.tenantPlaceholder")}
                value={accessKey}
                onChange={(event) => setAccessKey(event.currentTarget.value)}
              />

              <Button
                size="sm"
                leftIcon={saveAccessKeyMutation.isPending ? <Spinner className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                onClick={() => void handleSave()}
                disabled={saveAccessKeyMutation.isPending}
              >
                {t("auth:actions.validateTenant")}
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{isSetupStep ? t("auth:trust.localProtection") : t("auth:trust.connected")}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <TrustCard icon={<ShieldCheck className="h-4 w-4" />} label={t("auth:trust.advancedProtection")} />
        <TrustCard icon={<Server className="h-4 w-4" />} label={t("auth:trust.dedicatedInfrastructure")} />
        <TrustCard icon={<Building2 className="h-4 w-4" />} label={t("auth:trust.enterpriseAccess")} />
      </div>

      {isLoading ? (
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Spinner className="text-emerald-500" />
            <p>{t("auth:messages.sessionChecking")}</p>
          </div>
        </Card>
      ) : null}

      {session ? (
        <div className="grid gap-4">
          <TenantSummaryCard session={session} />
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="secondary" onClick={() => void refetch()}>
              {t("auth:actions.refreshSession")}
            </Button>
            <Button variant="secondary" leftIcon={<Trash2 className="h-4 w-4" />} onClick={handleDisconnect}>
              {t("auth:actions.removeLocalKey")}
            </Button>
            <p className="w-full text-sm text-slate-500 dark:text-slate-400">
              {t("auth:messages.sessionPrefix", { prefix: session.keyPrefix })}
              {session.expiresAt
                ? t("auth:messages.sessionExpires", { date: new Date(session.expiresAt).toLocaleString() })
                : t("auth:messages.sessionNoExpiration")}
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
