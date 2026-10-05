"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

/**
 * The "Role: All ⌄" style dropdown from the filter bars. A button + listbox
 * popover rather than a native <select> so it matches the design exactly.
 */
export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  weight = "medium",
  valueClassName,
  align = "left",
  className,
  trigger,
  triggerClassName,
  ariaLabel,
}: {
  label?: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
  weight?: "regular" | "medium";
  valueClassName?: string;
  align?: "left" | "right";
  className?: string;
  /** Replaces the default "Label: Value ⌄" trigger content. */
  trigger?: React.ReactNode;
  triggerClassName?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          triggerClassName ??
            cn(
              "flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-600 transition-colors hover:bg-slate-50",
              weight === "medium" ? "font-medium" : "font-normal",
            ),
          open && "border-indigo-600",
        )}
      >
        {trigger ?? (
          <>
            <span className={cn("whitespace-nowrap", valueClassName)}>
              {label ? `${label}: ` : ""}
              {current?.label}
            </span>
            <ChevronDown className="size-3.5 text-slate-500" strokeWidth={2} />
          </>
        )}
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            "absolute top-full z-30 mt-1 min-w-full overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-4 whitespace-nowrap px-3 py-2 text-left text-[13px] text-slate-600 hover:bg-slate-50",
                  o.value === value && "font-semibold text-indigo-600",
                )}
              >
                {o.label}
                {o.value === value && <Check className="size-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
