"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN, NAV_ITEMS, isActive } from "./nav-config";

export function Sidebar({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col justify-between bg-slate-800 px-4 py-6",
        className,
      )}
    >
      <div className="flex flex-col gap-6">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600">
            <Cpu className="size-[18px] text-white" strokeWidth={2} />
          </span>
          <span className="text-lg font-bold text-white">AdminHub</span>
        </Link>

        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-slate-700 font-semibold text-slate-50"
                    : "font-medium text-slate-400 hover:bg-slate-700/50 hover:text-slate-200",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Link
        href="/profile"
        onClick={onNavigate}
        className="flex items-center gap-3 border-t border-slate-700 pt-4"
      >
        <Image
          src={ADMIN.avatar}
          alt={ADMIN.name}
          width={36}
          height={36}
          className="size-9 shrink-0 rounded-full object-cover"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-white">{ADMIN.name}</span>
          <span className="truncate text-xs font-medium text-slate-400">{ADMIN.role}</span>
        </span>
      </Link>
    </aside>
  );
}
