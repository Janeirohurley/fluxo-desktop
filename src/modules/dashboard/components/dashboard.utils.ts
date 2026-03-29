import { type OverviewInsightSeverity, type OverviewModuleStatus } from "@/modules/dashboard/types/overview.types";

export type OverviewModuleTone = {
  accent: string;
  softClassName: string;
  borderClassName: string;
};

export function formatMetricLabel(metricKey: string) {
  return metricKey
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

export function formatMetricValue(value: unknown) {
  if (typeof value === "number") {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }

  return "N/A";
}

export function getStatusTone(status: OverviewModuleStatus) {
  switch (status) {
    case "ready":
      return "success" as const;
    case "empty":
      return "info" as const;
    case "disabled":
      return "outline" as const;
    case "not_implemented":
    case "unavailable":
      return "warning" as const;
    default:
      return "outline" as const;
  }
}

export function getInsightTone(severity: OverviewInsightSeverity) {
  switch (severity) {
    case "critical":
      return "danger" as const;
    case "warning":
      return "warning" as const;
    case "info":
    default:
      return "info" as const;
  }
}

export function getModuleTone(moduleName: string): OverviewModuleTone {
  switch (moduleName) {
    case "assets":
      return {
        accent: "#1d4ed8",
        softClassName: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
        borderClassName: "border-blue-200/70 dark:border-blue-500/20",
      };
    case "finance":
      return {
        accent: "#10b981",
        softClassName: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
        borderClassName: "border-emerald-200/70 dark:border-emerald-500/20",
      };
    case "employees":
      return {
        accent: "#7c3aed",
        softClassName: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
        borderClassName: "border-violet-200/70 dark:border-violet-500/20",
      };
    case "payroll":
      return {
        accent: "#f59e0b",
        softClassName: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
        borderClassName: "border-amber-200/70 dark:border-amber-500/20",
      };
    default:
      return {
        accent: "#1d417a",
        softClassName: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        borderClassName: "border-border",
      };
  }
}

export function sliceChartDataForPeriod(value: unknown, periodWindow: string) {
  if (!Array.isArray(value) || periodWindow === "all") {
    return value;
  }

  const size = Number(periodWindow);

  if (!Number.isFinite(size) || size <= 0) {
    return value;
  }

  return value.slice(-size);
}
