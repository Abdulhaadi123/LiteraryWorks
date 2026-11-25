"use client";

import { useEffect, useState } from "react";
import { agoText, utcText } from "@/lib/admin/format";

/**
 * A moment in the viewer's own time zone. The server cannot know it, so the first render (server and browser alike)
 * is in UTC (or "5 min ago"), and the browser then swaps in its local time.
 */
export function LocalTime({ ts, variant = "full" }: { ts: number; variant?: "full" | "ago" }) {
  const [full, setFull] = useState(utcText(ts));
  useEffect(() => {
    setFull(new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(ts)));
  }, [ts]);
  return (
    <time dateTime={new Date(ts).toISOString()} title={variant === "ago" ? full : undefined} suppressHydrationWarning>
      {variant === "ago" ? agoText(ts) : full}
    </time>
  );
}
