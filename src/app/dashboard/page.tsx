"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2, XCircle, Inbox } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AdThumb } from "@/components/ad-thumb";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  created_at: string;
  affiliate_name: string;
  affiliate_email: string;
  product: string;
  status: string;
};

const FILTERS = ["all", "pending", "approved", "rejected"] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/list")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/login");
          return;
        }
        const d = await r.json();
        if (d.items) setItems(d.items);
        else setError(d.error ?? "Load failed.");
      })
      .catch(() => setError("Load failed."))
      .finally(() => setLoading(false));
  }, [router]);

  const shown = filter === "all" ? items : items.filter((i) => i.status === filter);
  const counts = {
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
  };

  const stats = [
    { label: "Pending", value: counts.pending, icon: Clock, tone: "text-amber-600" },
    { label: "Approved", value: counts.approved, icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Rejected", value: counts.rejected, icon: XCircle, tone: "text-red-600" },
  ];

  return (
    <div className="min-h-screen">
      <AppHeader
        role="Reviewer"
        onLogout={async () => {
          await fetch("/api/logout", { method: "POST" }).catch(() => {});
          router.push("/login");
        }}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reviewer dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review submitted ads and record decisions.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 pt-6">
                <s.icon className={cn("h-5 w-5", s.tone)} />
                <div>
                  <p className="text-2xl font-semibold leading-none">{loading ? "–" : s.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                buttonVariants({ size: "sm", variant: filter === f ? "default" : "secondary" }),
                "capitalize"
              )}
            >
              {f} · {f === "all" ? items.length : counts[f as keyof typeof counts]}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 pt-6">
                  <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : shown.length === 0 && !error ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Nothing here</p>
              <p className="text-sm text-muted-foreground">No ads match this filter.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((item) => (
              <li key={item.id}>
                <Card>
                  <CardContent className="flex items-center gap-4 pt-6">
                    <AdThumb id={item.id} endpoint="/api/image" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {item.affiliate_name} · {item.product}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {item.affiliate_email} · {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                    <Link href={`/review/${item.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Open
                    </Link>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
