"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pen, Pencil } from "lucide-react";
import { useUpdateUser } from "@/hooks/mutations";
import { useUser, useUserBookings, useUserTransactions } from "@/hooks/queries";
import { useNow } from "@/hooks/use-now";
import {
  formatCurrency,
  formatDate,
  formatDateLong,
  formatDatePadded,
  formatRelative,
  formatShortDateTime,
} from "@/lib/format";
import { useAppDispatch } from "@/store";
import { applyUserOverride } from "@/store/selectionSlice";
import { DIALOG_INPUT_CLS } from "@/lib/utils";
import type { Booking, Transaction, User } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Breadcrumbs, DetailRow, DotList, Timeline, type TimelineEntry } from "@/components/ui/detail";
import { DetailState } from "@/components/ui/detail-state";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { MobileDetailHeader } from "@/components/layout/mobile-nav";

function useActivity(user: User | undefined, txns: Transaction[] | undefined, bookings: Booking[] | undefined) {
  const now = useNow();
  return useMemo<TimelineEntry[]>(() => {
    if (!user) return [];
    const items: (TimelineEntry & { at: number })[] = [];
    const b = bookings?.[0];
    const t = txns?.[0];
    const last = new Date(user.lastActiveAt).getTime();
    if (b)
      items.push({
        title: `Created booking ${b.code}`,
        description: `${b.service} session`,
        time: "",
        at: Math.min(now, new Date(b.scheduledAt).getTime() - 3 * 86_400_000),
      });
    items.push({ title: "Changed user password", description: "Initiated self-service reset", time: "", at: last - 26 * 3_600_000 });
    items.push({ title: "Logged in from new device", description: "MacOS Chrome, Brooklyn, NY", time: "", at: last });
    if (t)
      items.push({
        title: `${t.status === "Completed" ? "Completed" : "Initiated"} transaction ${t.code}`,
        description: t.type === "Refund" ? "Refund issued to original method" : "Direct invoice payment received",
        time: "",
        at: new Date(t.createdAt).getTime(),
      });
    items.push({ title: "Updated profile photo", description: "Refreshed corporate portrait", time: "", at: new Date(user.joinedAt).getTime() + 86_400_000 });
    return items
      .sort((a, b) => b.at - a.at)
      .map(({ at, ...rest }) => ({ ...rest, time: formatRelative(new Date(at).toISOString(), now) }));
  }, [user, txns, bookings, now]);
}

const txnColumns: Column<Transaction>[] = [
  { key: "id", header: "ID", width: 90, cell: (t) => <span className="text-[13px] font-semibold text-slate-900">{t.code}</span> },
  {
    key: "amount",
    header: "Amount",
    width: 90,
    cell: (t) => <span className="text-[13px] font-semibold text-slate-900">{formatCurrency(Math.abs(t.amount))}</span>,
  },
  {
    key: "status",
    header: "Status",
    width: 100,
    cell: (t) => <StatusBadge status={t.status === "Completed" ? "Paid" : t.status} />,
  },
  { key: "date", header: "Date", width: 110, cell: (t) => <span className="whitespace-nowrap text-[13px] text-slate-500">{formatDate(t.createdAt)}</span> },
];

const bookingColumns: Column<Booking>[] = [
  { key: "id", header: "ID", width: 90, cell: (b) => <span className="text-[13px] font-semibold text-slate-900">{b.code}</span> },
  { key: "service", header: "Service", width: 140, cell: (b) => <span className="truncate text-[13px] text-slate-900">{b.service}</span> },
  { key: "status", header: "Status", width: 100, cell: (b) => <StatusBadge status={b.status} context="booking" /> },
  {
    key: "date",
    header: "Date & Time",
    width: 110,
    cell: (b) => <span className="whitespace-nowrap text-[13px] text-slate-500">{formatShortDateTime(b.scheduledAt)}</span>,
  },
];

export function UserDetailView({ id }: { id: number }) {
  const user = useUser(id);
  const txns = useUserTransactions(user.data ? id : undefined);
  const bookings = useUserBookings(user.data ? id : undefined);
  const activity = useActivity(user.data, txns.data, bookings.data);
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const u = user.data;

  const toggleSuspend = () =>
    u && dispatch(applyUserOverride({ ids: [u.id], patch: { status: u.status === "Suspended" ? "Active" : "Suspended" } }));

  const state = !u && (
    <DetailState isLoading={user.isLoading} error={user.error} onRetry={() => user.refetch()} entity="User" backHref="/users" />
  );

  const loadingTxns = txns.isPending || !txns.data;
  const loadingBookings = bookings.isPending || !bookings.data;
  const recentTxns = txns.data?.slice(0, 5) ?? [];
  const recentBookings = bookings.data?.slice(0, 5) ?? [];

  return (
    <>
      {/* Desktop */}
      <div className="hidden w-full flex-col gap-6 p-8 lg:flex">
        <Breadcrumbs parent="Users" href="/users" current={u?.name ?? (user.isError ? "Not found" : undefined)} />
        {state || (u && (
          <>
            <Card className="flex items-center justify-between gap-6 p-6">
              <div className="flex min-w-0 items-center gap-5">
                <Avatar src={u.avatar} name={u.name} size={72} priority />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[22px] font-bold text-slate-900">{u.name}</h2>
                    <StatusBadge status={u.status} />
                    {u.twoFactorEnabled && <StatusBadge status="Confirmed" />}
                  </div>
                  <p className="truncate text-sm text-slate-500">
                    {u.email} • Joined {formatDatePadded(u.joinedAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-3">
                <Button variant="ghost" onClick={() => setEditing(true)}>
                  <Pen className="size-3.5" />
                  Edit Profile
                </Button>
                <Button variant="dangerSoft" onClick={toggleSuspend}>
                  {u.status === "Suspended" ? "Reactivate User" : "Suspend User"}
                </Button>
              </div>
            </Card>

            <div className="flex w-full items-start gap-6">
              <div className="flex min-w-0 flex-1 flex-col gap-6">
                <Card className="flex flex-col gap-4 p-5">
                  <CardTitle>Personal Information</CardTitle>
                  <div className="flex flex-col gap-3">
                    <DetailRow label="Full Name">{u.name}</DetailRow>
                    <DetailRow label="Email Address">{u.email}</DetailRow>
                    <DetailRow label="Phone Number">{u.phone}</DetailRow>
                    <DetailRow label="Date of Birth">{formatDateLong(u.birthDate)}</DetailRow>
                    <DetailRow label="Mailing Address" last>{u.address}</DetailRow>
                  </div>
                </Card>
                <Card className="flex flex-col gap-4 p-5">
                  <CardTitle>Account Information</CardTitle>
                  <div className="flex flex-col gap-3">
                    <DetailRow label="User ID">{u.code}</DetailRow>
                    <DetailRow label="Joined Date">{formatDateLong(u.joinedAt)}</DetailRow>
                    <DetailRow label="Last Login Activity">{formatRelative(u.lastActiveAt)}</DetailRow>
                    <DetailRow label="Two-Factor Security" last>
                      <Badge tone={u.twoFactorEnabled ? "success" : "warning"} shape="tag" className="font-bold">
                        {u.twoFactorEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </DetailRow>
                  </div>
                </Card>
              </div>
              <Card className="flex w-[400px] shrink-0 flex-col gap-4 p-5">
                <CardTitle>Recent Activity Log</CardTitle>
                <DotList items={activity} />
              </Card>
            </div>

            <div className="flex w-full items-start gap-6">
              <Card className="flex min-w-0 flex-1 flex-col gap-3 p-5">
                <CardTitle>{u.firstName}&apos;s Recent Transactions</CardTitle>
                {txns.isError ? (
                  <ErrorState error={txns.error} onRetry={() => txns.refetch()} />
                ) : (
                  <DataTable
                    columns={txnColumns}
                    rows={recentTxns}
                    loading={loadingTxns}
                    skeletonRows={2}
                    lastRowBorder={false}
                    getHref={(t) => `/transactions/${t.id}`}
                    empty={<EmptyState title="No transactions" description={`${u.firstName} hasn't made any payments yet.`} />}
                  />
                )}
              </Card>
              <Card className="flex min-w-0 flex-1 flex-col gap-3 p-5">
                <CardTitle>{u.firstName}&apos;s Recent Bookings</CardTitle>
                {bookings.isError ? (
                  <ErrorState error={bookings.error} onRetry={() => bookings.refetch()} />
                ) : (
                  <DataTable
                    columns={bookingColumns}
                    rows={recentBookings}
                    loading={loadingBookings}
                    skeletonRows={2}
                    lastRowBorder={false}
                    getHref={(b) => `/bookings/${b.id}`}
                    empty={<EmptyState title="No bookings" description={`${u.firstName} hasn't booked a session yet.`} />}
                  />
                )}
              </Card>
            </div>
          </>
        ))}
      </div>

      {/* Mobile */}
      <div className="flex w-full flex-col lg:hidden">
        <MobileDetailHeader
          title="User Detail"
          backHref="/users"
          action={{ label: "Edit profile", icon: <Pencil className="size-4" />, onClick: () => setEditing(true) }}
        />
        <div className="flex flex-col gap-4 p-4">
          {state || (u && (
            <>
              <Card className="flex flex-col items-center gap-3 p-5">
                <Avatar src={u.avatar} name={u.name} size={72} priority />
                <div className="flex flex-col items-center gap-1 text-center">
                  <h1 className="text-lg font-bold text-slate-900">{u.name}</h1>
                  <p className="text-[13px] text-slate-500">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <Badge tone="primary" shape="pillLg">{u.role}</Badge>
                  <StatusBadge status={u.status} shape="pillLg" />
                </div>
              </Card>
              <div className="flex gap-3">
                <Button variant="primary" size="block" className="flex-1" onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
                <Button variant="dangerOutline" size="block" className="flex-1" onClick={toggleSuspend}>
                  {u.status === "Suspended" ? "Reactivate" : "Suspend User"}
                </Button>
              </div>
              <Card className="flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
                <div className="flex flex-col gap-3">
                  <DetailRow mobile label="Full Name">{u.name}</DetailRow>
                  <DetailRow mobile label="Email">{u.email}</DetailRow>
                  <DetailRow mobile label="Phone">{u.phone}</DetailRow>
                  <DetailRow mobile label="Date of Birth">{formatDateLong(u.birthDate)}</DetailRow>
                  <DetailRow mobile label="Address" last>{u.address}</DetailRow>
                </div>
              </Card>
              <Card className="flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold text-slate-900">Account Details</h2>
                <div className="flex flex-col gap-3">
                  <DetailRow mobile label="User ID" valueClassName="font-semibold">{u.code}</DetailRow>
                  <DetailRow mobile label="Joined Date">{formatDate(u.joinedAt)}</DetailRow>
                  <DetailRow mobile label="Last Login">{formatRelative(u.lastActiveAt)}</DetailRow>
                  <DetailRow mobile label="Role">{u.role === "Admin" ? "Super Admin" : u.role}</DetailRow>
                  <DetailRow
                    mobile
                    last
                    label="2FA Status"
                    valueClassName={u.twoFactorEnabled ? "font-semibold text-emerald-800" : "font-semibold text-amber-800"}
                  >
                    {u.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </DetailRow>
                </div>
              </Card>
              <Card className="flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
                <Timeline items={activity.slice(0, 3)} />
              </Card>
              <Card className="flex flex-col gap-3 p-4">
                <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
                {txns.isError ? (
                  <ErrorState error={txns.error} onRetry={() => txns.refetch()} />
                ) : loadingTxns ? (
                  <p className="text-xs text-slate-400">Loading…</p>
                ) : recentTxns.length === 0 ? (
                  <p className="text-[13px] text-slate-500">No transactions yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {recentTxns.map((t, i) => (
                      <Link
                        key={t.id}
                        href={`/transactions/${t.id}`}
                        className={`flex items-center justify-between ${i < recentTxns.length - 1 ? "border-b border-slate-200 pb-2" : "pb-1"}`}
                      >
                        <span className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-semibold text-slate-900">{t.code}</span>
                          <span className="text-[11px] text-slate-500">{formatDate(t.createdAt)}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-slate-900">{formatCurrency(Math.abs(t.amount))}</span>
                          <StatusBadge status={t.status === "Completed" ? "Success" : t.status} shape="pillLg" />
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            </>
          ))}
        </div>
      </div>

      {/* Mounted only while open so the form always starts from current data. */}
      {u && editing && <EditUserDialog user={u} open onClose={() => setEditing(false)} />}
    </>
  );
}

function EditUserDialog({ user, open, onClose }: { user: User; open: boolean; onClose: () => void }) {
  const updateUser = useUpdateUser();
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone });
  const isDirty =
    form.firstName !== user.firstName || form.lastName !== user.lastName || form.email !== user.email || form.phone !== user.phone;
  const isValid = form.firstName.trim() && form.lastName.trim() && /\S+@\S+\.\S+/.test(form.email);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit Profile"
      description={`Update ${user.firstName}'s contact details.`}
      footer={
        <>
          <Button size="sm" onClick={onClose} disabled={updateUser.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={!isDirty || !isValid || updateUser.isPending}
            onClick={() => updateUser.mutate({ id: user.id, patch: form }, { onSuccess: onClose })}
          >
            {updateUser.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["firstName", "First name", "col-span-1"],
            ["lastName", "Last name", "col-span-1"],
            ["email", "Email", "col-span-2"],
            ["phone", "Phone", "col-span-2"],
          ] as const
        ).map(([key, label, span]) => (
          <label key={key} className={`flex flex-col gap-1 ${span}`}>
            <span className="text-xs font-medium text-slate-600">{label}</span>
            <input className={DIALOG_INPUT_CLS} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </label>
        ))}
        {updateUser.isError && <p className="col-span-2 text-xs text-red-500">{updateUser.error.message}</p>}
      </div>
    </Dialog>
  );
}
