"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setMobileNavOpen } from "@/store/uiSlice";
import { ADMIN, BOTTOM_NAV, isActive } from "./nav-config";
import { Notifications } from "./notifications";
import { Sidebar } from "./sidebar";

/** Branded mobile header: menu · logo · bell · avatar. */
export function MobileTopNav() {
  const dispatch = useAppDispatch();
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => dispatch(setMobileNavOpen(true))}
          className="-m-1 p-1"
        >
          <Menu className="size-5 text-slate-900" />
        </button>
        <Link href="/" className="flex items-center gap-1.5">
          <Image src="/figma/mobile-logo.svg" alt="" width={24} height={24} />
          <span className="text-base font-bold text-slate-900">AdminHub</span>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <Notifications
          buttonClassName="size-8 rounded-full"
          badgeClassName="-right-[3px] -top-[3px] size-3.5 text-[8px]"
        >
          <span className="relative block size-4">
            <Image
              src="/figma/mobile-bell.svg"
              alt=""
              width={16}
              height={12}
              className="absolute inset-x-0 top-0 h-3 w-4"
            />
          </span>
        </Notifications>
        <Link href="/profile" aria-label="Your profile">
          <Image
            src={ADMIN.avatarTopbar}
            alt={ADMIN.name}
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
        </Link>
      </div>
    </header>
  );
}

/** Detail-screen header: back arrow, title and a round action button. */
export function MobileDetailHeader({
  title,
  backHref,
  action,
}: {
  title: string;
  backHref: string;
  action?: { label: string; icon: React.ReactNode; onClick?: () => void };
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => (window.history.length > 1 ? router.back() : router.push(backHref))}
          className="flex items-center justify-center p-1"
        >
          <ArrowLeft className="size-5 text-slate-900" />
        </button>
        <h1 className="text-base font-bold text-slate-900">{title}</h1>
      </div>
      {action && (
        <button
          type="button"
          aria-label={action.label}
          onClick={action.onClick}
          className="flex rounded-full border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
        >
          {action.icon}
        </button>
      )}
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-between border-t border-slate-200 bg-white px-4 py-2 pb-[max(8px,env(safe-area-inset-bottom))] sm:justify-around"
    >
      {BOTTOM_NAV.map(({ label, href, icon, size }) => {
        const active =
          href === "/profile" ? pathname === "/profile" : isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="flex w-[60px] flex-col items-center justify-center gap-1"
          >
            <span className="flex size-5 items-center justify-center">
              <Image
                src={`/figma/nav-${icon}${active ? "-active" : ""}.svg`}
                alt=""
                width={size[0]}
                height={size[1]}
                style={{ width: size[0], height: size[1] }}
              />
            </span>
            <span
              className={cn(
                "whitespace-nowrap text-[10px]",
                active ? "text-indigo-600" : "text-slate-400",
                icon === "dashboard" ? "font-semibold" : "font-medium",
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Off-canvas copy of the desktop sidebar, opened from the hamburger. */
export function MobileDrawer() {
  const open = useAppSelector((s) => s.ui.mobileNavOpen);
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const close = () => dispatch(setMobileNavOpen(false));

  useEffect(() => {
    dispatch(setMobileNavOpen(false));
  }, [pathname, dispatch]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dispatch(setMobileNavOpen(false));
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, dispatch]);

  return (
    <div
      className={cn("fixed inset-0 z-50 lg:hidden", open ? "visible" : "invisible")}
      aria-hidden={!open}
    >
      <div
        onClick={close}
        className={cn(
          "absolute inset-0 bg-slate-900/40 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "absolute inset-y-0 left-0 flex transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar onNavigate={close} className="h-full" />
        <button
          type="button"
          aria-label="Close navigation"
          onClick={close}
          className="absolute right-3 top-6 text-slate-400 hover:text-white"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
}
