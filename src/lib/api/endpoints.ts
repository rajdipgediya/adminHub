import type { Booking, Transaction, User } from "@/types";
import { apiGet } from "./client";
import {
  mapBooking,
  mapTransaction,
  mapUser,
  type DummyCart,
  type DummyTodo,
  type DummyUser,
} from "./mappers";

const USER_FIELDS = "firstName,lastName,email,phone,gender,role,birthDate,address";
const CART_FIELDS = "userId,discountedTotal,totalQuantity";

export async function fetchUsers(signal?: AbortSignal): Promise<User[]> {
  const data = await apiGet<{ users: DummyUser[] }>(
    `/users?limit=0&select=${USER_FIELDS}`,
    signal,
  );
  return data.users.map(mapUser);
}

export async function fetchUser(id: number, signal?: AbortSignal): Promise<User> {
  return mapUser(await apiGet<DummyUser>(`/users/${id}?select=${USER_FIELDS}`, signal));
}

export async function fetchTransactions(signal?: AbortSignal): Promise<Transaction[]> {
  const data = await apiGet<{ carts: DummyCart[] }>(
    `/carts?limit=0&select=${CART_FIELDS}`,
    signal,
  );
  return data.carts.map(mapTransaction);
}

export async function fetchTransaction(id: number, signal?: AbortSignal): Promise<Transaction> {
  return mapTransaction(await apiGet<DummyCart>(`/carts/${id}`, signal));
}

export async function fetchUserTransactions(
  userId: number,
  signal?: AbortSignal,
): Promise<Transaction[]> {
  const data = await apiGet<{ carts: DummyCart[] }>(`/carts/user/${userId}`, signal);
  return data.carts.map(mapTransaction);
}

export async function fetchBookings(signal?: AbortSignal): Promise<Booking[]> {
  const data = await apiGet<{ todos: DummyTodo[] }>(`/todos?limit=0`, signal);
  return data.todos.map(mapBooking);
}

export async function fetchBooking(id: number, signal?: AbortSignal): Promise<Booking> {
  return mapBooking(await apiGet<DummyTodo>(`/todos/${id}`, signal));
}

export async function fetchUserBookings(userId: number, signal?: AbortSignal): Promise<Booking[]> {
  const data = await apiGet<{ todos: DummyTodo[] }>(`/todos/user/${userId}`, signal);
  return data.todos.map(mapBooking);
}
