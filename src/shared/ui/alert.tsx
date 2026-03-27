import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type AlertTone = "danger" | "warning" | "info";

const toneClasses: Record<AlertTone, string> = {
  danger: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200",
};

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  tone?: AlertTone;
  title?: string;
  icon?: ReactNode;
};

export function Alert({ className, tone = "info", title, icon, children, ...props }: AlertProps) {
  return (
    <div className={cn("rounded-xl border p-4 text-sm", toneClasses[tone], className)} {...props}>
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
        <div className="min-w-0">
          {title ? <p className="font-semibold">{title}</p> : null}
          <div className={cn("text-xs", title ? "mt-1" : "")}>{children}</div>
        </div>
      </div>
    </div>
  );
}
