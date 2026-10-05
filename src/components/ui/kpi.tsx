import type { LucideIcon } from "lucide-react";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "./card";
import { Skeleton } from "./skeleton";

export function TrendChip({
  value,
  size = "md",
  strong,
}: {
  value: number;
  /** md = desktop dashboard (12px), sm = bookings / mobile (11px / 10px). */
  size?: "md" | "sm" | "xs";
  /** Bookings + mobile use the dark (800) text shade. */
  strong?: boolean;
}) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 font-bold whitespace-nowrap",
        size === "md" ? "text-xs" : size === "sm" ? "text-[11px]" : "text-[10px]",
        up ? "bg-emerald-100" : "bg-red-100",
        up
          ? strong
            ? "text-emerald-800"
            : "text-emerald-500"
          : strong
            ? "text-red-800"
            : "text-red-500",
      )}
    >
      {up ? "↑" : "↓"} {formatPercent(value)}
    </span>
  );
}

/** Dashboard / bookings KPI card: label + icon bubble, big value, trend. */
export function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
  loading,
  strongTrend,
}: {
  label: string;
  value: string;
  trend: number;
  icon: LucideIcon;
  loading?: boolean;
  strongTrend?: boolean;
}) {
  return (
    <Card className="flex min-w-0 flex-1 flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-slate-500">{label}</p>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-50">
          <Icon className="size-4 text-indigo-600" />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {loading ? (
          <>
            <Skeleton className="h-[29px] w-28" />
            <Skeleton className="h-[18px] w-36" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <div className="flex items-center gap-1">
              <TrendChip value={trend} size={strongTrend ? "sm" : "md"} strong={strongTrend} />
              <span className="text-[11px] text-slate-500">vs last month</span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/** Compact stat card used above tables (users / transactions). */
export function StatCard({
  label,
  value,
  loading,
  valueClassName,
  children,
}: {
  label: string;
  value: string;
  loading?: boolean;
  valueClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex min-w-0 flex-1 items-center gap-3 p-4">
      <div className={cn("flex min-w-0 flex-1 flex-col", children ? "gap-1" : "gap-2")}>
        <p className="truncate text-[13px] text-slate-500">{label}</p>
        {loading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <p className={cn("text-xl font-bold text-slate-900", valueClassName)}>{value}</p>
        )}
      </div>
      {children}
    </Card>
  );
}

/** Mobile stat tile (`p-12`, 11px label, 16px value). */
export function MobileStat({
  label,
  value,
  loading,
  valueClassName,
  size = "md",
}: {
  label: string;
  value: string;
  loading?: boolean;
  valueClassName?: string;
  size?: "md" | "sm";
}) {
  return (
    <Card
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1",
        size === "sm" ? "rounded-md p-2.5" : "p-3",
      )}
    >
      <p className={cn("truncate text-slate-500", size === "sm" ? "text-[10px]" : "text-[11px]")}>
        {label}
      </p>
      {loading ? (
        <Skeleton className="h-5 w-16" />
      ) : (
        <p
          className={cn(
            "truncate font-bold text-slate-900",
            size === "sm" ? "text-sm" : "text-base",
            valueClassName,
          )}
        >
          {value}
        </p>
      )}
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function MobilePageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}
