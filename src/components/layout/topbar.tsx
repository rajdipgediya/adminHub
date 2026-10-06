"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bell, Search, LayoutDashboard, Users, CreditCard, Calendar, Settings } from "lucide-react";
import { formatFullDate } from "@/lib/format";
import { ADMIN, pageTitle } from "./nav-config";
import { Notifications } from "./notifications";
import { Dialog } from "@/components/ui/dialog";

const SEARCH_LINKS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users Directory", href: "/users", icon: Users },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Bookings", href: "/bookings", icon: Calendar },
  { name: "Profile Settings", href: "/profile", icon: Settings },
];

export function Topbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="flex h-[70px] shrink-0 items-center justify-between gap-6 border-b border-slate-200 bg-white px-8">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-lg font-bold text-slate-900">{pageTitle(pathname)}</h1>
          <p className="text-xs text-slate-500" suppressHydrationWarning>
            {formatFullDate(new Date())}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-5">
          <button
            onClick={() => setSearchOpen(true)}
            className="group relative flex w-64 items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 transition-colors hover:bg-slate-200"
          >
            <Search className="size-4 shrink-0 text-slate-500" />
            <span className="flex-1 text-left text-[13px] text-slate-500">Search console...</span>
            <kbd className="flex h-5 items-center justify-center rounded border border-slate-300 bg-slate-50 px-1.5 font-sans text-[10px] font-medium text-slate-500 shadow-sm transition-colors group-hover:bg-white">
              ⌘K
            </kbd>
          </button>

          <NotificationsBell />

          <Link href="/profile" aria-label="Your profile">
            <Image
              src={ADMIN.avatarTopbar}
              alt={ADMIN.name}
              width={36}
              height={36}
              className="size-9 rounded-full object-cover"
            />
          </Link>
        </div>
      </header>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = SEARCH_LINKS.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()));

  // Reset query when closed
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} title="Global Search" className="max-w-2xl">
      <div className="flex flex-col gap-4 pt-2">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3 focus-within:border-indigo-600">
          <Search className="size-5 shrink-0 text-slate-400" />
          <input
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, settings, or tools..."
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="flex flex-col gap-1">
          {filtered.length > 0 ? (
            filtered.map((link) => (
              <button
                key={link.href}
                onClick={() => {
                  router.push(link.href);
                  onClose();
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                <link.icon className="size-4 shrink-0 opacity-70" />
                {link.name}
              </button>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No results found for "{query}"</p>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function NotificationsBell() {
  return (
    <Notifications buttonClassName="size-10 rounded-full" badgeClassName="right-px top-px size-[18px] text-[10px]">
      <Bell className="size-5 text-slate-600" />
    </Notifications>
  );
}
