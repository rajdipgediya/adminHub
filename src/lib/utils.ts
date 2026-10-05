import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shared CSS class for text/date/time inputs inside dialogs. */
export const DIALOG_INPUT_CLS =
  "w-full rounded-md border border-slate-200 px-2.5 py-2 text-[13px] outline-none focus:border-indigo-600";

/** Deterministic pseudo-random number in [0, 1) for a given seed. */
export function seeded(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function pick<T>(items: readonly T[], seed: number): T {
  return items[Math.floor(seeded(seed) * items.length)];
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    pageCount,
  };
}
