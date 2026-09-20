"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function AdThumb({
  id,
  endpoint,
  size = "md",
  className,
}: {
  id: string;
  endpoint: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`${endpoint}?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (live) setUrl(d.url ?? null);
      })
      .catch(() => {
        if (live) setUrl(null);
      });
    return () => {
      live = false;
    };
  }, [id, endpoint]);

  const dims = size === "lg" ? "h-28 w-28" : "h-16 w-16";
  if (!url) return <Skeleton className={cn(dims, "shrink-0 rounded-lg", className)} />;
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      className={cn(dims, "shrink-0 rounded-lg border object-cover", className)}
    />
  );
}
