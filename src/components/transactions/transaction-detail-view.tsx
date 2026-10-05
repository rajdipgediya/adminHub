"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeftRight, Check, Printer, X } from "lucide-react";
import { usePatchTransaction } from "@/hooks/mutations";
import { useTransaction, useUser, useUserTransactions } from "@/hooks/queries";
import { formatCurrency, formatDateTime, formatShortDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Breadcrumbs, DetailRow, Timeline, type TimelineEntry } from "@/components/ui/detail";
import { DetailState } from "@/components/ui/detail-state";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { MobileDetailHeader } from "@/components/layout/mobile-nav";

const TYPE_LABEL = { Payment: "Service Payment", Transfer: "Account Transfer", Refund: "Customer Refund" } as const;

const HEADER_TONE: Record<Transaction["status"], string> = {
  Completed: "bg-emerald-100 text-emerald-500",
  Pending: "bg-amber-100 text-amber-500",
  Failed: "bg-red-100 text-red-500",
  Refunded: "bg-slate-100 text-slate-500",
};

interface Step extends TimelineEntry {
  icon: "check" | "x";
}

function useHistory(t: Transaction | undefined) {
  return useMemo<Step[]>(() => {
    if (!t) return [];
    const at = new Date(t.createdAt).getTime();
    const stamp = (offsetMin: number) => formatShortDateTime(new Date(at + offsetMin * 60_000).toISOString());
    const initiated: Step = { title: "Initiated", description: "Checkout session initialized", time: stamp(-4), icon: "check" };
    const authorized: Step = {
      title: "Processing & Authorized",
      description: `${t.method.split(" (")[0]} gateway auth approved`,
      time: stamp(-2),
      icon: "check",
    };
    switch (t.status) {
      case "Completed":
        return [
          { title: "Completed & Disbursed", description: "Settled in merchant bank account", time: stamp(0), icon: "check", tone: "green" },
          authorized,
          initiated,
        ];
      case "Refunded":
        return [
          { title: "Refund Issued", description: "Returned to original payment method", time: stamp(0), icon: "check", tone: "green" },
          authorized,
          initiated,
        ];
      case "Failed":
        return [{ title: "Payment Failed", description: "Issuer declined the authorization", time: stamp(0), icon: "x" }, initiated];
      default:
        return [{ ...authorized, title: "Awaiting Settlement", description: "Authorized, pending bank settlement" }, initiated];
    }
  }, [t]);
}

const ledgerColumns: Column<Transaction>[] = [
  { key: "id", header: "Transaction ID", width: 120, cell: (t) => <span className="text-[13px] font-semibold text-slate-900">{t.code}</span> },
  { key: "method", header: "Gateway Method", width: 120, cell: (t) => <span className="truncate text-[13px] text-slate-600">{t.method}</span> },
  { key: "amount", header: "Amount", width: 100, cell: (t) => <span className="text-[13px] font-semibold text-slate-900">{formatCurrency(t.amount)}</span> },
  { key: "status", header: "Status", width: 120, cell: (t) => <StatusBadge status={t.status} /> },
  { key: "date", header: "Settled At", width: 160, cell: (t) => <span className="whitespace-nowrap text-[13px] text-slate-500">{formatDateTime(t.createdAt)}</span> },
];

export function TransactionDetailView({ id }: { id: number }) {
  const txn = useTransaction(id);
  const t = txn.data;
  const customer = useUser(t?.userId ?? Number.NaN);
  const related = useUserTransactions(t?.userId);
  const history = useHistory(t);
  const patch = usePatchTransaction();
  const [confirming, setConfirming] = useState(false);

  const u = customer.data;
  const ledger = related.data?.filter((r) => r.id !== id) ?? [];
  const canRefund = t?.status === "Completed" && t.type !== "Refund";
  const gross = t ? Math.abs(t.amount) : 0;
  const loadingRelated = related.isPending || !related.data;

  const state = !t && (
    <DetailState isLoading={txn.isLoading} error={txn.error} onRetry={() => txn.refetch()} entity="Transaction" backHref="/transactions" />
  );

  const refundDialog = t && (
    <ConfirmDialog
      open={confirming}
      onClose={() => setConfirming(false)}
      title={`Refund ${t.code}?`}
      description={`${formatCurrency(gross)} will be returned to ${u?.name ?? "the customer"} via ${t.method}.`}
      confirmLabel="Issue Refund"
      pending={patch.isPending}
      error={patch.error?.message}
      onConfirm={() => patch.mutate({ id: t.id, patch: { status: "Refunded" } }, { onSuccess: () => setConfirming(false) })}
    />
  );

  return (
    <>
      {/* Dedicated Stripe-like Print Invoice */}
      <div className="hidden print:!block bg-white text-slate-900 w-full max-w-4xl mx-auto p-12">
        {t && (
          <div className="flex flex-col gap-12">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded bg-indigo-600 text-white font-bold text-lg">A</div>
                  <span className="text-xl font-bold text-slate-900">AdminHub</span>
                </div>
                <div className="text-sm text-slate-500 mt-2">
                  <p>123 Business Avenue</p>
                  <p>San Francisco, CA 94107</p>
                  <p>support@adminhub.com</p>
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-4xl font-light text-slate-400 uppercase tracking-widest mb-2">Receipt</h1>
                <p className="text-sm font-semibold text-slate-900">{t.code}</p>
                <p className="text-sm text-slate-500">Amount Paid</p>
                <p className="text-3xl font-semibold text-slate-900">{formatCurrency(t.amount)}</p>
                <p className="text-sm text-slate-500 mt-2">Paid {formatDateTime(t.createdAt)}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="flex flex-col gap-2 border-y py-6 border-slate-200">
              <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Billed To</h3>
              <p className="text-sm font-semibold text-slate-900">{u?.name ?? "Customer"}</p>
              <p className="text-sm text-slate-500">{u?.email}</p>
              <p className="text-sm text-slate-500">{u?.phone}</p>
            </div>

            {/* Line Items */}
            <div className="flex flex-col">
              <div className="flex w-full text-xs font-semibold uppercase text-slate-400 tracking-wider border-b border-slate-200 pb-3">
                <div className="flex-1">Description</div>
                <div className="w-32 text-right">Amount</div>
              </div>
              <div className="flex w-full text-sm text-slate-900 border-b border-slate-200 py-4">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="font-medium">{TYPE_LABEL[t.type]}</span>
                  <span className="text-slate-500 text-xs">Reference: {t.reference}</span>
                </div>
                <div className="w-32 text-right pt-0.5">{formatCurrency(gross - t.fee)}</div>
              </div>
              <div className="flex w-full text-sm text-slate-900 border-b border-slate-200 py-4">
                <div className="flex-1">Processing Gateway Fee ({t.method})</div>
                <div className="w-32 text-right">{formatCurrency(t.fee)}</div>
              </div>
              
              {/* Totals */}
              <div className="flex w-full justify-end pt-6">
                <div className="w-64 flex flex-col gap-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(gross - t.fee)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Processing Fee</span>
                    <span>{formatCurrency(t.fee)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t border-slate-200">
                    <span>Total Paid</span>
                    <span>{formatCurrency(gross)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="text-center text-xs text-slate-400 mt-20">
              <p>If you have any questions about this receipt, please contact support@adminhub.com.</p>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Dashboard View */}
      <div className="hidden w-full flex-col gap-6 p-8 lg:flex print:!hidden">
        <div>
          <Breadcrumbs parent="Transactions" href="/transactions" current={t?.code ?? (txn.isError ? "Not found" : undefined)} />
        </div>
        {state || (t && (
          <>
            <Card className="flex items-center justify-between gap-6 p-6">
              <div className="flex min-w-0 items-center gap-5">
                <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", HEADER_TONE[t.status])}>
                  <ArrowLeftRight className="size-6" />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[22px] font-bold text-slate-900 print:text-3xl">Transaction {t.code}</h2>
                    <StatusBadge status={t.status === "Completed" ? "Paid" : t.status} />
                  </div>
                  <p className="truncate text-sm text-slate-500">
                    Reference {t.reference} • Generated on {formatDateTime(t.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-3">
                <Button variant="ghost" onClick={() => window.print()}>
                  <Printer className="size-3.5" />
                  Print Receipt
                </Button>
                <Button variant="primary" disabled={!canRefund} onClick={() => setConfirming(true)}>
                  {t.status === "Refunded" ? "Refunded" : "Refund Transaction"}
                </Button>
              </div>
            </Card>

            <div className="flex w-full items-start gap-6">
              <div className="flex min-w-0 flex-1 flex-col gap-6">
                <Card className="flex flex-col gap-4 p-5">
                  <CardTitle>Transaction Invoice Details</CardTitle>
                  <div className="flex flex-col gap-3">
                    <DetailRow label="Transaction Type">{TYPE_LABEL[t.type]}</DetailRow>
                    <DetailRow label="Payment Method">{t.method}</DetailRow>
                    <DetailRow label="Processing Gateway Fee">{formatCurrency(t.fee)}</DetailRow>
                    <DetailRow label="Subtotal">{formatCurrency(gross - t.fee)}</DetailRow>
                    <div className="flex items-center justify-between pt-1 font-bold">
                      <span className="text-sm text-slate-900">Grand Total</span>
                      <span className="text-xl text-indigo-600">{formatCurrency(t.amount)}</span>
                    </div>
                  </div>
                </Card>
                <Card className="flex flex-col gap-4 p-5">
                  <CardTitle>Customer Profile Summary</CardTitle>
                  {customer.isLoading ? (
                    <div className="flex items-center gap-4">
                      <Skeleton className="size-12 rounded-full" />
                      <Skeleton className="h-8 w-48" />
                    </div>
                  ) : u ? (
                    <Link href={`/users/${u.id}`} className="group flex items-center gap-4">
                      <Avatar src={u.avatar} name={u.name} size={48} />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">{u.name}</span>
                        <span className="truncate text-xs text-slate-500">
                          {u.email} • ID {u.code}
                        </span>
                      </span>
                    </Link>
                  ) : (
                    <ErrorState title="Customer unavailable" error={customer.error} onRetry={() => customer.refetch()} className="py-4" />
                  )}
                </Card>
              </div>
              <Card className="flex w-[400px] shrink-0 flex-col gap-5 p-5">
                <CardTitle>Processing History</CardTitle>
                <ol className="flex flex-col gap-4">
                  {history.map((s) => (
                    <li key={s.title} className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full",
                          s.icon === "x" ? "bg-red-100 text-red-500" : s.tone === "green" ? "bg-emerald-100 text-emerald-500" : "bg-indigo-50 text-indigo-600",
                        )}
                      >
                        {s.icon === "x" ? <X className="size-3.5" /> : <Check className="size-3.5" />}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-[13px] font-semibold text-slate-900">{s.title}</span>
                        <span className="text-xs text-slate-600">{s.description}</span>
                        <span className="text-[11px] text-slate-500">{s.time}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>

            <Card className="flex w-full flex-col gap-3 p-5">
              <CardTitle>Related Customer Ledger Entries</CardTitle>
              {related.isError ? (
                <ErrorState error={related.error} onRetry={() => related.refetch()} />
              ) : (
                <DataTable
                  columns={ledgerColumns}
                  rows={ledger}
                  loading={loadingRelated}
                  skeletonRows={2}
                  lastRowBorder={false}
                  getHref={(r) => `/transactions/${r.id}`}
                  empty={<EmptyState title="No related entries" description="This is the customer's only transaction on record." />}
                />
              )}
            </Card>
          </>
        ))}
      </div>

      {/* Mobile */}
      <div className="flex w-full flex-col lg:hidden print:!hidden">
        <MobileDetailHeader
          title="Transaction Detail"
          backHref="/transactions"
          action={{ label: "Print receipt", icon: <Printer className="size-4" />, onClick: () => window.print() }}
        />
        <div className="flex flex-col gap-4 p-4">
          {state || (t && (
            <>
              <Card className="flex flex-col items-center gap-3 p-5">
                <p className="text-[13px] font-medium text-slate-500">Transaction {t.code}</p>
                <p className="text-[32px] font-extrabold text-slate-900">{formatCurrency(t.amount)}</p>
                <StatusBadge status={t.status} shape="pillLg" />
              </Card>
              <div className="flex gap-3">
                <Button variant="primary" size="block" className="flex-1" disabled={!canRefund} onClick={() => setConfirming(true)}>
                  {t.status === "Refunded" ? "Refunded" : "Refund"}
                </Button>
                <Button variant="neutralOutline" size="block" className="flex-1" onClick={() => window.print()}>
                  Print Receipt
                </Button>
              </div>
              <Card className="flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold text-slate-900">Transaction Details</h2>
                <div className="flex flex-col gap-3">
                  <DetailRow mobile label="Type">{TYPE_LABEL[t.type]}</DetailRow>
                  <DetailRow mobile label="Method">{t.method}</DetailRow>
                  <DetailRow mobile label="Date & Time">{formatDateTime(t.createdAt)}</DetailRow>
                  <DetailRow mobile label="Reference ID">{t.reference.replace("#REF-", "ref_")}</DetailRow>
                  <DetailRow mobile label="Processing Fee" last>{formatCurrency(t.fee)}</DetailRow>
                </div>
              </Card>
              <Card className="flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold text-slate-900">Customer Details</h2>
                {u ? (
                  <div className="flex flex-col gap-3">
                    <DetailRow mobile label="Name" valueClassName="font-semibold">
                      <Link href={`/users/${u.id}`}>{u.name}</Link>
                    </DetailRow>
                    <DetailRow mobile label="Email">{u.email}</DetailRow>
                    <DetailRow mobile label="Phone">{u.phone}</DetailRow>
                    <DetailRow mobile label="Account ID" last>{u.code}</DetailRow>
                  </div>
                ) : customer.isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <ErrorState title="Customer unavailable" error={customer.error} onRetry={() => customer.refetch()} className="py-4" />
                )}
              </Card>
              <Card className="flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold text-slate-900">Status Timeline</h2>
                <Timeline items={history} />
              </Card>
            </>
          ))}
        </div>
      </div>

      {refundDialog}
    </>
  );
}
