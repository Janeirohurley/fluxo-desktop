import { Alert } from "@/shared/ui";
import { type OverviewInsight } from "@/modules/dashboard/types/overview.types";
import { getInsightTone } from "./dashboard.utils";

type InsightListProps = {
  insights: OverviewInsight[];
  emptyLabel: string;
};

export function InsightList({ insights, emptyLabel }: InsightListProps) {
  if (insights.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-3">
      {insights.map((insight) => (
        <Alert key={insight.code} tone={getInsightTone(insight.severity)} title={insight.code}>
          <div className="flex flex-col gap-1">
            <span>{insight.message}</span>
            {insight.value !== undefined ? (
              <span className="font-medium">Valeur : {String(insight.value)}</span>
            ) : null}
          </div>
        </Alert>
      ))}
    </div>
  );
}
