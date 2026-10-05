"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Debounced search field used in filter bars (desktop and mobile). */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  iconSize = 16,
  delay = 250,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  inputClassName?: string;
  iconSize?: number;
  delay?: number;
}) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);

  // Adopt external resets (e.g. "Clear filters") without an effect.
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => onChange(draft), delay);
    return () => clearTimeout(t);
  }, [draft, value, onChange, delay]);

  return (
    <label
      className={cn(
        "flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-indigo-600",
        className,
      )}
    >
      <Search className="shrink-0 text-slate-400" style={{ width: iconSize, height: iconSize }} />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-[13px] text-slate-900 outline-none placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden",
          inputClassName,
        )}
      />
      {draft && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setDraft("");
            onChange("");
          }}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="size-3.5" />
        </button>
      )}
    </label>
  );
}
