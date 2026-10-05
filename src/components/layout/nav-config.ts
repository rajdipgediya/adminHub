import { ArrowLeftRight, Calendar, LayoutGrid, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutGrid },
  { label: "Users", href: "/users", icon: Users },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Bookings", href: "/bookings", icon: Calendar },
];

/** Mobile bottom-nav tabs use the custom icon set exported from Figma. */
export const BOTTOM_NAV = [
  { label: "Dashboard", href: "/", icon: "dashboard", size: [20, 20] },
  { label: "Users", href: "/users", icon: "users", size: [20, 20] },
  { label: "Transaction", href: "/transactions", icon: "transactions", size: [20, 20] },
  { label: "Bookings", href: "/bookings", icon: "bookings", size: [17, 17.4] },
  { label: "Profile", href: "/profile", icon: "profile", size: [20, 20] },
] as const;

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Top-bar heading per section, as titled in each desktop frame. */
export function pageTitle(pathname: string) {
  if (pathname === "/") return "Welcome back, Sarah";
  if (/^\/users\/\d+/.test(pathname) || pathname === "/profile") return "User Directory";
  if (pathname.startsWith("/users")) return "User Management";
  if (/^\/transactions\/\d+/.test(pathname)) return "Transactions Log";
  if (pathname.startsWith("/transactions")) return "Transactions Ledger";
  if (/^\/bookings\/\d+/.test(pathname)) return "Booking Management";
  if (pathname.startsWith("/bookings")) return "Bookings";
  return "AdminHub";
}

/** Detail screens swap the branded mobile header for a back-button header. */
export function isDetailRoute(pathname: string) {
  return /^\/(users|transactions|bookings)\/\d+/.test(pathname) || pathname === "/profile";
}

export const ADMIN = {
  name: "Sarah Jenkins",
  firstName: "Sarah",
  role: "Super Admin",
  avatar: "/figma/admin-avatar-topbar.jpg",
  avatarTopbar: "/figma/admin-avatar-topbar.jpg",
};
