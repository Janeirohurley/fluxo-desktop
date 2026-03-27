import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function Field({ className, label, hint, ...props }: FieldProps) {
  return (
    <label className="grid gap-2">
      {label ? <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span> : null}
      <input
        className={cn(
          "h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50",
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span> : null}
    </label>
  );
}
