"use client";

import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setDashboardTab, type DashboardTab } from "@/store/uiSlice";

const TABS: DashboardTab[] = ["Overview", "Analytics", "Reports", "Settings"];

export function DashboardTabs() {
  const tab = useAppSelector((s) => s.ui.dashboardTab);
  const dispatch = useAppDispatch();
  return (
    <div role="tablist" aria-label="Dashboard sections" className="flex w-full gap-2 border-b border-slate-200 pb-1">
      {TABS.map((t) => (
        <button
          key={t}
          role="tab"
          type="button"
          aria-selected={t === tab}
          onClick={() => dispatch(setDashboardTab(t))}
          className={cn(
            "-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors",
            t === tab
              ? "border-indigo-600 font-semibold text-indigo-600"
              : "border-transparent font-medium text-slate-500 hover:text-slate-900",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function MobileDashboardTabs() {
  const tab = useAppSelector((s) => s.ui.dashboardTab);
  const dispatch = useAppDispatch();
  return (
    <div role="tablist" aria-label="Dashboard sections" className="scrollbar-none flex w-full gap-2 overflow-x-auto">
      {TABS.map((t) => (
        <button
          key={t}
          role="tab"
          type="button"
          aria-selected={t === tab}
          onClick={() => dispatch(setDashboardTab(t))}
          className={cn(
            "shrink-0 rounded-md px-3 py-1.5 text-[13px]",
            t === tab
              ? "bg-indigo-600 font-semibold text-white"
              : "border border-slate-200 bg-white font-medium text-slate-600",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
