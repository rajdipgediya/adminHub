import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

/** Label / value row used in the detail cards ("Full Name ........ Sarah Johnson"). */
export function DetailRow({
  label,
  children,
  last,
  mobile,
  valueClassName,
  className,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
  mobile?: boolean;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-4 text-[13px]",
        !last && "border-b border-slate-200",
        !last && (mobile ? "pb-2.5" : "pb-2"),
        className,
      )}
    >
      <span className={cn("shrink-0 text-slate-500", mobile && "font-medium")}>{label}</span>
      <span
        className={cn(
          "min-w-0 truncate text-right text-slate-900",
          mobile ? "font-medium" : "font-semibold",
          valueClassName,
        )}
      >
        {children}
      </span>
    </div>
  );
}

export function DetailRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex justify-between border-b border-slate-200 pb-2 last:border-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
      ))}
    </div>
  );
}

export function Breadcrumbs({ parent, href, current }: { parent: string; href: string; current?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px]">
      <Link href={href} className="font-medium text-slate-500 hover:text-indigo-600">
        {parent}
      </Link>
      <span className="text-slate-400">/</span>
      {current ? (
        <span aria-current="page" className="font-semibold text-slate-900">
          {current}
        </span>
      ) : (
        <Skeleton className="h-4 w-20" />
      )}
    </nav>
  );
}

export interface TimelineEntry {
  title: string;
  description: string;
  time: string;
  tone?: "indigo" | "green";
}

/** Desktop activity list: 8px dot + title / description / timestamp. */
export function DotList({ items, gap = 16 }: { items: TimelineEntry[]; gap?: number }) {
  return (
    <ul className="flex flex-col" style={{ gap }}>
      {items.map((item) => (
        <li key={item.title + item.time} className="relative flex gap-3">
          <span
            className={cn(
              "absolute left-0 top-1.5 size-2 rounded-full",
              item.tone === "green" ? "bg-emerald-500" : "bg-indigo-600",
            )}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pl-4">
            <p className="text-[13px] font-semibold text-slate-900">{item.title}</p>
            <p className="text-xs text-slate-600">{item.description}</p>
            <p className="text-[11px] text-slate-500">{item.time}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Mobile timeline: dot column with connecting line (Figma `node-dot` / `node-line`). */
export function Timeline({ items }: { items: TimelineEntry[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item, i) => (
        <li key={item.title + item.time} className="flex gap-3">
          <div className="flex flex-col items-center self-stretch">
            <Image
              src={item.tone === "green" ? "/figma/timeline-dot-green.svg" : "/figma/timeline-dot-indigo.svg"}
              alt=""
              width={10}
              height={10}
              className="mt-[3px] shrink-0"
            />
            {i < items.length - 1 && <span className="mt-0.5 w-0.5 flex-1 bg-slate-200" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-1">
            <p className="text-[13px] font-semibold text-slate-900">{item.title}</p>
            <p className="text-xs text-slate-500">{item.description}</p>
            <p className="text-[11px] text-slate-400">{item.time}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
