"use client";

import { ArrowLeftRight, Calendar, DollarSign, Users } from "lucide-react";
import { useBookings, useTransactions, useUsers } from "@/hooks/queries";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { formatCurrencyCompact, formatFullDate, formatNumber } from "@/lib/format";
import { useAppSelector } from "@/store";
import { Card } from "@/components/ui/card";
import { KpiCard, TrendChip } from "@/components/ui/kpi";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { ADMIN } from "@/components/layout/nav-config";
import { DashboardTabs, MobileDashboardTabs } from "./dashboard-tabs";
import { MobileRecentTransactions, RecentTransactionsCard } from "./recent-transactions";
import { MobileRevenueCard, RevenueChartCard } from "./revenue-chart";
import { AnalyticsTab, ReportsTab, SettingsTab } from "./secondary-tabs";
import { SystemAlertsCard, SystemHealthCard } from "./system-cards";

function useKpis() {
  const users = useUsers();
  const txns = useTransactions();
  const bookings = useBookings();
  const s = useDashboardStats(users.data, txns.data, bookings.data);
  return {
    error: users.error ?? txns.error ?? bookings.error,
    retry: () => {
      users.refetch();
      txns.refetch();
      bookings.refetch();
    },
    items: [
      { label: "Total Users", mobileLabel: "Total Users", value: formatNumber(s.totalUsers), trend: s.usersTrend, icon: Users, loading: users.isLoading },
      { label: "Total Revenue", mobileLabel: "Total Revenue", value: formatCurrencyCompact(s.totalRevenue), trend: s.revenueTrend, icon: DollarSign, loading: txns.isLoading },
      { label: "Active Bookings", mobileLabel: "Active Bookings", value: formatNumber(s.activeBookings), trend: s.bookingsTrend, icon: Calendar, loading: bookings.isLoading },
      { label: "Pending Transactions", mobileLabel: "Pending Txns", value: formatNumber(s.pendingTransactions), trend: s.pendingTrend, icon: ArrowLeftRight, loading: txns.isLoading },
    ],
  };
}

function Overview() {
  const kpis = useKpis();
  return (
    <>
      {kpis.error ? (
        <Card>
          <ErrorState title="Couldn't load statistics" error={kpis.error} onRetry={kpis.retry} />
        </Card>
      ) : (
        <div className="grid w-full grid-cols-2 gap-4 xl:grid-cols-4">
          {kpis.items.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>
      )}

      <div className="flex w-full flex-col gap-6 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <RevenueChartCard />
          <RecentTransactionsCard />
        </div>
        <div className="flex w-full flex-col gap-6 xl:w-[360px] xl:shrink-0">
          <SystemAlertsCard />
          <SystemHealthCard />
        </div>
      </div>
    </>
  );
}

function MobileOverview() {
  const kpis = useKpis();
  return (
    <>
      {kpis.error ? (
        <Card>
          <ErrorState title="Couldn't load statistics" error={kpis.error} onRetry={kpis.retry} />
        </Card>
      ) : (
        <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.items.map((k) => (
            <Card key={k.label} className="flex min-w-0 flex-col gap-2 p-3">
              <p className="truncate text-xs font-medium text-slate-500">{k.mobileLabel}</p>
              {k.loading ? (
                <>
                  <Skeleton className="h-[22px] w-20" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-slate-900">{k.value}</p>
                  <div className="flex items-center gap-1">
                    <TrendChip value={k.trend} size="xs" strong />
                    <span className="text-[10px] text-slate-500">vs last mo</span>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
      <MobileRevenueCard />
      <MobileRecentTransactions />
      <SystemAlertsCard mobile />
      <SystemHealthCard mobile />
    </>
  );
}

export function DashboardView() {
  const tab = useAppSelector((s) => s.ui.dashboardTab);

  const secondary =
    tab === "Analytics" ? <AnalyticsTab /> : tab === "Reports" ? <ReportsTab /> : tab === "Settings" ? <SettingsTab /> : null;

  return (
    <>
      {/* Desktop */}
      <div className="hidden w-full flex-col gap-6 p-8 lg:flex">
        <DashboardTabs />
        {secondary ?? <Overview />}
      </div>

      {/* Mobile */}
      <div className="flex w-full flex-col gap-4 p-4 lg:hidden">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-bold text-slate-900">Welcome back, {ADMIN.firstName}</h1>
          <p className="text-xs text-slate-500" suppressHydrationWarning>
            {formatFullDate(new Date())}
          </p>
        </div>
        <MobileDashboardTabs />
        {secondary ?? <MobileOverview />}
      </div>
    </>
  );
}
