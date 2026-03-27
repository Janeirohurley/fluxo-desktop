import { cn } from "@/shared/lib/cn";

export function Divider({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="h-px flex-1 bg-border" />
      {label ? <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</span> : null}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
