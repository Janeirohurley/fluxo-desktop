import { apiClient } from "@/shared/api/client";
import { type OverviewModuleResult, type OverviewResponse } from "@/modules/dashboard/types/overview.types";

const overviewModuleStatuses = ["disabled", "ready", "empty", "not_implemented", "unavailable"] as const;
const crossModuleStatuses = ["insufficient_modules", "empty", "ready"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function getField<T = unknown>(record: Record<string, unknown>, camelKey: string, snakeKey = camelKey): T | undefined {
  return (record[camelKey] ?? record[snakeKey]) as T | undefined;
}

function normalizeInsights(value: unknown): OverviewModuleResult["insights"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      code: typeof getField(item, "code") === "string" ? (getField(item, "code") as string) : "unknown_insight",
      severity:
        typeof getField(item, "severity") === "string"
          ? (getField(item, "severity") as OverviewModuleResult["insights"][number]["severity"])
          : "info",
      message: typeof getField(item, "message") === "string" ? (getField(item, "message") as string) : "",
      value: getField(item, "value"),
    }));
}

function normalizeModuleResult(moduleName: string, value: unknown): OverviewModuleResult {
  const record = isRecord(value) ? value : {};
  const rawStatus = getField<string>(record, "status");
  const status =
    typeof rawStatus === "string" &&
    overviewModuleStatuses.includes(rawStatus as (typeof overviewModuleStatuses)[number])
      ? (rawStatus as OverviewModuleResult["status"])
      : "unavailable";

  return {
    module: moduleName as OverviewModuleResult["module"],
    enabled: typeof getField(record, "enabled") === "boolean" ? (getField(record, "enabled") as boolean) : false,
    status,
    description: typeof getField(record, "description") === "string" ? (getField(record, "description") as string) : "",
    boundaries: Array.isArray(getField(record, "boundaries"))
      ? (getField(record, "boundaries") as unknown[]).filter((entry): entry is string => typeof entry === "string")
      : [],
    kpis: isRecord(getField(record, "kpis")) ? (getField(record, "kpis") as Record<string, unknown>) : null,
    charts: isRecord(getField(record, "charts")) ? (getField(record, "charts") as Record<string, unknown>) : null,
    insights: normalizeInsights(getField(record, "insights")),
  };
}

function normalizeOverviewResponse(value: unknown): OverviewResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const companyContextCandidate = getField(value, "companyContext", "company_context");
  const summaryCandidate = getField(value, "summary");
  const crossModuleCandidate = getField(value, "crossModule", "cross_module");
  const modulesCandidate = getField(value, "modules");

  const companyContext = isRecord(companyContextCandidate) ? companyContextCandidate : {};
  const summary = isRecord(summaryCandidate) ? summaryCandidate : {};
  const crossModule = isRecord(crossModuleCandidate) ? crossModuleCandidate : {};
  const modulesRecord = isRecord(modulesCandidate) ? modulesCandidate : {};

  const companyCandidate = getField(companyContext, "company");
  const accessKeyCandidate = getField(companyContext, "accessKey", "access_key");
  const company = isRecord(companyCandidate) ? companyCandidate : null;
  const accessKey = isRecord(accessKeyCandidate) ? accessKeyCandidate : {};
  const crossModuleStatus =
    typeof getField(crossModule, "status") === "string" &&
    crossModuleStatuses.includes(getField(crossModule, "status") as (typeof crossModuleStatuses)[number])
      ? (getField(crossModule, "status") as OverviewResponse["crossModule"]["status"])
      : "empty";

  return {
    generatedAt:
      typeof getField(value, "generatedAt", "generated_at") === "string"
        ? (getField(value, "generatedAt", "generated_at") as string)
        : new Date().toISOString(),
    companyContext: {
      company: company
        ? {
            id: typeof getField(company, "id") === "string" ? (getField(company, "id") as string) : "",
            slug: typeof getField(company, "slug") === "string" ? (getField(company, "slug") as string) : "",
            name: typeof getField(company, "name") === "string" ? (getField(company, "name") as string) : "",
          }
        : null,
      accessKey: {
        keyId: typeof getField(accessKey, "keyId", "key_id") === "string" ? (getField(accessKey, "keyId", "key_id") as string) : "",
        keyPrefix:
          typeof getField(accessKey, "keyPrefix", "key_prefix") === "string"
            ? (getField(accessKey, "keyPrefix", "key_prefix") as string)
            : "",
        label: typeof getField(accessKey, "label") === "string" ? (getField(accessKey, "label") as string) : null,
        planCode:
          typeof getField(accessKey, "planCode", "plan_code") === "string"
            ? (getField(accessKey, "planCode", "plan_code") as string)
            : "",
        planName:
          typeof getField(accessKey, "planName", "plan_name") === "string"
            ? (getField(accessKey, "planName", "plan_name") as string)
            : "",
      },
      enabledModules: Array.isArray(getField(companyContext, "enabledModules", "enabled_modules"))
        ? (getField(companyContext, "enabledModules", "enabled_modules") as unknown[]).filter(
            (entry): entry is OverviewResponse["companyContext"]["enabledModules"][number] => typeof entry === "string",
          )
        : [],
      mountedModules: Array.isArray(getField(companyContext, "mountedModules", "mounted_modules"))
        ? (getField(companyContext, "mountedModules", "mounted_modules") as unknown[]).filter(
            (entry): entry is OverviewResponse["companyContext"]["mountedModules"][number] => typeof entry === "string",
          )
        : [],
    },
    summary: {
      activeModulesCount:
        typeof getField(summary, "activeModulesCount", "active_modules_count") === "number"
          ? (getField(summary, "activeModulesCount", "active_modules_count") as number)
          : 0,
      readyModulesCount:
        typeof getField(summary, "readyModulesCount", "ready_modules_count") === "number"
          ? (getField(summary, "readyModulesCount", "ready_modules_count") as number)
          : 0,
      insightsCount:
        typeof getField(summary, "insightsCount", "insights_count") === "number"
          ? (getField(summary, "insightsCount", "insights_count") as number)
          : 0,
      criticalInsightsCount:
        typeof getField(summary, "criticalInsightsCount", "critical_insights_count") === "number"
          ? (getField(summary, "criticalInsightsCount", "critical_insights_count") as number)
          : 0,
    },
    modules: Object.fromEntries(
      Object.entries(modulesRecord).map(([moduleName, moduleValue]) => [
        moduleName,
        normalizeModuleResult(moduleName, moduleValue),
      ]),
    ) as OverviewResponse["modules"],
    crossModule: {
      enabled: typeof getField(crossModule, "enabled") === "boolean" ? (getField(crossModule, "enabled") as boolean) : false,
      status: crossModuleStatus,
      kpis: isRecord(getField(crossModule, "kpis")) ? (getField(crossModule, "kpis") as Record<string, unknown>) : null,
      charts: isRecord(getField(crossModule, "charts")) ? (getField(crossModule, "charts") as Record<string, unknown>) : null,
      insights: normalizeInsights(getField(crossModule, "insights")),
    },
  };
}

export async function fetchOverview() {
  const response = await apiClient.get<OverviewResponse>("/api/overview");
  const payload = response.data as OverviewResponse | { data?: OverviewResponse };

  const normalizedPayload = normalizeOverviewResponse(payload);

  if (normalizedPayload) {
    return normalizedPayload;
  }

  const normalizedNestedPayload = normalizeOverviewResponse(
    isRecord(payload) && "data" in payload ? payload.data : undefined,
  );

  if (normalizedNestedPayload) {
    return normalizedNestedPayload;
  }

  throw new Error("Invalid overview payload received from the API.");
}
