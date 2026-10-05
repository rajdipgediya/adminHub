"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { formatFullDate } from "@/lib/format";
import { useAppDispatch, useAppSelector } from "@/store";
import { setUserFilters } from "@/store/filtersSlice";
import { SearchInput } from "@/components/ui/search-input";
import { ADMIN, pageTitle } from "./nav-config";
import { Notifications } from "./notifications";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchFilter = useAppSelector((state) => state.filters.users.search);

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
            router.push("/users");
          }}
        >
          <SearchInput
            value={searchFilter}
            onChange={(s) => dispatch(setUserFilters({ search: s }))}
            placeholder="Search console..."
            className="w-60 bg-slate-50"
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
