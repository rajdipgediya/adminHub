"use client";

import { useCallback, useMemo } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBooking,
  fetchBookings,
  fetchTransaction,
  fetchTransactions,
  fetchUser,
  fetchUserBookings,
  fetchUsers,
  fetchUserTransactions,
} from "@/lib/api/endpoints";
import { useAppSelector } from "@/store";
import type { Booking, Transaction, User } from "@/types";

export const queryKeys = {
  users: ["users"] as const,
  user: (id: number) => ["users", id] as const,
  transactions: ["transactions"] as const,
  transaction: (id: number) => ["transactions", id] as const,
  userTransactions: (userId: number) => ["transactions", "byUser", userId] as const,
  bookings: ["bookings"] as const,
  booking: (id: number) => ["bookings", id] as const,
  userBookings: (userId: number) => ["bookings", "byUser", userId] as const,
};

/** Applies bulk-action overrides (role / status changes) kept in Redux. */
function useWithOverrides() {
  const overrides = useAppSelector((s) => s.selection.userOverrides);
  return useCallback((user: User): User => ({ ...user, ...overrides[user.id] }), [overrides]);
}

export function useUsers() {
  const withOverrides = useWithOverrides();
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: ({ signal }) => fetchUsers(signal),
    select: useCallback((users: User[]) => users.map(withOverrides), [withOverrides]),
  });
}

export function useUser(id: number) {
  const qc = useQueryClient();
  const withOverrides = useWithOverrides();
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: ({ signal }) => fetchUser(id, signal),
    enabled: Number.isFinite(id),
    // Seed from the list cache so navigating from a table renders instantly.
    initialData: () => qc.getQueryData<User[]>(queryKeys.users)?.find((u) => u.id === id),
    select: withOverrides,
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: queryKeys.transactions,
    queryFn: ({ signal }) => fetchTransactions(signal),
  });
}

export function useTransaction(id: number) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: ({ signal }) => fetchTransaction(id, signal),
    enabled: Number.isFinite(id),
    initialData: () =>
      qc.getQueryData<Transaction[]>(queryKeys.transactions)?.find((t) => t.id === id),
  });
}

export function useUserTransactions(userId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.userTransactions(userId ?? -1),
    queryFn: ({ signal }) => fetchUserTransactions(userId!, signal),
    enabled: userId !== undefined,
  });
}

export function useBookings() {
  return useQuery({
    queryKey: queryKeys.bookings,
    queryFn: ({ signal }) => fetchBookings(signal),
  });
}

export function useBooking(id: number) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: queryKeys.booking(id),
    queryFn: ({ signal }) => fetchBooking(id, signal),
    enabled: Number.isFinite(id),
    initialData: () => qc.getQueryData<Booking[]>(queryKeys.bookings)?.find((b) => b.id === id),
  });
}

export function useUserBookings(userId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.userBookings(userId ?? -1),
    queryFn: ({ signal }) => fetchUserBookings(userId!, signal),
    enabled: userId !== undefined,
  });
}

/** Lookup table used to join transactions / bookings to their customer. */
export function useUserMap() {
  const users = useUsers();
  const map = useMemo(() => new Map(users.data?.map((u) => [u.id, u])), [users.data]);
  return { ...users, map };
}
