import { Card } from "@/shared/ui";
import { formatMetricLabel, formatMetricValue } from "./dashboard.utils";

type OverviewChartPanelProps = {
  title: string;
  chartData: unknown;
  accentColor?: string;
  subtitle?: string;
};

type SeriesPoint = {
  label: string;
  values: Record<string, number>;
};

const chartPalette = ["#1d417a", "#10b981", "#f59e0b", "#ef4444", "#7c3aed"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function extractSeriesPoints(data: unknown): SeriesPoint[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter(isRecord)
    .map((item, index) => {
      const values = Object.fromEntries(
        Object.entries(item).filter(
          ([key, value]) => key !== "key" && key !== "label" && typeof value === "number",
        ),
      ) as Record<string, number>;

      return {
        label:
          typeof item.label === "string"
            ? item.label
            : typeof item.key === "string"
              ? item.key
              : `Point ${index + 1}`,
        values,
      };
    })
    .filter((item) => Object.keys(item.values).length > 0);
}

function extractObjectMetrics(data: unknown): Array<{ label: string; value: number | string }> {
  if (!isRecord(data) || Array.isArray(data)) {
    return [];
  }

  return Object.entries(data)
    .filter(([, value]) => typeof value === "number" || typeof value === "string")
    .map(([key, value]) => ({
      label: formatMetricLabel(key),
      value: value as number | string,
    }));
}

function buildLinePath(values: number[], width: number, height: number, maxValue: number) {
  if (values.length === 0) {
    return "";
  }

  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = maxValue > 0 ? height - (value / maxValue) * height : height;

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function renderLineChart(title: string, points: SeriesPoint[], accentColor?: string, subtitle?: string) {
  const seriesKeys = Array.from(new Set(points.flatMap((point) => Object.keys(point.values)))).slice(0, 4);

  if (seriesKeys.length === 0) {
    return null;
  }

  const values = seriesKeys.flatMap((key) => points.map((point) => point.values[key] ?? 0));
  const maxValue = Math.max(...values, 0);
  const chartWidth = 640;
  const chartHeight = 220;

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle ?? "Lecture de tendance"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {seriesKeys.map((key, index) => (
            <span key={key} className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
              />
              {formatMetricLabel(key)}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-gradient-to-b from-slate-50 to-white p-4 dark:from-slate-900 dark:to-slate-950">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-56 w-full overflow-visible">
          {[0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartHeight - ratio * chartHeight;

            return (
              <line
                key={ratio}
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray="6 6"
              />
            );
          })}

          {seriesKeys.map((key, index) => {
            const seriesValues = points.map((point) => point.values[key] ?? 0);
            const path = buildLinePath(seriesValues, chartWidth, chartHeight, maxValue);

            return (
              <g key={key}>
                <path
                  d={path}
                  fill="none"
                  stroke={index === 0 && accentColor ? accentColor : chartPalette[index % chartPalette.length]}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {seriesValues.map((value, pointIndex) => {
                  const x = seriesValues.length > 1 ? (pointIndex * chartWidth) / (seriesValues.length - 1) : chartWidth / 2;
                  const y = maxValue > 0 ? chartHeight - (value / maxValue) * chartHeight : chartHeight;

                  return (
                    <circle
                      key={`${key}-${points[pointIndex]?.label ?? pointIndex}`}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={index === 0 && accentColor ? accentColor : chartPalette[index % chartPalette.length]}
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-500 dark:text-slate-400 sm:grid-cols-6">
          {points.map((point) => (
            <div key={point.label} className="truncate rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
              {point.label}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function renderBarChart(title: string, points: SeriesPoint[], accentColor?: string, subtitle?: string) {
  const firstSeriesKey = Object.keys(points[0]?.values ?? {})[0];

  if (!firstSeriesKey) {
    return null;
  }

  const maxValue = Math.max(...points.map((point) => point.values[firstSeriesKey] ?? 0), 0);

  return (
    <Card className="grid gap-4 p-5">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle ?? formatMetricLabel(firstSeriesKey)}</p>
      </div>

      <div className="grid gap-3">
        {points.map((point) => {
          const value = point.values[firstSeriesKey] ?? 0;
          const ratio = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <div key={point.label} className="grid gap-1">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>{point.label}</span>
                <span className="font-medium">{formatMetricValue(value)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    width: `${ratio}%`,
                    background: accentColor
                      ? `linear-gradient(90deg, ${accentColor}, #10b981)`
                      : "linear-gradient(90deg,#1d417a,#10b981)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function renderMetricObject(title: string, data: unknown, subtitle?: string) {
  const metrics = extractObjectMetrics(data);

  if (metrics.length === 0) {
    return null;
  }

  return (
    <Card className="grid gap-4 p-5">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle ?? "Synthese du graphique"}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-border bg-background/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{metric.label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
              {formatMetricValue(metric.value)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function OverviewChartPanel({ title, chartData, accentColor, subtitle }: OverviewChartPanelProps) {
  const points = extractSeriesPoints(chartData);

  if (points.length > 0) {
    const seriesCount = Array.from(new Set(points.flatMap((point) => Object.keys(point.values)))).length;

    if (seriesCount > 1 || points.length >= 6) {
      return renderLineChart(title, points, accentColor, subtitle);
    }

    return renderBarChart(title, points, accentColor, subtitle);
  }

  return renderMetricObject(title, chartData, subtitle);
}
