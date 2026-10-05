"use client";

import { ErrorState } from "@/components/ui/states";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-4 lg:p-8">
      <div className="rounded-lg border border-slate-200 bg-white">
        <ErrorState error={error} onRetry={reset} />
      </div>
    </div>
  );
}
