"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { Download, Eye } from "lucide-react";
import { PAGE_SIZE, useTransactionList, type TransactionRow } from "@/hooks/listings";
import { downloadCsv } from "@/lib/csv";
import { formatCurrency, formatCurrencyCompact, formatDateTime, formatNumber } from "@/lib/format";
import { DATE_OPTIONS } from "@/lib/filter-options";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  resetFilters,
  setPage,
  setTransactionFilters,
  type AmountRange,
} from "@/store/filtersSlice";
import type { Transaction, TransactionType } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, TypeBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, RowAction, type Column } from "@/components/ui/data-table";
import { FilterSelect } from "@/components/ui/filter-select";
import { MobilePageHeader, MobileStat, PageHeader, StatCard } from "@/components/ui/kpi";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { MobileListContent } from "@/components/ui/mobile-list-content";

const TYPE_OPTIONS: { value: TransactionType | "All"; label: string }[] = [
  { value: "All", label: "All Types" },
  { value: "Payment", label: "Payment" },
  { value: "Transfer", label: "Transfer" },
  { value: "Refund", label: "Refund" },
];
const AMOUNT_OPTIONS: { value: AmountRange; label: string }[] = [
  { value: "all", label: "All" },
  { value: "lt100", label: "Under $100" },
  { value: "100to1000", label: "$100 – $1,000" },
  { value: "gt1000", label: "Over $1,000" },
];

function amountClass(t: Transaction) {
  return t.amount < 0 ? "text-red-500" : "text-slate-900";
}

const columns: Column<TransactionRow>[] = [
  {
    key: "id",
    header: "Transaction ID",
    width: 110,
    cell: (t) => <span className="text-[13px] font-semibold text-slate-900">{t.code}</span>,
  },
  {
    key: "user",
    header: "User",
    cell: (t) => (
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <Avatar src={t.user?.avatar} name={t.user?.name ?? "Unknown"} size={24} />
        <span className="truncate text-[13px] font-medium text-slate-900">{t.user?.name ?? `User #${t.userId}`}</span>
      </span>
    ),
    skeleton: (
      <span className="flex items-center gap-2">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </span>
    ),
  },
  { key: "type", header: "Type", width: 100, cell: (t) => <TypeBadge type={t.type} /> },
  {
    key: "amount",
    header: "Amount",
    width: 110,
    cell: (t) => <span className={cn("text-[13px] font-semibold", amountClass(t))}>{formatCurrency(t.amount)}</span>,
  },
  { key: "status", header: "Status", width: 120, cell: (t) => <StatusBadge status={t.status} /> },
  {
    key: "date",
    header: "Date & Time",
    width: 160,
    cell: (t) => <span className="whitespace-nowrap text-[13px] text-slate-600">{formatDateTime(t.createdAt)}</span>,
  },
  {
    key: "actions",
    header: "Actions",
    width: 60,
    align: "right",
    cell: (t) => (
      <RowAction label={`View ${t.code}`} href={`/transactions/${t.id}`} className="mr-[14px]">
        <Eye className="size-4" />
      </RowAction>
    ),
    skeleton: <Skeleton className="size-4" />,
  },
];

function useTransactionStats(rows: Transaction[]) {
  return useMemo(() => {
    const volume = rows.reduce((s, t) => s + Math.abs(t.amount), 0);
    const ok = rows.filter((t) => t.status === "Completed" || t.status === "Refunded").length;
    return {
      total: rows.length,
      volume,
      avg: rows.length ? volume / rows.length : 0,
      successRate: rows.length ? (ok / rows.length) * 100 : 0,
    };
  }, [rows]);
}

function exportCsv(rows: TransactionRow[]) {
  downloadCsv(
    "transactions.csv",
    rows.map((t) => ({
      id: t.code,
      user: t.user?.name ?? `User #${t.userId}`,
      type: t.type,
      amount: t.amount.toFixed(2),
      status: t.status,
      date: formatDateTime(t.createdAt),
    })),
  );
}

export function TransactionsView() {
  const list = useTransactionList();
  const stats = useTransactionStats(list.rows);
  const filters = useAppSelector((s) => s.filters.transactions);
  const dispatch = useAppDispatch();
  const hasFilters = filters.search || filters.dateRange !== "all" || filters.type !== "All" || filters.amount !== "all";

  const empty = (
    <EmptyState
      title="No transactions found"
      description={hasFilters ? "Try widening the date range or clearing filters." : "Transactions will appear here once processed."}
      action={
        hasFilters && (
          <Button size="sm" onClick={() => dispatch(resetFilters("transactions"))}>
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
          title="Transaction History"
          description="Monitor and manage all corporate financial transactions"
          action={
            <Button disabled={list.isLoading || list.rows.length === 0} onClick={() => exportCsv(list.rows)}>
              <Download className="size-4" />
              Export CSV
            </Button>
          }
        />

        <div className="flex w-full items-center gap-4">
          <StatCard label="Total Transactions" value={formatNumber(stats.total)} loading={loading} />
          <StatCard label="Total Volume" value={formatCurrencyCompact(stats.volume)} loading={loading} />
          <StatCard label="Avg. Transaction" value={formatCurrency(stats.avg)} loading={loading} />
          <StatCard
            label="Success Rate"
            value={`${stats.successRate.toFixed(1)}%`}
            valueClassName="text-emerald-500"
            loading={loading}
          >
            <span className="relative h-9 w-20 shrink-0">
              <Image
                src="/figma/success-sparkline.svg"
                alt=""
                width={81}
                height={38}
                className="absolute -left-[1.77%] -top-[5.94%] h-[105.94%] w-[101.77%] max-w-none"
              />
            </span>
          </StatCard>
        </div>

        <Card className="flex w-full flex-wrap items-center gap-3 p-4">
          <SearchInput
            value={filters.search}
            onChange={(search) => dispatch(setTransactionFilters({ search }))}
            placeholder="Search ID or User..."
            className="w-60"
          />
          <FilterSelect
            label="Date"
            weight="regular"
            value={filters.dateRange}
            options={DATE_OPTIONS}
            onChange={(dateRange) => dispatch(setTransactionFilters({ dateRange }))}
          />
          <FilterSelect
            label="Type"
            weight="regular"
            value={filters.type}
            options={TYPE_OPTIONS}
            onChange={(type) => dispatch(setTransactionFilters({ type }))}
          />
          <FilterSelect
            label="Amount"
            weight="regular"
            value={filters.amount}
            options={AMOUNT_OPTIONS}
            onChange={(amount) => dispatch(setTransactionFilters({ amount }))}
          />
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
                minWidth={960}
                getHref={(t) => `/transactions/${t.id}`}
                empty={empty}
              />
              {!loading && list.result.total > 0 && (
                <Pagination
                  {...list.result}
                  className="pt-3"
                  onPageChange={(page) => dispatch(setPage({ section: "transactions", page }))}
                />
              )}
            </>
          )}
        </Card>
      </div>

      {/* Mobile */}
      <div className="flex w-full flex-col gap-4 p-4 lg:hidden">
        <MobilePageHeader title="Transactions Ledger" description="Monitor corporate financial ledger" />
        <div className="flex gap-2">
          <SearchInput
            value={filters.search}
            onChange={(search) => dispatch(setTransactionFilters({ search }))}
            placeholder="Search Transaction..."
            className="flex-1 bg-white"
            iconSize={14}
          />
          <FilterSelect
            value={filters.type}
            options={TYPE_OPTIONS}
            onChange={(type) => dispatch(setTransactionFilters({ type }))}

            align="right"
            ariaLabel="Filter by type"
            triggerClassName="block size-9 rounded-lg"
            trigger={<Image src="/figma/mobile-filter-btn.svg" alt="" width={36} height={36} />}
          />
          <button
            type="button"
            aria-label="Export CSV"
            disabled={list.isLoading || list.rows.length === 0}
            onClick={() => exportCsv(list.rows)}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
          >
            <Download className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MobileStat label="Total Txns" value={formatNumber(stats.total)} loading={loading} />
          <MobileStat label="Total Volume" value={formatCurrencyCompact(stats.volume)} loading={loading} />
          <MobileStat label="Avg. Amount" value={formatCurrency(stats.avg)} loading={loading} />
          <MobileStat
            label="Success Rate"
            value={`${stats.successRate.toFixed(1)}%`}
            valueClassName="text-emerald-800"
            loading={loading}
          />
        </div>

        {list.isError ? (
          <Card>
            <ErrorState error={list.error} onRetry={() => list.refetch()} />
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            <MobileListContent
              items={list.result.items}
              isLoading={loading}
              skeletonHeight="h-[123px]"
              emptyState={<Card>{empty}</Card>}
              renderItem={(t) => <MobileTransactionCard key={t.id} txn={t} />}
            />
          </div>
        )}
        {!loading && list.result.total > PAGE_SIZE && (
          <Pagination {...list.result} onPageChange={(page) => dispatch(setPage({ section: "transactions", page }))} />
        )}
      </div>
    </>
  );
}

function MobileTransactionCard({ txn: t }: { txn: TransactionRow }) {
  return (
    <Link
      href={`/transactions/${t.id}`}
      className="flex flex-col gap-2.5 rounded-lg border border-slate-200 bg-white p-3 active:bg-slate-50"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-slate-900">{t.code}</span>
        <StatusBadge status={t.status} shape="pillSm" />
      </div>
      <div className="h-px w-full bg-slate-200" />
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <Avatar src={t.user?.avatar} name={t.user?.name ?? "Unknown"} size={24} />
          <span className="truncate text-[13px] font-medium text-slate-600">{t.user?.name ?? `User #${t.userId}`}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          <span className={cn("text-[13px] font-bold", t.amount < 0 ? "text-red-800" : "text-slate-900")}>
            {formatCurrency(t.amount)}
          </span>
          <TypeBadge type={t.type} mobile />
        </span>
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-slate-500">{formatDateTime(t.createdAt)}</span>
        <Image src="/figma/mobile-view-btn.svg" alt="" width={20} height={20} />
      </div>
    </Link>
  );
}

