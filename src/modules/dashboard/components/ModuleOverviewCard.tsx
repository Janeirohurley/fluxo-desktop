import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge, Card } from "@/shared/ui";
import { Button } from "@/shared/ui";
import { type OverviewModuleName, type OverviewModuleResult } from "@/modules/dashboard/types/overview.types";
import { formatMetricLabel, formatMetricValue, getModuleTone, getStatusTone, sliceChartDataForPeriod } from "./dashboard.utils";
import { InsightList } from "./InsightList";
import { OverviewChartPanel } from "./OverviewChartPanel";

type ModuleOverviewCardProps = {
  moduleResult: OverviewModuleResult;
  emptyInsightsLabel: string;
  periodWindow?: string;
  onOpenModule?: (moduleName: OverviewModuleName) => void;
};

export function ModuleOverviewCard({
  moduleResult,
  emptyInsightsLabel,
  periodWindow = "all",
  onOpenModule,
}: ModuleOverviewCardProps) {
  const { t } = useTranslation("dashboard");
  const [selectedMetricKey, setSelectedMetricKey] = useState<string | null>(null);
  const moduleTone = getModuleTone(moduleResult.module);
  const kpis = Object.entries(moduleResult.kpis ?? {});
  const selectedMetricEntry =
    (selectedMetricKey ? kpis.find(([metricKey]) => metricKey === selectedMetricKey) : null) ?? kpis[0] ?? null;
  const charts = Object.entries(moduleResult.charts ?? {}).filter(([, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Boolean(value && typeof value === "object");
  });

  return (
    <Card className={`grid gap-6 overflow-hidden border ${moduleTone.borderClassName} p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold capitalize text-slate-900 dark:text-white">
              {t(`modules.${moduleResult.module}`, { defaultValue: moduleResult.module })}
            </h3>
            <Badge tone={getStatusTone(moduleResult.status)}>
              {t(`statuses.${moduleResult.status}`, { defaultValue: moduleResult.status })}
            </Badge>
            <Badge className={moduleTone.softClassName}>
              {t("moduleCard.scopesCount", { count: moduleResult.boundaries.length })}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{moduleResult.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenModule ? (
            <Button
              variant="secondary"
              leftIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => onOpenModule(moduleResult.module)}
            >
              {t("moduleCard.openModule")}
            </Button>
          ) : null}
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
                <button
                  key={metricKey}
                  type="button"
                  onClick={() => setSelectedMetricKey(metricKey)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    selectedMetricEntry?.[0] === metricKey
                      ? `${moduleTone.borderClassName} ${moduleTone.softClassName}`
                      : "border-border bg-background/70"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {formatMetricLabel(metricKey)}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {formatMetricValue(metricValue)}
                  </p>
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("moduleCard.noKpis")}</p>
            )}
          </div>

          {selectedMetricEntry ? (
            <div className={`rounded-2xl border p-5 ${moduleTone.borderClassName} ${moduleTone.softClassName}`}>
              <p className="text-xs uppercase tracking-wide opacity-80">
                {t("moduleCard.focusMetric")}
              </p>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{formatMetricLabel(selectedMetricEntry[0])}</p>
                  <p className="mt-1 text-3xl font-semibold">{formatMetricValue(selectedMetricEntry[1])}</p>
                </div>
                <p className="max-w-md text-sm opacity-80">
                  {moduleResult.description}
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4">
            {charts.map(([chartKey, chartValue]) => (
              <OverviewChartPanel
                key={`${moduleResult.module}-${chartKey}`}
                title={formatMetricLabel(chartKey)}
                chartData={sliceChartDataForPeriod(chartValue, periodWindow)}
                accentColor={moduleTone.accent}
                subtitle={
                  periodWindow === "all"
                    ? t("moduleCard.periodAll")
                    : t("moduleCard.periodValue", { count: periodWindow })
                }
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("moduleCard.insightsTitle")}</p>
          <InsightList insights={moduleResult.insights} emptyLabel={emptyInsightsLabel} />
        </div>
      </div>
    </Card>
  );
}
