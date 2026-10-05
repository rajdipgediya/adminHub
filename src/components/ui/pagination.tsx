import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Pagination({
  page,
  pageSize,
  total,
  pageCount,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className={cn("flex w-full items-center justify-between gap-3", className)}>
      <p className="text-[13px] text-slate-500" aria-live="polite">
        Showing{" "}
        <span className="font-semibold text-slate-900">
          {from}-{to}
        </span>{" "}
        of <span className="font-semibold text-slate-900">{formatNumber(total)}</span> results
      </p>
      <nav aria-label="Pagination" className="flex gap-2">
        <Button size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </nav>
    </div>
  );
}
