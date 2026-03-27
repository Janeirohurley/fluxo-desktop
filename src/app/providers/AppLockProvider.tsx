import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAccessSession } from "@/modules/auth/hooks/useAccessSession";
import { Alert, Button, Card, Field } from "@/shared/ui";
import {
  clearLocalAppLock,
  hasStoredLocalAppLock,
  saveLocalAppLock,
  subscribeToLocalAppLockChanges,
  verifyLocalAppLock,
} from "@/shared/lib/local-app-lock";

const APP_LOCK_TIMEOUT_MS = 1 * 10 * 1000;

type AppLockContextValue = {
  hasLocalPassword: boolean;
  isLocked: boolean;
  configureLocalPassword: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  disableLocalPassword: () => void;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function AppLockProvider({ children }: PropsWithChildren) {
  const { data: session } = useAccessSession();
  const hasLocalPassword = useSyncExternalStore(
    subscribeToLocalAppLockChanges,
    hasStoredLocalAppLock,
    () => false,
  );
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const lastActivityAtRef = useRef(Date.now());
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!session || !hasLocalPassword || isLocked) {
      return;
    }

    const touchActivity = () => {
      lastActivityAtRef.current = Date.now();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }

      if (
        document.visibilityState === "visible" &&
        hiddenAtRef.current &&
        Date.now() - hiddenAtRef.current >= APP_LOCK_TIMEOUT_MS
      ) {
        setIsLocked(true);
      }

      hiddenAtRef.current = null;
      touchActivity();
    };

    const interval = window.setInterval(() => {
      if (Date.now() - lastActivityAtRef.current >= APP_LOCK_TIMEOUT_MS) {
        setIsLocked(true);
      }
    }, 15_000);

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
    ];

    events.forEach((eventName) => window.addEventListener(eventName, touchActivity, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      events.forEach((eventName) => window.removeEventListener(eventName, touchActivity));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasLocalPassword, isLocked, session]);

  useEffect(() => {
    if (!session) {
      setIsLocked(false);
      setUnlockPassword("");
      setUnlockError(null);
      lastActivityAtRef.current = Date.now();
    }
  }, [session]);

  const configureLocalPassword = async (password: string) => {
    await saveLocalAppLock(password);
    setIsLocked(false);
    lastActivityAtRef.current = Date.now();
    toast.success("Local app lock enabled", {
      description: "This device will now require your local password after inactivity.",
    });
  };

  const unlock = async (password: string) => {
    const valid = await verifyLocalAppLock(password);
    if (!valid) {
      return false;
    }

    setIsLocked(false);
    setUnlockPassword("");
    setUnlockError(null);
    lastActivityAtRef.current = Date.now();
    return true;
  };

  const disableLocalPassword = () => {
    clearLocalAppLock();
    setIsLocked(false);
    setUnlockPassword("");
    setUnlockError(null);
  };

  const handleUnlockSubmit = async () => {
    if (!unlockPassword.trim()) {
      setUnlockError("Enter your local password to unlock the app.");
      return;
    }

    setIsUnlocking(true);
    const valid = await unlock(unlockPassword);
    setIsUnlocking(false);

    if (!valid) {
      setUnlockError("Incorrect local password. Try again.");
    }
  };

  return (
    <AppLockContext.Provider
      value={{
        hasLocalPassword,
        isLocked,
        configureLocalPassword,
        unlock,
        disableLocalPassword,
      }}
    >
      {children}
      {session && hasLocalPassword && isLocked ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/25 px-6 backdrop-blur-md">
          <Card className="w-full max-w-md border border-slate-200 bg-white/96 p-8 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.95)] dark:border-slate-800 dark:bg-slate-950/96">
            <div className="grid gap-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  <LockKeyhole className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Deverrouiller l'application
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  La session tenant est toujours active, mais ce poste demande votre mot de passe local pour continuer.
                </p>
              </div>

              {unlockError ? (
                <Alert tone="danger" title="Unlock failed" icon={<ShieldCheck className="h-4 w-4" />}>
                  {unlockError}
                </Alert>
              ) : null}

              <Field
                type="password"
                label="Mot de passe local"
                placeholder="Entrez le mot de passe de verrouillage"
                value={unlockPassword}
                onChange={(event) => {
                  setUnlockPassword(event.currentTarget.value);
                  if (unlockError) {
                    setUnlockError(null);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleUnlockSubmit();
                  }
                }}
              />

              <Button
                size="sm"
                leftIcon={isUnlocking ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <LockKeyhole className="h-4 w-4" />}
                onClick={() => void handleUnlockSubmit()}
                disabled={isUnlocking}
              >
                Deverrouiller l'app
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error("useAppLock must be used within AppLockProvider");
  }

  return context;
}
