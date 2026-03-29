import { Badge, Card } from "@/shared/ui";
import { type OverviewModuleResult } from "@/modules/dashboard/types/overview.types";
import { formatMetricLabel, formatMetricValue, getStatusTone } from "./dashboard.utils";
import { InsightList } from "./InsightList";
import { OverviewChartPanel } from "./OverviewChartPanel";

type ModuleOverviewCardProps = {
  moduleResult: OverviewModuleResult;
  emptyInsightsLabel: string;
};

export function ModuleOverviewCard({ moduleResult, emptyInsightsLabel }: ModuleOverviewCardProps) {
  const kpis = Object.entries(moduleResult.kpis ?? {});
  const charts = Object.entries(moduleResult.charts ?? {}).filter(([, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Boolean(value && typeof value === "object");
  });

  return (
    <Card className="grid gap-6 overflow-hidden p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold capitalize text-slate-900 dark:text-white">
              {moduleResult.module}
            </h3>
            <Badge tone={getStatusTone(moduleResult.status)}>{moduleResult.status}</Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{moduleResult.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {moduleResult.boundaries.map((boundary) => (
            <Badge key={boundary} tone="outline">
              {boundary}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.length > 0 ? (
              kpis.map(([metricKey, metricValue]) => (
                <div key={metricKey} className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {formatMetricLabel(metricKey)}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {formatMetricValue(metricValue)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Aucun KPI disponible pour ce module.</p>
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {charts.map(([chartKey, chartValue]) => (
              <OverviewChartPanel
                key={`${moduleResult.module}-${chartKey}`}
                title={formatMetricLabel(chartKey)}
                chartData={chartValue}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Insights</p>
          <InsightList insights={moduleResult.insights} emptyLabel={emptyInsightsLabel} />
        </div>
      </div>
    </Card>
  );
}
