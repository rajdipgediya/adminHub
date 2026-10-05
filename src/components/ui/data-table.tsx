"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  /** Fixed pixel width; omit to let the column flex. */
  width?: number;
  align?: "left" | "right" | "center";
  cell: (row: T) => React.ReactNode;
  skeleton?: React.ReactNode;
}

const justify = { left: "justify-start", right: "justify-end", center: "justify-center" };

/**
 * Div-based table that mirrors the Figma auto-layout tables: a tinted header
 * strip, 12px cell padding, 16px column gaps and bottom-bordered rows.
 * Scrolls horizontally when the viewport is narrower than its columns.
 */
export function DataTable<T extends { id: number }>({
  columns,
  rows,
  getHref,
  loading,
  skeletonRows = 8,
  minWidth,
  lastRowBorder = true,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  getHref?: (row: T) => string;
  loading?: boolean;
  skeletonRows?: number;
  minWidth?: number;
  lastRowBorder?: boolean;
  empty?: React.ReactNode;
}) {
  const router = useRouter();

  const colStyle = (c: Column<T>) =>
    c.width ? { width: c.width, flexShrink: 0 } : { flex: "1 0 0", minWidth: 1 };

  return (
    <div className="w-full overflow-x-auto">
      <div role="table" className="flex w-full flex-col" style={{ minWidth }}>
        <div role="row" className="flex w-full items-center gap-4 rounded-md bg-slate-50 p-3">
          {columns.map((c) => (
            <div
              key={c.key}
              role="columnheader"
              style={colStyle(c)}
              className={cn(
                "flex text-xs font-semibold uppercase text-slate-500",
                justify[c.align ?? "left"],
              )}
            >
              {c.header}
            </div>
          ))}
        </div>

        {loading
          ? Array.from({ length: skeletonRows }).map((_, i) => (
              <div key={i} role="row" className="flex w-full items-center gap-4 border-b border-slate-200 p-3">
                {columns.map((c, colIdx) => (
                  <div key={c.key} role="cell" style={colStyle(c)} className={cn("flex min-w-0 items-center", justify[c.align ?? "left"])}>
                    {c.skeleton ?? (
                      <div className="flex w-full items-center gap-3">
                        <Skeleton className={cn("shrink-0", colIdx === columns.length - 1 ? "size-5 rounded-full" : "size-4 rounded-sm")} />
                        <Skeleton
                          className={cn(
                            "h-3.5 rounded-full",
                            ["w-[75%]", "w-[50%]", "w-[66%]", "w-[80%]", "w-[33%]"][(i + colIdx) % 5]
                          )}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          : rows.length === 0
            ? empty
            : rows.map((row, i) => {
                const href = getHref?.(row);
                return (
                  <div
                    key={row.id}
                    role="row"
                    tabIndex={href ? 0 : undefined}
                    onClick={href ? () => router.push(href) : undefined}
                    onKeyDown={
                      href ? (e) => e.key === "Enter" && router.push(href) : undefined
                    }
                    className={cn(
                      "flex w-full items-center gap-4 p-3",
                      (lastRowBorder || i < rows.length - 1) && "border-b border-slate-200",
                      href && "cursor-pointer transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none",
                    )}
                  >
                    {columns.map((c) => (
                      <div
                        key={c.key}
                        role="cell"
                        style={colStyle(c)}
                        className={cn("flex min-w-0 items-center", justify[c.align ?? "left"])}
                      >
                        {c.cell(row)}
                      </div>
                    ))}
                  </div>
                );
              })}
      </div>
    </div>
  );
}

/** Stops row navigation when clicking an inline action. */
export function RowAction({
  label,
  onClick,
  href,
  children,
  className,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        title={label}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className={cn("flex size-4 items-center justify-center text-slate-600 hover:text-indigo-600", className)}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn("flex size-4 items-center justify-center text-slate-600 hover:text-indigo-600", className)}
    >
      {children}
    </button>
  );
}
