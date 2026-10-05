"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Calendar, Check, Ellipsis } from "lucide-react";
import { usePatchBooking } from "@/hooks/mutations";
import { useBooking, useUser, useUserBookings } from "@/hooks/queries";
import { useNow } from "@/hooks/use-now";
import { formatCurrency, formatDate, formatDateLong, formatShortDateTime, formatTime } from "@/lib/format";
import { DIALOG_INPUT_CLS } from "@/lib/utils";
import type { Booking } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Breadcrumbs, DetailRow, Timeline, type TimelineEntry } from "@/components/ui/detail";
import { DetailState } from "@/components/ui/detail-state";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileDetailHeader } from "@/components/layout/mobile-nav";

function paymentStatus(b: Booking) {
  if (b.status === "Cancelled") return { label: "Refunded", tone: "neutral" as const };
  if (b.status === "Pending") return { label: "Awaiting", tone: "warning" as const };
  return { label: "Paid", tone: "success" as const };
}

function timeSlot(b: Booking) {
  const start = new Date(b.scheduledAt);
  const end = new Date(start.getTime() + b.durationHours * 3_600_000);
  return `${formatTime(start.toISOString())} - ${formatTime(end.toISOString())}`;
}

function useLifecycle(b: Booking | undefined) {
  return useMemo<TimelineEntry[]>(() => {
    if (!b) return [];
    const created = new Date(b.scheduledAt).getTime() - 3 * 86_400_000;
    const at = (min: number) => formatShortDateTime(new Date(created + min * 60_000).toISOString());
    const log: TimelineEntry[] = [
      { title: "Booking Created", description: "Client self-service reservation", time: at(0), tone: "green" },
    ];
    if (b.status !== "Pending")
      log.unshift({ title: "Status Set to Confirmed", description: "Consultant assigned automatically", time: at(2), tone: "green" });
    if (b.status === "Confirmed" || b.status === "Completed")
      log.unshift({ title: "Confirmation Sent", description: "Calendar invite dispatched", time: at(32), tone: "green" });
    if (b.status === "Completed")
      log.unshift({ title: "Session Completed", description: "Marked complete by consultant", time: formatShortDateTime(b.scheduledAt), tone: "green" });
    if (b.status === "Cancelled")
      log.unshift({ title: "Booking Cancelled", description: "Refund issued to original method", time: at(60) });
    return log;
  }, [b]);
}

export function BookingDetailView({ id }: { id: number }) {
  const booking = useBooking(id);
  const b = booking.data;
  const customer = useUser(b?.userId ?? Number.NaN);
  const history = useUserBookings(b?.userId);
  const lifecycle = useLifecycle(b);
  const patch = usePatchBooking();
  const [cancelling, setCancelling] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const u = customer.data;
  const completedCount = history.data?.filter((h) => h.status === "Completed").length ?? 0;
  const locked = b?.status === "Cancelled" || b?.status === "Completed";
  const pay = b && paymentStatus(b);

  const state = !b && (
    <DetailState isLoading={booking.isLoading} error={booking.error} onRetry={() => booking.refetch()} entity="Booking" backHref="/bookings" />
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden w-full flex-col gap-6 p-8 lg:flex">
        <Breadcrumbs parent="Bookings" href="/bookings" current={b?.code ?? (booking.isError ? "Not found" : undefined)} />
        {state || (b && pay && (
          <>
            <Card className="flex items-center justify-between gap-6 p-6">
              <div className="flex min-w-0 items-center gap-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                  <Calendar className="size-6 text-indigo-600" />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[22px] font-bold text-slate-900">Booking {b.code}</h2>
                    <StatusBadge status={b.status} context="booking" />
                    <Badge tone={pay.tone === "success" ? "info" : pay.tone}>{pay.label}</Badge>
                  </div>
                  <p className="truncate text-sm text-slate-500">
                    {b.location.startsWith("Virtual") ? "Virtual Consultation Room" : "HQ Meeting Room 4B"} • Scheduled for{" "}
                    {formatDate(b.scheduledAt)} at {formatShortDateTime(b.scheduledAt).split(", ")[1]}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-3">
                <Button variant="ghost" disabled={locked} onClick={() => setRescheduling(true)}>
                  <Calendar className="size-3.5" />
                  Reschedule
                </Button>
                <Button variant="dangerSoft" disabled={locked} onClick={() => setCancelling(true)}>
                  {b.status === "Cancelled" ? "Cancelled" : "Cancel Booking"}
                </Button>
              </div>
            </Card>

            <div className="flex w-full items-start gap-6">
              <div className="flex min-w-0 flex-1 flex-col gap-6">
                <Card className="flex flex-col gap-4 p-5">
                  <CardTitle>Booking Meeting Logistics</CardTitle>
                  <div className="flex flex-col gap-3">
                    <DetailRow label="Service Type">{b.service}</DetailRow>
                    <DetailRow label="Scheduled Date">{formatDateLong(b.scheduledAt)}</DetailRow>
                    <DetailRow label="Meeting Time Slot">{timeSlot(b)}</DetailRow>
                    <DetailRow
                      label="Meeting Location"
                      valueClassName={b.location.startsWith("Virtual") ? "text-indigo-600" : undefined}
                    >
                      {b.location}
                    </DetailRow>
                    <div className="flex flex-col gap-1 pt-1 text-[13px]">
                      <span className="text-slate-500">Client Special Notes</span>
                      <p className="leading-[18px] text-slate-600">{b.notes}</p>
                    </div>
                  </div>
                </Card>
                <Card className="flex flex-col gap-4 p-5">
                  <CardTitle>Customer Overview</CardTitle>
                  {u ? (
                    <div className="flex items-center justify-between gap-4">
                      <Link href={`/users/${u.id}`} className="group flex min-w-0 items-center gap-3">
                        <Avatar src={u.avatar} name={u.name} size={40} />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-[13px] font-semibold text-slate-900 group-hover:text-indigo-600">{u.name}</span>
                          <span className="truncate text-[11px] text-slate-500">{u.email}</span>
                        </span>
                      </Link>
                      <span className="shrink-0 text-xs text-slate-600">
                        {history.isLoading ? "…" : `${completedCount} Total Bookings Completed`}
                      </span>
                    </div>
                  ) : (
                    <Skeleton className="h-10 w-full" />
                  )}
                </Card>
              </div>
              <div className="flex w-[400px] shrink-0 flex-col gap-6">
                <Card className="flex flex-col gap-4 p-5">
                  <CardTitle>Payment Ledger Breakdown</CardTitle>
                  <div className="flex flex-col gap-3">
                    <DetailRow last label="Billing Amount">{formatCurrency(b.amount)}</DetailRow>
                    <DetailRow last label="Payment Status">
                      <Badge tone={pay.tone}>{pay.label}</Badge>
                    </DetailRow>
                    <DetailRow last label="Invoice Link" valueClassName="text-indigo-600">
                      {b.invoice}
                    </DetailRow>
                  </div>
                </Card>
                <Card className="flex flex-col gap-4 p-5">
                  <CardTitle>Booking Lifecycle Logs</CardTitle>
                  <ol className="flex flex-col gap-4">
                    {lifecycle.map((s) => (
                      <li key={s.title} className="flex items-start gap-3">
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                            s.tone === "green" ? "bg-emerald-100 text-emerald-500" : "bg-red-100 text-red-500"
                          }`}
                        >
                          <Check className="size-3" />
                        </span>
                        <span className="flex min-w-0 flex-col gap-px">
                          <span className="text-xs font-semibold text-slate-900">{s.title}</span>
                          <span className="text-[11px] text-slate-600">{s.description}</span>
                          <span className="text-[10px] text-slate-500">{s.time}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </Card>
              </div>
            </div>
          </>
        ))}
      </div>

      {/* Mobile */}
      <div className="flex w-full flex-col lg:hidden">
        <MobileDetailHeader
          title="Booking Detail"
          backHref="/bookings"
          action={{
            label: "Reschedule",
            icon: <Ellipsis className="size-4" />,
            onClick: () => !locked && setRescheduling(true),
          }}
        />
        <div className="flex flex-col gap-4 p-4">
          {state || (b && pay && (
            <>
              <Card className="flex flex-col items-center gap-3 p-5 text-center">
                <p className="text-[13px] font-medium text-slate-500">Booking {b.code}</p>
                <h1 className="text-xl font-bold text-slate-900">{b.service}</h1>
                <div className="flex gap-2">
                  <StatusBadge status={b.status} shape="pillLg" />
                  <Badge tone="primary" shape="pillLg">
                    {b.amount >= 180 ? "Premium" : "Standard"}
                  </Badge>
                </div>
              </Card>
              <div className="flex gap-3">
                <Button variant="primary" size="block" className="flex-1" disabled={locked} onClick={() => setRescheduling(true)}>
                  Reschedule
                </Button>
                <Button variant="dangerOutline" size="block" className="flex-1" disabled={locked} onClick={() => setCancelling(true)}>
                  Cancel Booking
                </Button>
              </div>
              <Card className="flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold text-slate-900">Booking Details</h2>
                <div className="flex flex-col gap-3">
                  <DetailRow mobile label="Service">{b.service}</DetailRow>
                  <DetailRow mobile label="Date" valueClassName="font-semibold">{formatDate(b.scheduledAt)}</DetailRow>
                  <DetailRow mobile label="Time">{timeSlot(b)}</DetailRow>
                  <DetailRow mobile label="Duration">
                    {b.durationHours} hour{b.durationHours === 1 ? "" : "s"}
                  </DetailRow>
                  <DetailRow mobile label="Location">{b.location}</DetailRow>
                  <div className="flex items-start justify-between gap-4 text-[13px] font-medium">
                    <span className="shrink-0 text-slate-500">Customer Notes</span>
                    <span className="text-right text-slate-900">{b.notes.replace(/"/g, "")}</span>
                  </div>
                </div>
              </Card>
              <Card className="flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold text-slate-900">Customer Profile</h2>
                {u ? (
                  <div className="flex flex-col gap-3">
                    <DetailRow mobile label="Name" valueClassName="font-semibold">
                      <Link href={`/users/${u.id}`}>{u.name}</Link>
                    </DetailRow>
                    <DetailRow mobile label="Email">{u.email}</DetailRow>
                    <DetailRow mobile label="Phone">{u.phone}</DetailRow>
                    <DetailRow mobile last label="Previous Bookings" valueClassName="font-semibold text-indigo-600">
                      {completedCount} bookings completed
                    </DetailRow>
                  </div>
                ) : (
                  <Skeleton className="h-24 w-full" />
                )}
              </Card>
              <Card className="flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold text-slate-900">Payment Information</h2>
                <div className="flex flex-col gap-3">
                  <DetailRow mobile label="Amount" valueClassName="font-semibold">{formatCurrency(b.amount)}</DetailRow>
                  <DetailRow
                    mobile
                    label="Payment Status"
                    valueClassName={pay.tone === "success" ? "font-semibold text-emerald-800" : "font-semibold text-amber-800"}
                  >
                    {pay.label}
                  </DetailRow>
                  <DetailRow mobile label="Method">Invoiced (Credit Card)</DetailRow>
                  <DetailRow mobile last label="Invoice" valueClassName="text-indigo-600">{b.invoice}</DetailRow>
                </div>
              </Card>
              <Card className="flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold text-slate-900">Booking Log</h2>
                <Timeline items={lifecycle.map((l, i) => ({ ...l, tone: i % 2 === 1 ? "green" : "indigo" }))} />
              </Card>
            </>
          ))}
        </div>
      </div>

      {b && (
        <ConfirmDialog
          open={cancelling}
          onClose={() => setCancelling(false)}
          title={`Cancel ${b.code}?`}
          description={`The ${b.service} session will be cancelled and ${formatCurrency(b.amount)} refunded.`}
          confirmLabel="Cancel Booking"
          pending={patch.isPending}
          error={patch.error?.message}
          onConfirm={() => patch.mutate({ id: b.id, patch: { status: "Cancelled" } }, { onSuccess: () => setCancelling(false) })}
        />
      )}
      {b && rescheduling && <RescheduleDialog booking={b} onClose={() => setRescheduling(false)} />}
    </>
  );
}

function RescheduleDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const patch = usePatchBooking();
  const now = useNow();
  const current = new Date(booking.scheduledAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const [date, setDate] = useState(`${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`);
  const [time, setTime] = useState(`${pad(current.getHours())}:${pad(current.getMinutes())}`);
  const next = new Date(`${date}T${time}`);
  const isValidSchedule = !Number.isNaN(next.getTime()) && next.getTime() > now;

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Reschedule ${booking.code}`}
      description="Pick a new date and time. The customer will receive an updated invite."
      footer={
        <>
          <Button size="sm" onClick={onClose} disabled={patch.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={!isValidSchedule || patch.isPending}
            onClick={() =>
              patch.mutate(
                { id: booking.id, patch: { scheduledAt: next.toISOString(), status: "Confirmed" } },
                { onSuccess: onClose },
              )
            }
          >
            {patch.isPending ? "Saving…" : "Reschedule"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Date</span>
          <input type="date" className={DIALOG_INPUT_CLS} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Time</span>
          <input type="time" className={DIALOG_INPUT_CLS} value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        {!isValidSchedule && <p className="col-span-2 text-[11px] text-red-500">Choose a time in the future.</p>}
        {patch.isError && <p className="col-span-2 text-xs text-red-500">{patch.error.message}</p>}
      </div>
    </Dialog>
  );
}
