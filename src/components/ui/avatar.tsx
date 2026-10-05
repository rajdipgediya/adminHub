"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Avatar({
  src,
  name,
  size,
  className,
  priority,
}: {
  src?: string;
  name: string;
  size: number;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  if (!src || failed) {
    return (
      <span
        aria-label={name}
        style={{ width: size, height: size, fontSize: Math.max(9, size * 0.36) }}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-400 font-semibold text-white",
          className,
        )}
      >
        {initials}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}
