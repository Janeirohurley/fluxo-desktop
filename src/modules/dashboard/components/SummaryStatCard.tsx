import { type ReactNode } from "react";
import { Card } from "@/shared/ui";

type SummaryStatCardProps = {
  label: string;
  value: number | string;
  icon?: ReactNode;
};

export function SummaryStatCard({ label, value, icon }: SummaryStatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</p>
        </div>
        {icon ? <div className="text-blue-600 dark:text-blue-300">{icon}</div> : null}
      </div>
    </Card>
  );
}
