"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { formatFullDate } from "@/lib/format";
import { useAppDispatch } from "@/store";
import { setUserFilters } from "@/store/filtersSlice";
import { ADMIN, pageTitle } from "./nav-config";
import { Notifications } from "./notifications";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");

  return (
    <header className="flex h-[70px] shrink-0 items-center justify-between gap-6 border-b border-slate-200 bg-white px-8">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="truncate text-lg font-bold text-slate-900">{pageTitle(pathname)}</h1>
        <p className="text-xs text-slate-500" suppressHydrationWarning>
          {formatFullDate(new Date())}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-5">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch(setUserFilters({ search: query.trim() }));
            router.push("/users");
          }}
          className="flex w-60 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-indigo-600"
        >
          <Search className="size-4 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search console..."
            aria-label="Search users"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-900 outline-none placeholder:text-slate-400"
          />
        </form>

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
  );
}

function NotificationsBell() {
  return (
    <Notifications buttonClassName="size-10 rounded-full" badgeClassName="right-px top-px size-[18px] text-[10px]">
      <Bell className="size-5 text-slate-600" />
    </Notifications>
  );
}
