"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SYSTEM_ALERTS } from "@/lib/system";

/** Bell button with unread badge and a popover listing system alerts. */
export function Notifications({
  children,
  buttonClassName,
  badgeClassName,
}: {
  children: React.ReactNode;
  buttonClassName: string;
  badgeClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifications${read ? "" : `, ${SYSTEM_ALERTS.length} unread`}`}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setRead(true);
        }}
        className={cn("relative flex items-center justify-center border border-slate-200 transition-colors hover:bg-slate-50", buttonClassName)}
      >
        {children}
        {!read && (
          <span className={cn("absolute flex items-center justify-center rounded-full bg-red-500 font-bold text-white", badgeClassName)}>
            {SYSTEM_ALERTS.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
          <p className="mb-3 text-sm font-bold text-slate-900">Notifications</p>
          <ul className="flex flex-col gap-3">
            {SYSTEM_ALERTS.map((a) => (
              <li key={a.title} className="relative pl-4">
                <span className={cn("absolute left-0 top-1.5 size-2 rounded-full", a.dot)} />
                <p className="text-[13px] font-semibold text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-600">{a.description}</p>
                <p className="text-[11px] text-slate-400">{a.time}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
