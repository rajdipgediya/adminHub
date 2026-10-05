"use client";

import { useState } from "react";

/** Timestamp captured once per mount so time-derived values stay stable across re-renders. */
export function useNow() {
  const [now] = useState(() => Date.now());
  return now;
}
