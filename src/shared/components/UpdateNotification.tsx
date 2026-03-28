import { useState, useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process'; // Ajuste le chemin selon ta structure
import { Download, RefreshCw, Info } from "lucide-react"; // Ou tes icônes habituelles
import { cn } from "@/shared/lib/cn";
import { Alert } from '../ui';

export function UpdateNotification() {
    const [update, setUpdate] = useState<any>(null);
    const [status, setStatus] = useState<'idle' | 'downloading' | 'complete'>('idle');

    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                const result = await check();
                if (result) setUpdate(result);
            } catch (error) {
                console.error("Échec de la vérification MAJ:", error);
            }
        };
        checkForUpdates();
    }, []);

    const handleUpdate = async () => {
        if (!update) return;
        setStatus('downloading');
        try {
            await update.downloadAndInstall();
            setStatus('complete');
            await relaunch();
        } catch (e) {
            console.error(e);
            setStatus('idle');
        }
    };

    if (!update) return null;

    return (
        <div className="fixed bottom-6 right-6 z-100 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Alert
                tone={status === 'complete' ? "info" : "warning"}
                title={`Mise à jour v${update.version} disponible`}
                icon={
                    status === 'downloading' ? (
                        <RefreshCw className="h-5 w-5 animate-spin text-amber-600 dark:text-amber-400" />
                    ) : (
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )
                }
                className="shadow-lg border-slate-200 dark:border-slate-800"
            >
                <div className="flex flex-col gap-3">
                    <p className="leading-relaxed opacity-90">
                        {status === 'downloading'
                            ? "Téléchargement des nouveaux composants de Fluxo..."
                            : "Une nouvelle version stable est prête à être installée."}
                    </p>

                    <button
                        onClick={handleUpdate}
                        disabled={status === 'downloading'}
                        className={cn(
                            "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all",
                            "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
                            "disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                    >
                        {status === 'downloading' ? (
                            "Installation en cours..."
                        ) : (
                            <>
                                <Download className="h-3.5 w-3.5" />
                                Mettre à jour maintenant
                            </>
                        )}
                    </button>
                </div>
            </Alert>
        </div>
    );
}