import { useState } from "react";
import { Activity, AlertTriangle, BarChart3, Filter, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAccessSession } from "@/modules/auth/hooks/useAccessSession";
import { ModuleOverviewCard } from "@/modules/dashboard/components/ModuleOverviewCard";
import { OverviewChartPanel } from "@/modules/dashboard/components/OverviewChartPanel";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { useOverview } from "@/modules/dashboard/hooks/useOverview";
import { Badge, Button, Card, Spinner, Toggle } from "@/shared/ui";
import { SingleSelectDropdown } from "@/shared/ui/SingleSelectDropdown";
import { InsightList } from "../components/InsightList";
import { formatMetricLabel, formatMetricValue } from "../components/dashboard.utils";

export function DashboardPage() {
  const { data: session } = useAccessSession();
  const { data: overview, isLoading, isError, refetch } = useOverview();
  const { t } = useTranslation("dashboard");
  const [selectedModule, setSelectedModule] = useState("all");
  const [hideEmptyModules, setHideEmptyModules] = useState(false);

  const companyContext = overview?.companyContext ?? null;
  const summary = overview?.summary ?? null;
  const crossModule = overview?.crossModule ?? null;
  const modules = overview?.modules ? Object.values(overview.modules) : [];
  const companyName =
    companyContext?.company?.name ??
    session?.company?.name ??
    t("fallbackCompany");
  const moduleOptions = [
    { id: "all", label: t("filters.allModules") },
    ...modules.map((moduleResult) => ({
      id: moduleResult.module,
      label: moduleResult.module,
    })),
  ];
  const filteredModules = modules.filter((moduleResult) => {
    if (selectedModule !== "all" && moduleResult.module !== selectedModule) {
      return false;
    }

    if (hideEmptyModules && moduleResult.status === "empty") {
      return false;
    }

    return true;
  });
  const focusedModule =
    selectedModule === "all"
      ? null
      : modules.find((moduleResult) => moduleResult.module === selectedModule) ?? null;
  const focusedCharts = focusedModule?.charts ?? crossModule?.charts ?? null;
  const focusedKpis = focusedModule?.kpis ?? crossModule?.kpis ?? null;
  const focusedInsights = focusedModule?.insights ?? crossModule?.insights ?? [];
  const focusedChartsEntries = Object.entries(focusedCharts ?? {}).filter(([, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Boolean(value && typeof value === "object");
  });
  const focusedKpiEntries = Object.entries(focusedKpis ?? {}).slice(0, 6);

  if (isLoading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <div className="grid justify-items-center gap-4 text-center">
          <Spinner className="h-8 w-8 text-blue-600 dark:text-blue-300" />
          <div className="space-y-1">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{t("loadingTitle")}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("loadingDescription")}</p>
          </div>
        </div>
      </section>
    );
  }

  if (isError || !overview) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-xl p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">{t("errorTitle")}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("errorDescription")}</p>
          <div className="mt-6">
            <Button onClick={() => void refetch()}>{t("retryAction")}</Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      {/* hearder */}
      <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,rgba(29,65,122,0.98),rgba(17,28,48,0.95))] p-8 text-white shadow-[0_30px_100px_-50px_rgba(29,65,122,0.95)]">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <Badge tone="info" className="w-fit bg-white/12 text-white">
              {t("badge")}
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("heroTitle", { companyName })}
              </h1>
              <p className="max-w-2xl text-sm text-slate-200">{t("heroDescription")}</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-md border border-white/10 bg-white/8 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-200">{t("planLabel")}</span>
              <span className="font-semibold">{companyContext?.accessKey.planName ?? "N/A"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-200">{t("keyPrefixLabel")}</span>
              <span className="font-medium">{companyContext?.accessKey.keyPrefix ?? "N/A"}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {(companyContext?.enabledModules ?? []).map((moduleName) => (
                <Badge key={moduleName} className="bg-white/12 text-white">
                  {moduleName}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
lll
      <Card className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <SingleSelectDropdown
            options={moduleOptions}
            value={selectedModule}
            onChange={setSelectedModule}
            label={t("filters.moduleLabel")}
            placeholder={t("filters.modulePlaceholder")}
            searchPlaceholder={t("filters.moduleSearch")}
          />

          <div className="grid gap-2 rounded-md border border-border bg-background/70 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              {t("filters.title")}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Toggle
                checked={hideEmptyModules}
                onChange={setHideEmptyModules}
                label={t("filters.hideEmpty")}
                size="md"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {t("filters.visibleModules", { count: filteredModules.length })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-1 text-sm text-slate-500 dark:text-slate-400">
          <span>{t("filters.generatedAt")}</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(overview.generatedAt))}
          </span>
        </div>
      </Card>
      

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStatCard
          label={t("summary.activeModules")}
          value={summary?.activeModulesCount ?? 0}
          icon={<Layers3 className="h-6 w-6" />}
        />
        <SummaryStatCard
          label={t("summary.readyModules")}
          value={summary?.readyModulesCount ?? 0}
          icon={<ShieldCheck className="h-6 w-6" />}
        />
        <SummaryStatCard
          label={t("summary.insights")}
          value={summary?.insightsCount ?? 0}
          icon={<Sparkles className="h-6 w-6" />}
        />
        <SummaryStatCard
          label={t("summary.criticalInsights")}
          value={summary?.criticalInsightsCount ?? 0}
          icon={<Activity className="h-6 w-6" />}
        />
      </div>

      <Card className="grid gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {focusedModule ? t("focus.titleModule", { module: focusedModule.module }) : t("focus.titleGlobal")}
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {focusedModule ? focusedModule.description : t("focus.descriptionGlobal")}
            </p>
          </div>

          <Badge tone={focusedModule ? "info" : crossModule?.status === "ready" ? "success" : "info"}>
            {focusedModule?.status ?? crossModule?.status ?? "empty"}
          </Badge>
        </div>

        {focusedKpiEntries.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {focusedKpiEntries.map(([key, value]) => (
              <div key={key} className="rounded-md border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {formatMetricLabel(key)}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  {formatMetricValue(value)}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {focusedChartsEntries.length > 0 ? (
            focusedChartsEntries.slice(0, 4).map(([chartKey, chartValue]) => (
              <OverviewChartPanel
                key={`focus-${chartKey}`}
                title={formatMetricLabel(chartKey)}
                chartData={chartValue}
              />
            ))
          ) : (
            <div className="rounded-md border border-dashed border-border p-8 text-sm text-slate-500 dark:text-slate-400">
              {t("focus.noCharts")}
            </div>
          )}
        </div>

        <div className="grid gap-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {focusedModule ? t("focus.moduleInsights") : t("crossModuleInsights")}
          </p>
          <InsightList insights={focusedInsights} emptyLabel={t("noInsights")} />
        </div>
      </Card>

      <Card className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("crossModuleTitle")}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("crossModuleDescription")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={crossModule?.status === "ready" ? "success" : "info"}>
              {crossModule?.status ?? "empty"}
            </Badge>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {crossModule?.enabled ? t("crossModuleEnabled") : t("crossModuleDisabled")}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(crossModule?.kpis ?? {}).length > 0 ? (
              Object.entries(crossModule?.kpis ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-md border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{key}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{String(value)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("noCrossModuleKpis")}</p>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("crossModuleInsights")}</p>
          <InsightList insights={crossModule?.insights ?? []} emptyLabel={t("noInsights")} />
        </div>
      </Card>

      <div className="grid gap-6">
        {filteredModules.map((moduleResult) => (
          <ModuleOverviewCard
            key={moduleResult.module}
            moduleResult={moduleResult}
            emptyInsightsLabel={t("noInsights")}
          />
        ))}
      </div>
    </section>
  );
}
