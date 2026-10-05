"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Calendar, Download, Eye, Pen, Plus } from "lucide-react";
import { PAGE_SIZE, useBookingList, type BookingRow } from "@/hooks/listings";
import { useNow } from "@/hooks/use-now";
import { downloadCsv } from "@/lib/csv";
import { DATE_OPTIONS } from "@/lib/filter-options";
import { formatCurrency, formatDateTime, formatDuration, formatNumber } from "@/lib/format";
import { useAppDispatch, useAppSelector } from "@/store";
import { resetFilters, setBookingFilters, setPage } from "@/store/filtersSlice";
import type { Booking, BookingStatus } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, RowAction, type Column } from "@/components/ui/data-table";
import { FilterSelect } from "@/components/ui/filter-select";
import { KpiCard, MobilePageHeader, MobileStat, PageHeader } from "@/components/ui/kpi";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { MobileListContent } from "@/components/ui/mobile-list-content";
import { SERVICES } from "@/lib/api/mappers";
import { NewBookingDialog } from "./new-booking-dialog";

const STATUS_OPTIONS: { value: BookingStatus | "All"; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Pending", label: "Pending" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];
const SERVICE_OPTIONS = [{ value: "All", label: "All" }, ...SERVICES.map((s) => ({ value: s, label: s }))];

const columns: Column<BookingRow>[] = [
  {
    key: "id",
    header: "Booking ID",
    width: 110,
    cell: (b) => <span className="text-[13px] font-semibold text-slate-900">{b.code}</span>,
  },
  {
    key: "customer",
    header: "Customer",
    cell: (b) => (
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <Avatar src={b.user?.avatar} name={b.user?.name ?? "Unknown"} size={24} />
        <span className="truncate text-[13px] font-medium text-slate-900">{b.user?.name ?? `User #${b.userId}`}</span>
      </span>
    ),
    skeleton: (
      <span className="flex items-center gap-2">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </span>
    ),
  },
  {
    key: "service",
    header: "Service",
    // Flexes (Figma: 150px) so the table fits a 1440px viewport without clipping.
    cell: (b) => <span className="truncate text-[13px] text-slate-900">{b.service}</span>,
  },
  {
    key: "date",
    header: "Date & Time",
    width: 160,
    cell: (b) => <span className="whitespace-nowrap text-[13px] text-slate-600">{formatDateTime(b.scheduledAt)}</span>,
  },
  {
    key: "duration",
    header: "Duration",
    width: 100,
    cell: (b) => <span className="text-[13px] text-slate-600">{formatDuration(b.durationHours)}</span>,
  },
  {
    key: "status",
    header: "Status",
    width: 100,
    cell: (b) => <StatusBadge status={b.status} context="booking" />,
  },
  {
    key: "amount",
    header: "Amount",
    width: 100,
    cell: (b) => <span className="text-[13px] font-semibold text-slate-900">{formatCurrency(b.amount)}</span>,
  },
  {
    key: "actions",
    header: "Actions",
    width: 80,
    align: "right",
    cell: (b) => (
      <span className="flex gap-3">
        <RowAction label={`View ${b.code}`} href={`/bookings/${b.id}`}>
          <Eye className="size-4" />
        </RowAction>
        <RowAction label={`Edit ${b.code}`} href={`/bookings/${b.id}`}>
          <Pen className="size-4" />
        </RowAction>
      </span>
    ),
    skeleton: <Skeleton className="h-4 w-10" />,
  },
];

function useBookingStats(rows: Booking[]) {
  const now = useNow();
  return useMemo(() => {
    const DAY = 86_400_000;
    const count = (pred: (b: Booking) => boolean) => rows.filter(pred).length;
    const trend = (pred: (b: Booking) => boolean) => {
      const at = (b: Booking) => new Date(b.scheduledAt).getTime();
      const cur = count((b) => pred(b) && at(b) > now - 30 * DAY && at(b) <= now + 30 * DAY);
      const prev = count((b) => pred(b) && at(b) > now - 90 * DAY && at(b) <= now - 30 * DAY);
      return ((cur - prev) / Math.max(prev, 1)) * 100;
    };
    const active = (b: Booking) => b.status === "Confirmed" || b.status === "Pending";
    const done = (b: Booking) => b.status === "Completed";
    const cancelled = (b: Booking) => b.status === "Cancelled";
    return {
      total: rows.length,
      totalTrend: trend(() => true),
      active: count(active),
      activeTrend: trend(active),
      completed: count(done),
      completedTrend: trend(done),
      cancelled: count(cancelled),
      cancelledTrend: trend(cancelled),
    };
  }, [rows, now]);
}

function exportCsv(rows: BookingRow[]) {
  downloadCsv(
    "bookings.csv",
    rows.map((b) => ({
      id: b.code,
      customer: b.user?.name ?? `User #${b.userId}`,
      service: b.service,
      scheduled: formatDateTime(b.scheduledAt),
      duration: formatDuration(b.durationHours),
      status: b.status,
      amount: b.amount.toFixed(2),
    })),
  );
}

export function BookingsView() {
  const list = useBookingList();
  const stats = useBookingStats(list.rows);
  const filters = useAppSelector((st) => st.filters.bookings);
  const dispatch = useAppDispatch();
  const [creating, setCreating] = useState(false);
  const hasFilters = filters.search || filters.dateRange !== "all" || filters.status !== "All" || filters.service !== "All";

  const empty = (
    <EmptyState
      title="No bookings found"
      description={hasFilters ? "Try another status, service or date range." : "New bookings will appear here."}
      action={
        hasFilters && (
          <Button size="sm" onClick={() => dispatch(resetFilters("bookings"))}>
            Clear filters
          </Button>
        )
      }
    />
  );

  const loading = list.isPending || !list.data;

  return (
    <>
      {/* Desktop */}
      <div className="hidden w-full flex-col gap-6 p-8 lg:flex">
        <PageHeader
          title="Bookings Directory"
          description="Manage all service bookings and consultation meetings"
          action={
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              New Booking
            </Button>
          }
        />

        <div className="grid w-full grid-cols-2 gap-4 xl:grid-cols-4">
          <KpiCard strongTrend label="Total Bookings" value={formatNumber(stats.total)} trend={stats.totalTrend} icon={Calendar} loading={loading} />
          <KpiCard strongTrend label="Active Bookings" value={formatNumber(stats.active)} trend={stats.activeTrend} icon={Calendar} loading={loading} />
          <KpiCard strongTrend label="Completed Bookings" value={formatNumber(stats.completed)} trend={stats.completedTrend} icon={Calendar} loading={loading} />
          <KpiCard strongTrend label="Cancelled Bookings" value={formatNumber(stats.cancelled)} trend={stats.cancelledTrend} icon={Calendar} loading={loading} />
        </div>

        <Card className="flex w-full flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={filters.search}
              onChange={(search) => dispatch(setBookingFilters({ search }))}
              placeholder="Search bookings by ID or client..."
              className="w-60"
            />
            <FilterSelect
              label="Date Range"
              value={filters.dateRange}
              options={DATE_OPTIONS}
              onChange={(dateRange) => dispatch(setBookingFilters({ dateRange }))}
            />
            <FilterSelect
              label="Status"
              value={filters.status}
              options={STATUS_OPTIONS}
              onChange={(status) => dispatch(setBookingFilters({ status }))}
            />
            <FilterSelect
              label="Service Type"
              value={filters.service}
              options={SERVICE_OPTIONS}
              onChange={(service) => dispatch(setBookingFilters({ service }))}
            />
          </div>
          <button
            type="button"
            disabled={loading || list.rows.length === 0}
            onClick={() => exportCsv(list.rows)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="size-3.5" />
            Export List
          </button>
        </Card>

        <Card className="flex w-full flex-col gap-4 p-5">
          {list.isError ? (
            <ErrorState error={list.error} onRetry={() => list.refetch()} />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={list.result.items}
                loading={loading}
                minWidth={1060}
                lastRowBorder={false}
                getHref={(b) => `/bookings/${b.id}`}
                empty={empty}
              />
              {!loading && list.result.total > 0 && (
                <Pagination
                  {...list.result}
                  className="pt-3"
                  onPageChange={(page) => dispatch(setPage({ section: "bookings", page }))}
                />
              )}
            </>
          )}
        </Card>
      </div>

      {/* Mobile */}
      <div className="flex w-full flex-col gap-4 p-4 lg:hidden">
        <MobilePageHeader title="Active Bookings" description="Manage and schedule corporate bookings" />
        <div className="flex gap-2">
          <SearchInput
            value={filters.search}
            onChange={(search) => dispatch(setBookingFilters({ search }))}
            placeholder="Search bookings..."
            className="flex-1 bg-white"
            iconSize={14}
          />
          <FilterSelect
            value={filters.status}
            options={STATUS_OPTIONS.map((o) => ({ ...o, label: o.value === "All" ? "All statuses" : o.label }))}
            onChange={(status) => dispatch(setBookingFilters({ status }))}
            align="right"
            ariaLabel="Filter bookings by status"
            triggerClassName="block size-9 rounded-lg"
            trigger={<Image src="/figma/mobile-filter-btn.svg" alt="" width={36} height={36} />}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MobileStat label="Total Bookings" value={formatNumber(stats.total)} loading={loading} />
          <MobileStat label="Active Sessions" value={formatNumber(stats.active)} valueClassName="text-indigo-600" loading={loading} />
          <MobileStat label="Completed" value={formatNumber(stats.completed)} valueClassName="text-emerald-800" loading={loading} />
          <MobileStat label="Cancelled" value={formatNumber(stats.cancelled)} valueClassName="text-red-800" loading={loading} />
        </div>
        <Button variant="primary" className="rounded-lg p-3 text-[13px]" onClick={() => setCreating(true)}>
          + Create New Booking
        </Button>

        {list.isError ? (
          <Card>
            <ErrorState error={list.error} onRetry={() => list.refetch()} />
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            <MobileListContent
              items={list.result.items}
              isLoading={loading}
              skeletonHeight="h-[114px]"
              emptyState={<Card>{empty}</Card>}
              renderItem={(b) => <MobileBookingCard key={b.id} booking={b} />}
            />
          </div>
        )}
        {!loading && list.result.total > PAGE_SIZE && (
          <Pagination {...list.result} onPageChange={(page) => dispatch(setPage({ section: "bookings", page }))} />
        )}
      </div>

      <NewBookingDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function MobileBookingCard({ booking: b }: { booking: BookingRow }) {
  const when = new Date(b.scheduledAt);
  return (
    <Link
      href={`/bookings/${b.id}`}
      className="flex flex-col gap-2.5 rounded-lg border border-slate-200 bg-white p-3 active:bg-slate-50"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-slate-900">{b.code}</span>
        <StatusBadge status={b.status} shape="pillSm" />
      </div>
      <div className="h-px w-full bg-slate-200" />
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <Avatar src={b.user?.avatar} name={b.user?.name ?? "Unknown"} size={24} />
          <span className="flex min-w-0 flex-col gap-px">
            <span className="truncate text-[13px] font-semibold text-slate-900">{b.user?.name ?? `User #${b.userId}`}</span>
            <span className="truncate text-[11px] text-slate-500">{b.service}</span>
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-bold text-indigo-600">{formatCurrency(b.amount)}</span>
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-slate-500">
          {when.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
          {when.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <Image src="/figma/mobile-booking-edit-btn.svg" alt="" width={20} height={20} />
      </div>
    </Link>
  );
}
