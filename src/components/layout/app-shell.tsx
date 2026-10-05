"use client";

import { usePathname } from "next/navigation";
import { isDetailRoute } from "./nav-config";
import { BottomNav, MobileDrawer, MobileTopNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * ≥1024px: fixed dark sidebar + top bar (desktop frames).
 * <1024px: branded top nav (or a back-button header on detail screens),
 * slide-in drawer and bottom tab bar (mobile frames).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const detail = isDetailRoute(pathname);

  return (
    <div className="flex min-h-dvh bg-slate-50">
      <Sidebar className="sticky top-0 hidden h-dvh lg:flex print:!hidden" />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden lg:block print:!hidden">
          <Topbar />
        </div>
        {!detail && (
          <div className="lg:hidden print:!hidden">
            <MobileTopNav />
          </div>
        )}

        <main className="flex flex-1 flex-col pb-20 lg:pb-0">{children}</main>
      </div>

      <div className="lg:hidden print:!hidden">
        <BottomNav />
      </div>
      <div className="print:!hidden">
        <MobileDrawer />
      </div>
    </div>
  );
}
