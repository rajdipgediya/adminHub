import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type {
  BookingStatus,
  TransactionStatus,
  TransactionType,
  UserRole,
  UserStatus,
} from "@/types";

const badge = cva("inline-flex shrink-0 items-start whitespace-nowrap font-semibold text-[11px]", {
  variants: {
    tone: {
      success: "bg-emerald-100 text-emerald-800",
      warning: "bg-amber-100 text-amber-800",
      danger: "bg-red-100 text-red-800",
      info: "bg-blue-100 text-blue-800",
      neutral: "bg-slate-50 text-slate-600",
      muted: "bg-slate-200 text-slate-600",
      primary: "bg-indigo-50 text-indigo-600",
    },
    shape: {
      /** Status pills (`rounded-12`, 4px vertical padding). */
      pill: "rounded-xl px-2 py-1",
      /** Mobile cards use a slightly tighter pill. */
      pillSm: "rounded-xl px-2 py-[3px]",
      /** Mobile detail headers use wider bold pills. */
      pillLg: "rounded-xl px-2.5 py-1 font-bold",
      /** Role / type tags (`rounded-4`, 2px vertical padding). */
      tag: "rounded px-2 py-0.5",
    },
  },
  defaultVariants: { tone: "neutral", shape: "pill" },
});

export type BadgeTone = NonNullable<VariantProps<typeof badge>["tone"]>;

export function Badge({
  className,
  tone,
  shape,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone, shape }), className)} {...props} />;
}

const STATUS_TONE: Record<UserStatus | TransactionStatus | BookingStatus | "Paid" | "Success", BadgeTone> = {
  Active: "success",
  Inactive: "warning",
  Suspended: "danger",
  Completed: "success",
  Pending: "warning",
  Failed: "danger",
  Refunded: "neutral",
  Confirmed: "success",
  Cancelled: "danger",
  Paid: "success",
  Success: "success",
};

/** Bookings render "Completed" in blue to distinguish it from "Confirmed". */
export function statusTone(status: keyof typeof STATUS_TONE, context?: "booking"): BadgeTone {
  if (context === "booking" && status === "Completed") return "info";
  return STATUS_TONE[status];
}

export function StatusBadge({
  status,
  context,
  shape,
  className,
}: {
  status: keyof typeof STATUS_TONE;
  context?: "booking";
  shape?: VariantProps<typeof badge>["shape"];
  className?: string;
}) {
  return (
    <Badge tone={statusTone(status, context)} shape={shape} className={className}>
      {status}
    </Badge>
  );
}

const ROLE_TONE: Record<UserRole, BadgeTone> = { Admin: "primary", Editor: "info", Viewer: "neutral" };
const ROLE_TONE_MOBILE: Record<UserRole, BadgeTone> = { Admin: "info", Editor: "info", Viewer: "muted" };

export function RoleBadge({ role, mobile }: { role: UserRole; mobile?: boolean }) {
  return mobile ? (
    <Badge tone={ROLE_TONE_MOBILE[role]} shape="pillSm">
      {role}
    </Badge>
  ) : (
    <Badge tone={ROLE_TONE[role]} shape="tag">
      {role}
    </Badge>
  );
}

export function TypeBadge({ type, mobile }: { type: TransactionType; mobile?: boolean }) {
  return mobile ? (
    <Badge tone="info" shape="pillSm">
      {type}
    </Badge>
  ) : (
    <Badge tone={type === "Refund" ? "danger" : "info"} shape="tag">
      {type}
    </Badge>
  );
}
