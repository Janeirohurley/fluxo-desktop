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

type SeriesSummary = {
  key: string;
  label: string;
  color: string;
  first: number;
  last: number;
  min: number;
  max: number;
  average: number;
  delta: number;
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

function getSeriesKeys(points: SeriesPoint[]) {
  return Array.from(new Set(points.flatMap((point) => Object.keys(point.values)))).slice(0, 4);
}

function getSeriesColor(index: number, accentColor?: string) {
  return index === 0 && accentColor ? accentColor : chartPalette[index % chartPalette.length];
}

function getChartBounds(values: number[]) {
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);

  if (minValue === maxValue) {
    if (maxValue === 0) {
      return { min: 0, max: 1 };
    }

    return { min: 0, max: maxValue * 1.1 };
  }

  const padding = (maxValue - minValue) * 0.12;
  return {
    min: minValue - padding,
    max: maxValue + padding,
  };
}

function getYCoordinate(value: number, minValue: number, maxValue: number, height: number) {
  if (maxValue === minValue) {
    return height / 2;
  }

  const ratio = (value - minValue) / (maxValue - minValue);
  return height - ratio * height;
}

function buildLinePath(values: number[], width: number, height: number, minValue: number, maxValue: number) {
  if (values.length === 0) {
    return "";
  }

  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = getYCoordinate(value, minValue, maxValue, height);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildAreaPath(
  values: number[],
  width: number,
  height: number,
  minValue: number,
  maxValue: number,
  baselineValue: number,
) {
  if (values.length === 0) {
    return "";
  }

  const baselineY = getYCoordinate(baselineValue, minValue, maxValue, height);
  const linePath = buildLinePath(values, width, height, minValue, maxValue);
  const lastX = values.length > 1 ? width : 0;

  return `${linePath} L ${lastX} ${baselineY} L 0 ${baselineY} Z`;
}

function buildSeriesSummary(points: SeriesPoint[], key: string, color: string): SeriesSummary {
  const values = points.map((point) => point.values[key] ?? 0);
  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    key,
    label: formatMetricLabel(key),
    color,
    first: values[0] ?? 0,
    last: values[values.length - 1] ?? 0,
    min: Math.min(...values),
    max: Math.max(...values),
    average: values.length > 0 ? total / values.length : 0,
    delta: (values[values.length - 1] ?? 0) - (values[0] ?? 0),
  };
}

function renderLineChart(title: string, points: SeriesPoint[], accentColor?: string, subtitle?: string) {
  const seriesKeys = getSeriesKeys(points);

  if (seriesKeys.length === 0) {
    return null;
  }

  const summaries = seriesKeys.map((key, index) => buildSeriesSummary(points, key, getSeriesColor(index, accentColor)));
  const values = summaries.flatMap((summary) => points.map((point) => point.values[summary.key] ?? 0));
  const bounds = getChartBounds(values);
  const chartWidth = 760;
  const chartHeight = 250;
  const yAxisLabels = [bounds.max, bounds.max - (bounds.max - bounds.min) / 2, bounds.min];
  const zeroLineY =
    bounds.min <= 0 && bounds.max >= 0 ? getYCoordinate(0, bounds.min, bounds.max, chartHeight) : null;
  const labelStep = points.length > 8 ? Math.ceil(points.length / 6) : 1;

  return (
    <Card className="grid gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle ?? "Trend reading"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summaries.map((summary) => (
            <span key={summary.key} className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: summary.color }} />
              {summary.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaries.map((summary) => (
          <div key={summary.key} className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{summary.label}</p>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: summary.color }} />
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
              {formatMetricValue(summary.last)}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div>
                <p>Min</p>
                <p className="mt-1 font-medium text-slate-900 dark:text-white">{formatMetricValue(summary.min)}</p>
              </div>
              <div>
                <p>Avg</p>
                <p className="mt-1 font-medium text-slate-900 dark:text-white">{formatMetricValue(summary.average)}</p>
              </div>
              <div>
                <p>Delta</p>
                <p
                  className={`mt-1 font-medium ${
                    summary.delta > 0
                      ? "text-emerald-600 dark:text-emerald-300"
                      : summary.delta < 0
                        ? "text-red-600 dark:text-red-300"
                        : "text-slate-900 dark:text-white"
                  }`}
                >
                  {summary.delta > 0 ? "+" : ""}
                  {formatMetricValue(summary.delta)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-gradient-to-b from-slate-50 via-white to-slate-50 p-4 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="grid gap-3 lg:grid-cols-[64px_1fr]">
          <div className="flex h-[250px] flex-col justify-between text-[11px] text-slate-500 dark:text-slate-400">
            {yAxisLabels.map((label, index) => (
              <span key={`${title}-y-${index}`}>{formatMetricValue(label)}</span>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/60 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-950/60">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-64 w-full overflow-visible">
              <defs>
                <linearGradient id={`area-${title.replace(/\s+/g, "-").toLowerCase()}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={summaries[0]?.color ?? "#1d417a"} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={summaries[0]?.color ?? "#1d417a"} stopOpacity="0.03" />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartHeight - ratio * chartHeight;
                return (
                  <line
                    key={`${title}-grid-${ratio}`}
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray="5 7"
                  />
                );
              })}

              {zeroLineY !== null ? (
                <line
                  x1={0}
                  y1={zeroLineY}
                  x2={chartWidth}
                  y2={zeroLineY}
                  stroke="currentColor"
                  className="text-slate-300 dark:text-slate-700"
                  strokeWidth="1.5"
                />
              ) : null}

              {summaries.map((summary, index) => {
                const seriesValues = points.map((point) => point.values[summary.key] ?? 0);
                const path = buildLinePath(seriesValues, chartWidth, chartHeight, bounds.min, bounds.max);
                const areaPath =
                  index === 0
                    ? buildAreaPath(
                        seriesValues,
                        chartWidth,
                        chartHeight,
                        bounds.min,
                        bounds.max,
                        bounds.min <= 0 && bounds.max >= 0 ? 0 : bounds.min,
                      )
                    : "";

                return (
                  <g key={`${title}-${summary.key}`}>
                    {index === 0 ? <path d={areaPath} fill={`url(#area-${title.replace(/\s+/g, "-").toLowerCase()})`} /> : null}
                    <path
                      d={path}
                      fill="none"
                      stroke={summary.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {seriesValues.map((value, pointIndex) => {
                      const x = seriesValues.length > 1 ? (pointIndex * chartWidth) / (seriesValues.length - 1) : chartWidth / 2;
                      const y = getYCoordinate(value, bounds.min, bounds.max, chartHeight);
                      return (
                        <circle
                          key={`${summary.key}-${points[pointIndex]?.label ?? pointIndex}`}
                          cx={x}
                          cy={y}
                          r={index === 0 ? 4 : 3.25}
                          fill={summary.color}
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
              {points
                .filter((_, index) => index % labelStep === 0 || index === points.length - 1)
                .map((point) => (
                  <div key={`${title}-${point.label}`} className="truncate rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
                    {point.label}
                  </div>
                ))}
            </div>
          </div>
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

  const firstSeriesLabel = formatMetricLabel(firstSeriesKey);
  const values = points.map((point) => point.values[firstSeriesKey] ?? 0);
  const maxValue = Math.max(...values, 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = values.length > 0 ? total / values.length : 0;
  const topPoint = points.reduce(
    (best, point) => ((point.values[firstSeriesKey] ?? 0) > (best.values[firstSeriesKey] ?? 0) ? point : best),
    points[0],
  );

  return (
    <Card className="grid gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle ?? firstSeriesLabel}</p>
        </div>
        <BadgePill color={accentColor ?? "#1d417a"} label={firstSeriesLabel} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricTile label="Total" value={formatMetricValue(total)} />
        <MetricTile label="Average" value={formatMetricValue(average)} />
        <MetricTile
          label="Top segment"
          value={topPoint?.label ?? "N/A"}
          caption={formatMetricValue(topPoint?.values[firstSeriesKey] ?? 0)}
        />
      </div>

      <div className="grid gap-3">
        {points.map((point) => {
          const value = point.values[firstSeriesKey] ?? 0;
          const ratio = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <div key={point.label} className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-900 dark:text-white">{point.label}</span>
                <span className="text-slate-500 dark:text-slate-400">{formatMetricValue(value)}</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-3 rounded-full transition-all"
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
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle ?? "Chart summary"}</p>
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

function MetricTile({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
      {caption ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{caption}</p> : null}
    </div>
  );
}

function BadgePill({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-slate-500 dark:text-slate-400">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function OverviewChartPanel({ title, chartData, accentColor, subtitle }: OverviewChartPanelProps) {
  const points = extractSeriesPoints(chartData);

  if (points.length > 0) {
    const seriesCount = getSeriesKeys(points).length;

    if (seriesCount > 1 || points.length >= 6) {
      return renderLineChart(title, points, accentColor, subtitle);
    }

    return renderBarChart(title, points, accentColor, subtitle);
  }

  return renderMetricObject(title, chartData, subtitle);
}
