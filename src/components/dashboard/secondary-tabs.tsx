"use client";

import { Download } from "lucide-react";
import { useBookings, useTransactions, useUsers } from "@/hooks/queries";
import { downloadCsv } from "@/lib/csv";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { toggleSetting } from "@/store/uiSlice";
import { statusTone, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { RevenueChartCard } from "./revenue-chart";

const BAR_COLOR: Record<BadgeTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-slate-400",
  muted: "bg-slate-400",
  primary: "bg-indigo-600",
};

function Breakdown<T extends string>({
  title,
  counts,
  loading,
  context,
}: {
  title: string;
  counts: [T, number][];
  loading: boolean;
  context?: "booking";
}) {
  const total = counts.reduce((s, [, n]) => s + n, 0) || 1;
  return (
    <Card className="flex flex-1 flex-col gap-4 p-5">
      <CardTitle>{title}</CardTitle>
      <ul className="flex flex-col gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
          : counts.map(([label, n]) => (
              <li key={label} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold text-slate-900">
                    {n} <span className="font-normal text-slate-400">({Math.round((n / total) * 100)}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className={cn("h-2 rounded-full", BAR_COLOR[statusTone(label as never, context)])}
                    style={{ width: `${(n / total) * 100}%` }}
                  />
                </div>
              </li>
            ))}
      </ul>
    </Card>
  );
}

function countBy<T, K extends string>(items: T[] | undefined, key: (t: T) => K) {
  const map = new Map<K, number>();
  items?.forEach((i) => map.set(key(i), (map.get(key(i)) ?? 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export function AnalyticsTab() {
  const txns = useTransactions();
  const bookings = useBookings();
  if (txns.isError || bookings.isError)
    return (
      <Card>
        <ErrorState onRetry={() => (txns.refetch(), bookings.refetch())} />
      </Card>
    );
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="hidden lg:block">
        <RevenueChartCard />
      </div>
      <div className="flex flex-col gap-4 md:flex-row lg:gap-6">
        <Breakdown title="Transactions by Status" counts={countBy(txns.data, (t) => t.status)} loading={txns.isLoading} />
        <Breakdown
          title="Bookings by Status"
          counts={countBy(bookings.data, (b) => b.status)}
          loading={bookings.isLoading}
          context="booking"
        />
      </div>
    </div>
  );
}

export function ReportsTab() {
  const users = useUsers();
  const txns = useTransactions();
  const bookings = useBookings();

  const reports = [
    {
      title: "User Directory",
      description: "All registered users with role, status and join date.",
      count: users.data?.length,
      loading: users.isLoading,
      onExport: () =>
        downloadCsv(
          "users.csv",
          (users.data ?? []).map((u) => ({
            id: u.code,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            joined: formatDate(u.joinedAt),
          })),
        ),
    },
    {
      title: "Transactions Ledger",
      description: "Every payment, transfer and refund with amounts.",
      count: txns.data?.length,
      loading: txns.isLoading,
      onExport: () =>
        downloadCsv(
          "transactions.csv",
          (txns.data ?? []).map((t) => ({
            id: t.code,
            type: t.type,
            status: t.status,
            amount: formatCurrency(t.amount),
            date: formatDate(t.createdAt),
          })),
        ),
    },
    {
      title: "Bookings Schedule",
      description: "Upcoming and past bookings by service and status.",
      count: bookings.data?.length,
      loading: bookings.isLoading,
      onExport: () =>
        downloadCsv(
          "bookings.csv",
          (bookings.data ?? []).map((b) => ({
            id: b.code,
            service: b.service,
            status: b.status,
            amount: formatCurrency(b.amount),
            scheduled: formatDate(b.scheduledAt),
          })),
        ),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
      {reports.map((r) => (
        <Card key={r.title} className="flex flex-col gap-3 p-5">
          <CardTitle>{r.title}</CardTitle>
          <p className="flex-1 text-[13px] text-slate-500">{r.description}</p>
          <p className="text-xs text-slate-500">
            {r.loading ? "Loading records…" : `${formatNumber(r.count ?? 0)} records`}
          </p>
          <Button size="sm" disabled={r.loading || !r.count} onClick={r.onExport} className="self-start">
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </Card>
      ))}
    </div>
  );
}

const SETTINGS = [
  { key: "emailAlerts", label: "Email alerts", description: "Send critical system alerts to your inbox." },
  { key: "weeklyDigest", label: "Weekly digest", description: "A Monday summary of revenue and bookings." },
  { key: "compactTables", label: "Compact tables", description: "Reduce row height in data tables." },
] as const;

export function SettingsTab() {
  const settings = useAppSelector((s) => s.ui.settings);
  const dispatch = useAppDispatch();
  return (
    <Card className="flex max-w-2xl flex-col gap-4 p-5">
      <CardTitle>Preferences</CardTitle>
      <ul className="flex flex-col">
        {SETTINGS.map((s) => (
          <Toggle
            key={s.key}
            label={s.label}
            description={s.description}
            checked={settings[s.key]}
            onChange={() => dispatch(toggleSetting(s.key))}
          />
        ))}
        <Toggle
          label="Enforce two-factor authentication"
          description="Managed by your organization's security policy."
          checked
          disabled
        />
      </ul>
    </Card>
  );
}

function Toggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-slate-200 py-3 last:border-0">
      <div className={cn("flex flex-col gap-0.5", disabled && "opacity-60")}>
        <p className="text-[13px] font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onChange}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-indigo-600" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "absolute left-0 top-0.5 size-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
    </li>
  );
}
