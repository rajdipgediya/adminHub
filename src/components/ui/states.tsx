import { Inbox, RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function ErrorState({
  title = "Something went wrong",
  error,
  onRetry,
  className,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const message =
    error instanceof Error ? error.message : "We couldn't load this data. Please try again.";
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center gap-3 px-4 py-10 text-center", className)}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-500">
        <TriangleAlert className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-[13px] text-slate-500">{message}</p>
      </div>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "No results found",
  description = "Try adjusting your search or filters.",
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-4 py-10 text-center", className)}>
      <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Inbox className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-[13px] text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
