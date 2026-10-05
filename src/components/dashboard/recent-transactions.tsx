"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Filter } from "lucide-react";
import { useTransactionRows, type TransactionRow } from "@/hooks/listings";
import { formatCurrency, formatDate } from "@/lib/format";
import { paginate } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setDashboardPage } from "@/store/filtersSlice";
import type { TransactionStatus } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, RowAction, type Column } from "@/components/ui/data-table";
import { FilterSelect } from "@/components/ui/filter-select";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";

const STATUS_OPTIONS: { value: TransactionStatus | "All"; label: string }[] = [
  { value: "All", label: "All statuses" },
  { value: "Completed", label: "Completed" },
  { value: "Pending", label: "Pending" },
  { value: "Failed", label: "Failed" },
  { value: "Refunded", label: "Refunded" },
];

const columns: Column<TransactionRow>[] = [
  {
    key: "id",
    header: "Transaction ID",
    cell: (t) => <span className="text-[13px] font-semibold text-slate-900">{t.code}</span>,
  },
  {
    key: "user",
    header: "User",
    cell: (t) => (
      <span className="flex min-w-0 items-center gap-2">
        <Avatar src={t.user?.avatar} name={t.user?.name ?? "Unknown"} size={24} />
        <span className="truncate text-[13px] font-medium text-slate-900">
          {t.user?.name ?? `User #${t.userId}`}
        </span>
      </span>
    ),
    skeleton: (
      <span className="flex items-center gap-2">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </span>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    cell: (t) => <span className="text-[13px] font-semibold text-slate-900">{formatCurrency(Math.abs(t.amount))}</span>,
  },
  { key: "status", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
  {
    key: "date",
    header: "Date",
    cell: (t) => <span className="whitespace-nowrap text-[13px] text-slate-600">{formatDate(t.createdAt)}</span>,
  },
  {
    key: "action",
    header: "Action",
    align: "right",
    cell: (t) => (
      <RowAction label={`View ${t.code}`} href={`/transactions/${t.id}`}>
        <Eye className="size-4" />
      </RowAction>
    ),
    skeleton: <Skeleton className="size-4" />,
  },
];

function useRecent() {
  const { rows, isLoading, data, isError, error, refetch } = useTransactionRows();
  const [status, setStatus] = useState<TransactionStatus | "All">("All");
  const filtered = useMemo(
    () => (status === "All" ? rows : rows.filter((t) => t.status === status)),
    [rows, status],
  );
  const loading = isLoading || !data;
  return { filtered, status, setStatus, loading, isError, error, refetch };
}

export function RecentTransactionsCard() {
  const { filtered, status, setStatus, loading, isError, error, refetch } = useRecent();
  const page = useAppSelector((s) => s.filters.dashboardPage);
  const dispatch = useAppDispatch();
  const result = paginate(filtered, page, 4);

  return (
    <Card className="flex w-full flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
        <FilterSelect
          value={status}
          options={STATUS_OPTIONS}
          align="right"
          ariaLabel="Filter by status"
          onChange={(v) => {
            setStatus(v);
            dispatch(setDashboardPage(1));
          }}
          triggerClassName="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          trigger={
            <>
              <Filter className="size-3.5" />
              {status === "All" ? "Filter" : status}
            </>
          }
        />
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={result.items}
            loading={loading}
            skeletonRows={4}
            minWidth={640}
            getHref={(t) => `/transactions/${t.id}`}
            empty={<EmptyState title="No transactions" description="No transactions match this status." />}
          />
          {!loading && (
            <Pagination
              {...result}
              onPageChange={(p) => dispatch(setDashboardPage(p))}
            />
          )}
        </>
      )}
    </Card>
  );
}

/** Mobile list of the three most recent transactions. */
export function MobileRecentTransactions() {
  const { rows, isLoading, data, isError, error, refetch } = useTransactionRows();
  const loading = isLoading || !data;

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
        <Link href="/transactions" className="text-xs font-semibold text-indigo-600">
          View All
        </Link>
      </div>
      {isError ? (
        <Card>
          <ErrorState error={error} onRetry={() => refetch()} />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[58px] w-full rounded-lg" />)
            : rows.slice(0, 3).map((t) => (
                <Link
                  key={t.id}
                  href={`/transactions/${t.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 active:bg-slate-50"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    <Avatar src={t.user?.avatar} name={t.user?.name ?? "Unknown"} size={32} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[13px] font-semibold text-slate-900">
                        {t.user?.name ?? `User #${t.userId}`}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        {t.code}
                        <Image src="/figma/mobile-dot-sep.svg" alt="" width={3} height={3} />
                        {formatDate(t.createdAt)}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[13px] font-bold text-slate-900">{formatCurrency(Math.abs(t.amount))}</span>
                    <StatusBadge status={t.status} shape="pillSm" />
                  </span>
                </Link>
              ))}
        </div>
      )}
    </section>
  );
}
