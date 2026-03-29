import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Download, Info, RefreshCw } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Alert } from "../ui";

type UpdateStatus = "idle" | "downloading" | "complete";

export function UpdateNotification() {
  const [update, setUpdate] = useState<any>(null);
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const { t } = useTranslation("updater");

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const result = await check();
        if (result) {
          setUpdate(result);
        }
      } catch (error) {
        console.error(t("checkFailed"), error);
      }
    };

    void checkForUpdates();
  }, [t]);

  const handleUpdate = async () => {
    if (!update) {
      return;
    }

    setStatus("downloading");

    try {
      await update.downloadAndInstall();
      setStatus("complete");
      await relaunch();
    } catch (error) {
      console.error(error);
      setStatus("idle");
    }
  };

  if (!update) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-100 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Alert
        tone={status === "complete" ? "info" : "warning"}
        title={t("availableTitle", { version: update.version })}
        icon={
          status === "downloading" ? (
            <RefreshCw className="h-5 w-5 animate-spin text-amber-600 dark:text-amber-400" />
          ) : (
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          )
        }
        className="shadow-lg border-slate-200 dark:border-slate-800"
      >
        <div className="flex flex-col gap-3">
          <p className="leading-relaxed opacity-90">
            {status === "downloading" ? t("downloadingDescription") : t("availableDescription")}
          </p>

          <button
            onClick={() => void handleUpdate()}
            disabled={status === "downloading"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all",
              "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {status === "downloading" ? (
              t("installing")
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                {t("updateNow")}
              </>
            )}
          </button>
        </div>
      </Alert>
    </div>
  );
}
