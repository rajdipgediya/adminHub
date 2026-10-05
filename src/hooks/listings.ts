"use client";

import { useMemo } from "react";
import { paginate } from "@/lib/utils";
import { useAppSelector } from "@/store";
import type { DateRange } from "@/store/filtersSlice";
import type { Booking, Transaction, User } from "@/types";
import { useBookings, useTransactions, useUserMap, useUsers } from "./queries";

export const PAGE_SIZE = 8;

const RANGE_DAYS: Record<Exclude<DateRange, "all">, number> = { "7d": 7, "30d": 30, "90d": 90 };

function inRange(iso: string, range: DateRange) {
  if (range === "all") return true;
  return Math.abs(Date.now() - new Date(iso).getTime()) <= RANGE_DAYS[range] * 86_400_000;
}

export function useUserList() {
  const query = useUsers();
  const f = useAppSelector((s) => s.filters.users);

  const result = useMemo(() => {
    const q = f.search.trim().toLowerCase();
    const filtered = (query.data ?? []).filter(
      (u) =>
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
        (f.role === "All" || u.role === f.role) &&
        (f.status === "All" || u.status === f.status),
    );
    const sorted = [...filtered].sort((a, b) => {
      if (f.sort === "name") return a.name.localeCompare(b.name);
      if (f.sort === "lastActive") return b.lastActiveAt.localeCompare(a.lastActiveAt);
      return b.joinedAt.localeCompare(a.joinedAt);
    });
    return paginate(sorted, f.page, PAGE_SIZE);
  }, [query.data, f]);

  return { ...query, result };
}

export interface TransactionRow extends Transaction {
  user?: User;
}

export function useTransactionRows() {
  const query = useTransactions();
  const users = useUserMap();
  const rows = useMemo<TransactionRow[]>(
    () => (query.data ?? []).map((t) => ({ ...t, user: users.map.get(t.userId) })),
    [query.data, users.map],
  );
  return { ...query, rows };
}

export function useTransactionList() {
  const { rows, ...query } = useTransactionRows();
  const f = useAppSelector((s) => s.filters.transactions);

  const result = useMemo(() => {
    const q = f.search.trim().toLowerCase();
    const filtered = rows.filter((t) => {
      const abs = Math.abs(t.amount);
      return (
        (!q ||
          t.code.toLowerCase().includes(q) ||
          t.user?.name.toLowerCase().includes(q)) &&
        inRange(t.createdAt, f.dateRange) &&
        (f.type === "All" || t.type === f.type) &&
        (f.amount === "all" ||
          (f.amount === "lt100" && abs < 100) ||
          (f.amount === "100to1000" && abs >= 100 && abs <= 1000) ||
          (f.amount === "gt1000" && abs > 1000))
      );
    });
    return paginate(filtered, f.page, PAGE_SIZE);
  }, [rows, f]);

  return { ...query, rows, result };
}

export interface BookingRow extends Booking {
  user?: User;
}

export function useBookingList() {
  const query = useBookings();
  const users = useUserMap();
  const f = useAppSelector((s) => s.filters.bookings);

  const rows = useMemo<BookingRow[]>(
    () => (query.data ?? []).map((b) => ({ ...b, user: users.map.get(b.userId) })),
    [query.data, users.map],
  );

  const result = useMemo(() => {
    const q = f.search.trim().toLowerCase();
    const filtered = rows.filter(
      (b) =>
        (!q || b.code.toLowerCase().includes(q) || b.user?.name.toLowerCase().includes(q)) &&
        inRange(b.scheduledAt, f.dateRange) &&
        (f.status === "All" || b.status === f.status) &&
        (f.service === "All" || b.service === f.service),
    );
    return paginate(filtered, f.page, PAGE_SIZE);
  }, [rows, f]);

  return { ...query, rows, result };
}
