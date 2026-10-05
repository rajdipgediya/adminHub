const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("en-US");

/** `$1,200.00`, refunds as `-$420.00`. */
export function formatCurrency(value: number) {
  return currency.format(value);
}

/** `$284,392` — whole dollars for KPI cards. */
export function formatCurrencyCompact(value: number) {
  return `$${number.format(Math.round(value))}`;
}

export function formatNumber(value: number) {
  return number.format(value);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** `Oct 1, 2024` */
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** `Jan 12, 2024` with zero-padded day, as used in the users table. */
export function formatDatePadded(iso: string) {
  const d = new Date(iso);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return `${month} ${pad(d.getDate())}, ${d.getFullYear()}`;
}

/** `January 12, 2024` */
export function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** `Oct 1, 2024 14:32` */
export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `Oct 15, 14:00` */
export function formatShortDateTime(iso: string) {
  const d = new Date(iso);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return `${month} ${pad(d.getDate())}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `2:00 PM` */
export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** `Tuesday, October 1, 2024` */
export function formatFullDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** `2 mins ago`, `1 hour ago`, `3 days ago`, `1 week ago`. */
export function formatRelative(iso: string, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  return formatDate(iso);
}

export function formatDuration(hours: number) {
  return `${hours.toFixed(1)} ${hours === 1 ? "hr" : "hrs"}`;
}

export function formatPercent(value: number) {
  return `${Math.abs(value).toFixed(1)}%`;
}
