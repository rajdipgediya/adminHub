"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_BASE_URL, ApiError } from "@/lib/api/client";
import { avatarFor, mapBooking, mapUser, type DummyTodo, type DummyUser } from "@/lib/api/mappers";
import type { Booking, Transaction, User, UserRole } from "@/types";
import { queryKeys } from "./queries";

const ROLE_TO_DUMMY: Record<UserRole, DummyUser["role"]> = {
  Admin: "admin",
  Editor: "moderator",
  Viewer: "user",
};

async function send<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(`Request failed with status ${res.status}.`, res.status);
  return res.json() as Promise<T>;
}

export interface NewUserInput {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  gender: "male" | "female";
}

/**
 * DummyJSON simulates writes (it echoes the record back without persisting),
 * so the cached list is updated with the response to reflect the change.
 */
export function useAddUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewUserInput) => {
      const created = await send<DummyUser>("/users/add", "POST", {
        ...input,
        role: ROLE_TO_DUMMY[input.role],
      });
      const existing = qc.getQueryData<User[]>(queryKeys.users) ?? [];
      // DummyJSON always returns id 209 — keep ids unique locally.
      const id = Math.max(created.id, ...existing.map((u) => u.id)) + (existing.some((u) => u.id === created.id) ? 1 : 0);
      return {
        ...mapUser({
          ...created,
          id,
          phone: "—",
          birthDate: new Date().toISOString(),
          address: { address: "—", city: "—", stateCode: "" },
        }),
        status: "Active" as const,
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        avatar: avatarFor(id, input.gender),
      };
    },
    onSuccess: (user) => {
      qc.setQueryData<User[]>(queryKeys.users, (prev) => [user, ...(prev ?? [])]);
      qc.setQueryData(queryKeys.user(user.id), user);
      toast.success("User created successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create user"),
  });
}

/** Patches one record in both its list cache and detail cache. */
function patchCaches<T extends { id: number }>(
  qc: ReturnType<typeof useQueryClient>,
  listKey: readonly unknown[],
  detailKey: readonly unknown[],
  id: number,
  patch: Partial<T>,
) {
  qc.setQueryData<T[]>(listKey, (prev) => prev?.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  qc.setQueryData<T>(detailKey, (prev) => (prev ? { ...prev, ...patch } : prev));
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<Pick<User, "firstName" | "lastName" | "email" | "phone">> }) => {
      if (id <= 208) await send(`/users/${id}`, "PUT", patch);
      return { id, patch };
    },
    onSuccess: ({ id, patch }) => {
      const full = { ...patch } as Partial<User>;
      const current = qc.getQueryData<User>(queryKeys.user(id));
      if (current) full.name = `${patch.firstName ?? current.firstName} ${patch.lastName ?? current.lastName}`;
      patchCaches<User>(qc, queryKeys.users, queryKeys.user(id), id, full);
      toast.success("User profile updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update user"),
  });
}

export function usePatchTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<Transaction> }) => {
      await send(`/carts/${id}`, "PUT", { merge: true, products: [] });
      return { id, patch };
    },
    onSuccess: ({ id, patch }) => {
      patchCaches<Transaction>(qc, queryKeys.transactions, queryKeys.transaction(id), id, patch);
      toast.success("Transaction updated successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update transaction"),
  });
}

export function usePatchBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<Booking> }) => {
      if (id <= 254) await send(`/todos/${id}`, "PUT", { completed: patch.status === "Completed" });
      return { id, patch };
    },
    onSuccess: ({ id, patch }) => {
      patchCaches<Booking>(qc, queryKeys.bookings, queryKeys.booking(id), id, patch);
      toast.success("Booking status updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update booking"),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      // Users created locally don't exist on the server; skip the request.
      if (id <= 208) await send(`/users/${id}`, "DELETE");
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData<User[]>(queryKeys.users, (prev) => prev?.filter((u) => u.id !== id));
      qc.removeQueries({ queryKey: queryKeys.user(id) });
      toast.success("User deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete user"),
  });
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export interface NewBookingInput {
  userId: number;
  service: string;
  date: string;
  time: string;
}

/**
 * Creates a new booking via the DummyJSON todos endpoint and
 * optimistically prepends the result to the local bookings cache.
 */
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewBookingInput): Promise<Booking> => {
      const res = await fetch(`${API_BASE_URL}/todos/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todo: `${input.service} session`, completed: false, userId: input.userId }),
      });
      if (!res.ok) throw new ApiError(`Request failed with status ${res.status}.`, res.status);
      const todo = (await res.json()) as DummyTodo;
      const existing = qc.getQueryData<Booking[]>(queryKeys.bookings) ?? [];
      const id = Math.max(todo.id, ...existing.map((b) => b.id)) + 1;
      return {
        ...mapBooking({ ...todo, id }),
        service: input.service,
        status: "Pending" as const,
        scheduledAt: new Date(`${input.date}T${input.time}`).toISOString(),
        notes: '"Booked from the admin console."',
      };
    },
    onSuccess: (booking) => {
      qc.setQueryData<Booking[]>(queryKeys.bookings, (prev) => [booking, ...(prev ?? [])]);
      qc.setQueryData(queryKeys.booking(booking.id), booking);
      toast.success("Booking created successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create booking"),
  });
}
