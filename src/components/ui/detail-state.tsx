"use client";

import Link from "next/link";
import { ApiError } from "@/lib/api/client";
import { Card } from "./card";
import { buttonVariants } from "./button";
import { Skeleton } from "./skeleton";
import { EmptyState, ErrorState } from "./states";

/** Shared loading / not-found / error handling for detail screens. */
export function DetailState({
  isLoading,
  error,
  onRetry,
  entity,
  backHref,
}: {
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  entity: string;
  backHref: string;
}) {
  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-4 lg:gap-6">
        <Skeleton className="h-[120px] w-full rounded-lg" />
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <Skeleton className="h-64 flex-1 rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg lg:w-[400px]" />
        </div>
      </div>
    );
  }
  if (error instanceof ApiError && error.status === 404) {
    return (
      <Card>
        <EmptyState
          title={`${entity} not found`}
          description={`This ${entity.toLowerCase()} doesn't exist or has been removed.`}
          action={
            <Link href={backHref} className={buttonVariants({ size: "sm" })}>
              Back to list
            </Link>
          }
        />
      </Card>
    );
  }
  return (
    <Card>
      <ErrorState title={`Couldn't load this ${entity.toLowerCase()}`} error={error} onRetry={onRetry} />
    </Card>
  );
}
