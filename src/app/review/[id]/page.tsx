"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";

type Detail = {
  id: string;
  affiliate_name: string;
  affiliate_email: string;
  product: string;
  status: string;
  ai_result: { notes?: string[]; overall?: "pass" | "warn" | "fail" | "unknown"; findings?: { code: string; severity: string; message: string }[] } | null;
  reviewer_note: string | null;
};

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<Detail | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState<null | "approved" | "rejected">(null);

  useEffect(() => {
    let polls = 0;
    const timer = setInterval(refreshItem, 3000);
    function refreshItem() {
      polls += 1;
      if (polls > 10) {
        clearInterval(timer);
        return;
      }
      fetch("/api/list")
        .then((r) => r.json())
        .then((d) => {
          const found = (d.items ?? []).find((i: Detail) => i.id === id);
          if (!found) return;
          setItem(found);
          if (found.ai_result?.overall === "pass" || found.ai_result?.overall === "fail") {
            clearInterval(timer);
          }
        })
        .catch(() => {});
    }
    fetch("/api/list")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/login");
          return {};
        }
        return r.json();
      })
      .then((d) => {
        const found = (d.items ?? []).find((i: Detail) => i.id === id);
        if (found) {
          setItem(found);
          setNote(found.reviewer_note ?? "");
          if (found.ai_result?.overall === "pass" || found.ai_result?.overall === "fail") {
            clearInterval(timer);
          }
        }
      })
      .catch(() => setMessage("Could not load this ad."));
    fetch(`/api/image?id=${id}`)
      .then((r) => r.json())
      .then((d) => setImageUrl(d.url ?? null))
      .catch(() => setImageUrl(null));
    return () => clearInterval(timer);
  }, [id, router]);

  async function decide(decision: "approved" | "rejected") {
    setMessage(null);
    setSending(decision);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision, reviewer_note: note }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setMessage("Save failed. Try again.");
      }
    } catch {
      setMessage("Save failed. Try again.");
    } finally {
      setSending(null);
    }
  }

  if (!item)
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-6 py-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </main>
    );

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Review ad</h1>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.affiliate_name} ({item.affiliate_email}) · {item.product}
          </p>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              {imageUrl ? (
                <img src={imageUrl} alt="Ad" className="w-full rounded-lg border object-contain" />
              ) : (
                <Skeleton className="h-96 w-full" />
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  Auto check notes
                </CardTitle>
                <CardDescription>Reference only — your note below is the marketer-facing decision.</CardDescription>
              </CardHeader>
              <CardContent>
                {item.ai_result?.overall && (
                  <p className="text-sm font-medium">Overall: {item.ai_result.overall}</p>
                )}
                {(item.ai_result?.findings ?? []).map((f, i) => (
                  <p key={i} className="mt-1 text-sm text-muted-foreground">
                    [{f.severity}] {f.message}
                  </p>
                ))}
                {(item.ai_result?.notes ?? ["No notes."]).map((n, i) => (
                  <p key={i} className="mt-1 text-sm text-muted-foreground">{n}</p>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compliance decision</CardTitle>
                <CardDescription>Edit the draft, then approve or reject.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={5}
                  placeholder="What needs fixing, or why it passed."
                />
                {message && <p className="text-sm text-destructive">{message}</p>}
                <div className="hidden gap-3 md:flex">
                  <Button variant="success" onClick={() => decide("approved")} disabled={sending !== null} className="flex-1">
                    {sending === "approved" ? "Approving..." : "Approve"}
                  </Button>
                  <Button variant="destructive" onClick={() => decide("rejected")} disabled={sending !== null} className="flex-1">
                    {sending === "rejected" ? "Rejecting..." : "Reject"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 p-4 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-5xl gap-3">
          <Button variant="success" onClick={() => decide("approved")} disabled={sending !== null} className="flex-1">
            {sending === "approved" ? "Approving..." : "Approve"}
          </Button>
          <Button variant="destructive" onClick={() => decide("rejected")} disabled={sending !== null} className="flex-1">
            {sending === "rejected" ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      </div>
    </div>
  );
}
