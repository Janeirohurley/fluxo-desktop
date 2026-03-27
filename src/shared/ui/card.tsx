import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-white/88 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.75)] backdrop-blur dark:bg-slate-950/88",
        className,
      )}
      {...props}
    />
  );
}
