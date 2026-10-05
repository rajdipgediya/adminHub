"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTransactions } from "@/hooks/queries";
import { useRevenueSeries, type RevenuePoint } from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setRevenueRange, type RevenueRange } from "@/store/uiSlice";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";

const RANGES: RevenueRange[] = ["7D", "1M", "3M", "6M", "1Y"];

const formatK = (v: number) => (v >= 1000 ? `$${Math.round(v / 1000)}K` : `$${Math.round(v)}`);

function niceTicks(points: RevenuePoint[]) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const step = Math.ceil(max / 4 / 5000) * 5000 || 1000;
  return [0, step, step * 2, step * 3, step * 4];
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-[13px] font-semibold text-slate-900">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function RangeToggle({ className }: { className?: string }) {
  const range = useAppSelector((s) => s.ui.revenueRange);
  const dispatch = useAppDispatch();
  return (
    <div role="radiogroup" aria-label="Revenue range" className={cn("flex gap-1 rounded-md bg-slate-50 p-1", className)}>
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={r === range}
          onClick={() => dispatch(setRevenueRange(r))}
          className={cn(
            "rounded px-2.5 py-1 text-[11px] font-semibold transition-colors",
            r === range ? "bg-white text-slate-900 shadow-segment" : "text-slate-500 hover:text-slate-900",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

/** Desktop "Revenue Overview" card: stepped area bars + line with dots. */
export function RevenueChartCard() {
  const range = useAppSelector((s) => s.ui.revenueRange);
  const { data, isLoading, isError, error, refetch } = useTransactions();
  const loading = isLoading || !data;
  const { points, subtitle } = useRevenueSeries(data, range);
  const ticks = niceTicks(points);

  return (
    <Card className="flex w-full flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-slate-900">Revenue Overview</h2>
          <p className="text-xs text-slate-500">{loading ? "Loading…" : subtitle}</p>
        </div>
        <RangeToggle />
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} className="py-6" />
      ) : loading ? (
        <div className="flex h-[214px] w-full gap-4 pt-4">
          <div className="flex h-[170px] w-12 shrink-0 flex-col justify-between">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-2.5 w-10 self-end" />
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div className="relative flex h-[170px] items-end justify-between gap-4 border-b border-slate-100 px-2 pb-px">
              {/* Background Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pb-px">
                {[...Array(5)].map((_, i) => (
                  <div key={`grid-${i}`} className="h-px w-full border-t border-dashed border-slate-200" />
                ))}
              </div>
              {/* Bars */}
              {[30, 70, 45, 90, 60, 85, 40].map((h, i) => (
                <Skeleton
                  key={i}
                  className="relative z-10 w-full rounded-t-sm rounded-b-none"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between px-2">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-2.5 w-12" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[214px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 6, right: 6, bottom: 0, left: 0 }} barCategoryGap={0}>
              <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                dy={10}
                height={30}
              />
              <YAxis
                ticks={ticks}
                domain={[0, ticks[4]]}
                tickFormatter={formatK}
                axisLine={false}
                tickLine={false}
                width={61}
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                dx={-16}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#4F46E5", fillOpacity: 0.04 }} />
              <Bar dataKey="value" fill="#4F46E5" fillOpacity={0.06} isAnimationActive={false} />
              <Line
                type="linear"
                dataKey="value"
                stroke="#4F46E5"
                strokeWidth={2.5}
                dot={{ r: 3.25, fill: "#FFFFFF", stroke: "#4F46E5", strokeWidth: 1.5 }}
                activeDot={{ r: 4.5, fill: "#4F46E5", stroke: "#FFFFFF", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

/** Mobile "Revenue Overview" card: simple rounded bars (mobile frame). */
export function MobileRevenueCard() {
  const range = useAppSelector((s) => s.ui.revenueRange);
  const dispatch = useAppDispatch();
  const { data, isLoading, isError, error, refetch } = useTransactions();
  const loading = isLoading || !data;
  const { points, subtitle } = useRevenueSeries(data, range);
  const max = Math.max(...points.map((p) => p.value), 1);
  const next = RANGES[(RANGES.indexOf(range) + 1) % RANGES.length];

  return (
    <Card className="flex w-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-bold text-slate-900">Revenue Overview</h2>
          <p className="text-[11px] text-slate-500">{loading ? "Loading…" : subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(setRevenueRange(next))}
          aria-label={`Range ${range}, switch to ${next}`}
          className="rounded bg-slate-50 p-0.5 text-[10px] font-semibold text-slate-900"
        >
          {range}
        </button>
      </div>
      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} className="py-4" />
      ) : (
        <div className="flex h-[123px] items-end justify-center gap-2.5 pt-2.5">
          {(loading ? Array.from({ length: 6 }, (_, i) => ({ label: "", value: (i + 2) * 10 })) : points)
            .slice(-6)
            .map((p, i) => (
              <div key={p.label || i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div
                  title={loading ? undefined : formatCurrency(p.value)}
                  className={cn(
                    "w-full rounded-t",
                    !loading && "bg-indigo-600 opacity-80"
                  )}
                  style={{ height: Math.max(4, (p.value / (loading ? 80 : max)) * 95) }}
                >
                  {loading && <Skeleton className="h-full w-full rounded-t rounded-b-none" />}
                </div>
                <span className="h-3 text-[10px] text-slate-400">{p.label}</span>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}
