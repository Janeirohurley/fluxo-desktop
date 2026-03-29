import { type OverviewInsightSeverity, type OverviewModuleStatus } from "@/modules/dashboard/types/overview.types";

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
