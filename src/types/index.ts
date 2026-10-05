export type UserRole = "Admin" | "Editor" | "Viewer";
export type UserStatus = "Active" | "Inactive" | "Suspended";

export interface User {
  id: number;
  code: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  gender: "male" | "female";
  avatar: string;
  role: UserRole;
  status: UserStatus;
  birthDate: string;
  address: string;
  joinedAt: string;
  lastActiveAt: string;
  twoFactorEnabled: boolean;
}

export type TransactionType = "Payment" | "Refund" | "Transfer";
export type TransactionStatus = "Completed" | "Pending" | "Failed" | "Refunded";

export interface Transaction {
  id: number;
  code: string;
  userId: number;
  type: TransactionType;
  status: TransactionStatus;
  /** Signed amount — refunds are negative. */
  amount: number;
  fee: number;
  method: string;
  reference: string;
  createdAt: string;
  itemCount: number;
}

export type BookingStatus = "Confirmed" | "Completed" | "Pending" | "Cancelled";

export interface Booking {
  id: number;
  code: string;
  userId: number;
  service: string;
  status: BookingStatus;
  scheduledAt: string;
  durationHours: number;
  amount: number;
  notes: string;
  location: string;
  invoice: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
