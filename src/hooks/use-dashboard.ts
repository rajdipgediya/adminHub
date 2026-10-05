"use client";

import { useMemo } from "react";
import type { RevenueRange } from "@/store/uiSlice";
import { useNow } from "./use-now";
import type { Booking, Transaction, User } from "@/types";

const DAY = 86_400_000;

function trend(dates: number[], now: number) {
  const cur = dates.filter((d) => d <= now && d > now - 30 * DAY).length;
  const prev = dates.filter((d) => d <= now - 30 * DAY && d > now - 60 * DAY).length;
  return ((cur - prev) / Math.max(prev, 1)) * 100;
}

// Income only — refunds are tracked separately so they do not zero out a period.
const isRevenue = (t: Transaction) => t.status === "Completed" && t.type !== "Refund";

export function useDashboardStats(
  users: User[] | undefined,
  transactions: Transaction[] | undefined,
  bookings: Booking[] | undefined,
) {
  const now = useNow();
  return useMemo(() => {
    const txns = transactions ?? [];
    const revenueTx = txns.filter(isRevenue);
    const pending = txns.filter((t) => t.status === "Pending");
    const active = (bookings ?? []).filter((b) => b.status === "Confirmed" || b.status === "Pending");

    const sumIn = (from: number, to: number) =>
      revenueTx
        .filter((t) => {
          const d = new Date(t.createdAt).getTime();
          return d > from && d <= to;
        })
        .reduce((s, t) => s + t.amount, 0);
    const revCur = sumIn(now - 30 * DAY, now);
    const revPrev = sumIn(now - 60 * DAY, now - 30 * DAY);

    return {
      totalUsers: users?.length ?? 0,
      usersTrend: trend((users ?? []).map((u) => new Date(u.joinedAt).getTime()), now),
      totalRevenue: revenueTx.reduce((s, t) => s + t.amount, 0),
      revenueTrend: ((revCur - revPrev) / Math.max(Math.abs(revPrev), 1)) * 100,
      activeBookings: active.length,
      bookingsTrend: trend(active.map((b) => new Date(b.scheduledAt).getTime()), now + 30 * DAY),
      pendingTransactions: pending.length,
      pendingTrend: trend(pending.map((t) => new Date(t.createdAt).getTime()), now),
    };
  }, [users, transactions, bookings, now]);
}

export interface RevenuePoint {
  label: string;
  value: number;
}

const RANGE_CONFIG: Record<RevenueRange, { buckets: number; days: number }> = {
  "7D": { buckets: 7, days: 1 },
  "1M": { buckets: 6, days: 5 },
  "3M": { buckets: 6, days: 15 },
  "6M": { buckets: 6, days: 0 },
  "1Y": { buckets: 12, days: 0 },
};

const monthLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });
const monthYear = (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
const dayLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Buckets completed revenue for the selected chart range. */
export function useRevenueSeries(transactions: Transaction[] | undefined, range: RevenueRange) {
  return useMemo(() => {
    const txns = (transactions ?? []).filter(isRevenue);
    const now = new Date();
    const { buckets, days } = RANGE_CONFIG[range];
    const points: RevenuePoint[] = [];
    let start: Date;

    if (days === 0) {
      // Calendar months, oldest first.
      start = new Date(now.getFullYear(), now.getMonth() - (buckets - 1), 1);
      for (let i = 0; i < buckets; i++) {
        const from = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const to = new Date(start.getFullYear(), start.getMonth() + i + 1, 1);
        points.push({
          label: monthLabel(from),
          value: Math.max(0, sum(txns, from.getTime(), to.getTime())),
        });
      }
    } else {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      start = new Date(end.getTime() - buckets * days * DAY + 1);
      for (let i = 0; i < buckets; i++) {
        const from = new Date(start.getTime() + i * days * DAY);
        const to = new Date(from.getTime() + days * DAY);
        points.push({
          label: days === 1 ? from.toLocaleDateString("en-US", { weekday: "short" }) : dayLabel(from),
          value: Math.max(0, sum(txns, from.getTime(), to.getTime())),
        });
      }
    }

    const subtitle =
      days === 0 ? `${monthYear(start)} – ${monthYear(now)}` : `${dayLabel(start)} – ${dayLabel(now)}, ${now.getFullYear()}`;
    return { points, subtitle };
  }, [transactions, range]);
}

function sum(txns: Transaction[], from: number, to: number) {
  return txns.reduce((s, t) => {
    const d = new Date(t.createdAt).getTime();
    return d >= from && d < to ? s + t.amount : s;
  }, 0);
}
