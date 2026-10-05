/**
 * DummyJSON has no notion of admin roles, account status, transaction types
 * or bookings. These mappers turn its users / carts / todos into the domain
 * models the design needs. Every derived field is seeded from the record id,
 * so a record always renders the same way across reloads.
 */
import type {
  Booking,
  BookingStatus,
  Transaction,
  TransactionStatus,
  TransactionType,
  User,
  UserRole,
  UserStatus,
} from "@/types";
import { pick, seeded } from "@/lib/utils";

const DAY = 86_400_000;
const HOUR = 3_600_000;

/** Records are dated relative to "today" so the dashboard always looks live. */
function anchor() {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  return d.getTime();
}

export interface DummyUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: "male" | "female";
  role: "admin" | "moderator" | "user";
  birthDate: string;
  address: { address: string; city: string; stateCode: string };
}

export interface DummyCart {
  id: number;
  userId: number;
  discountedTotal: number;
  totalQuantity: number;
}

export interface DummyTodo {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
}

const ROLE_MAP: Record<DummyUser["role"], UserRole> = {
  admin: "Admin",
  moderator: "Editor",
  user: "Viewer",
};

export function avatarFor(id: number, gender: "male" | "female") {
  const folder = gender === "female" ? "women" : "men";
  return `https://randomuser.me/api/portraits/${folder}/${id % 100}.jpg`;
}

export function mapUser(u: DummyUser): User {
  const r = seeded(u.id + 7);
  // Admin accounts stay active so the signed-in admin never appears suspended.
  const status: UserStatus =
    u.role === "admin" ? "Active" : r < 0.1 ? "Suspended" : r < 0.28 ? "Inactive" : "Active";
  const now = anchor();
  return {
    id: u.id,
    code: `#USR-${4820 + u.id}`,
    firstName: u.firstName,
    lastName: u.lastName,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email.replace("@x.dummyjson.com", "@example.com"),
    phone: u.phone,
    gender: u.gender,
    avatar: avatarFor(u.id, u.gender),
    role: ROLE_MAP[u.role],
    status,
    birthDate: new Date(u.birthDate).toISOString(),
    address: `${u.address.address}, ${u.address.city}, ${u.address.stateCode}`,
    joinedAt: new Date(now - (2 + Math.floor(seeded(u.id) * 540)) * DAY).toISOString(),
    lastActiveAt: new Date(now - seeded(u.id + 1) ** 3 * 14 * DAY).toISOString(),
    twoFactorEnabled: seeded(u.id + 3) > 0.3,
  };
}

const METHODS = [
  "Visa Card (*4582)",
  "Mastercard (*1121)",
  "Direct PayPal Link",
  "Bank Transfer (ACH)",
] as const;

export function mapTransaction(c: DummyCart): Transaction {
  const type: TransactionType =
    c.id % 8 === 3 || c.id % 8 === 7 ? "Refund" : c.id % 5 === 4 ? "Transfer" : "Payment";
  const r = seeded(c.id + 11);
  const status: TransactionStatus =
    type === "Refund"
      ? r < 0.5
        ? "Refunded"
        : "Completed"
      : r < 0.62
        ? "Completed"
        : r < 0.85
          ? "Pending"
          : "Failed";
  const gross = Math.round(c.discountedTotal * 100) / 100;
  const amount = type === "Refund" ? -gross : gross;
  const createdAt = anchor() - (c.id - 1) * 3.6 * DAY - Math.floor(seeded(c.id) * 9) * HOUR;
  return {
    id: c.id,
    code: `#TXN-${1083 - c.id}`,
    userId: c.userId,
    type,
    status,
    amount,
    fee: Math.round((gross * 0.029 + 0.3) * 100) / 100,
    method: pick(METHODS, c.id),
    reference: `#REF-${98342718 + c.id * 7919}`,
    createdAt: new Date(createdAt).toISOString(),
    itemCount: c.totalQuantity,
  };
}

export const SERVICES = [
  "Business Consultation",
  "Technical Support",
  "Executive Coaching",
  "Strategy Session",
  "Personal Training",
  "IT Consultation",
  "Platform Audit",
  "Security Assessment",
] as const;

const PRICES = [95, 120, 180, 250] as const;
const DURATIONS = [1, 1.5, 2] as const;

export function mapBooking(t: DummyTodo): Booking {
  const start = new Date(anchor() + (14 - (t.id - 1) * 0.9) * DAY);
  start.setHours(9 + Math.floor(seeded(t.id + 5) * 8), seeded(t.id + 6) > 0.5 ? 30 : 0, 0, 0);
  const isPast = start.getTime() < Date.now();
  const r = seeded(t.id + 13);
  const status: BookingStatus =
    t.completed && isPast
      ? "Completed"
      : r < 0.12
        ? "Cancelled"
        : r < 0.42
          ? "Pending"
          : "Confirmed";
  return {
    id: t.id,
    code: `#BKG-${2342 - t.id}`,
    userId: t.userId,
    service: pick(SERVICES, t.id),
    status,
    scheduledAt: start.toISOString(),
    durationHours: pick(DURATIONS, t.id + 2),
    amount: pick(PRICES, t.id + 4),
    notes: `"${t.todo}."`,
    location: seeded(t.id + 8) > 0.35 ? "Virtual - Zoom Link Provided" : "On-site - HQ Room 4B",
    invoice: `#INV-${10294 + t.id}`,
  };
}
