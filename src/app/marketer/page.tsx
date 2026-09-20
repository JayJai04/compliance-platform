"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileImage } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AdThumb } from "@/components/ad-thumb";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  created_at: string;
  affiliate_name: string;
  product: string;
  status: string;
  reviewer_note: string | null;
  reviewed_at: string | null;
};

const FILTERS = ["all", "pending", "approved", "rejected"] as const;

function SubmitDialog({ onSubmitted }: { onSubmitted: () => void }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (preview) URL.revokeObjectURL(preview);
    if (!file) {
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const file = form.get("ad_image");
    if (!(file instanceof File) || file.size === 0) {
      setMessage("Choose a JPG image first.");
      setSending(false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must be under 5MB.");
      setSending(false);
      return;
    }
    try {
      const res = await fetch("/api/submit", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setOpen(false);
        setPreview(null);
        event.currentTarget.reset();
        onSubmitted();
      } else {
        setMessage(data.error ?? "Submit failed. Try again.");
      }
    } catch {
      setMessage("Submit failed. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Submit ad
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit a new ad</DialogTitle>
          <DialogDescription>Upload a JPG of your ad. A reviewer will check it soon.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Product</span>
            <select name="product" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="loan">Personal loan</option>
              <option value="card">Credit card</option>
              <option value="mortgage">Mortgage</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Ad image (JPG, max 5MB)</span>
            <Input name="ad_image" type="file" accept=".jpg,.jpeg,image/jpeg" required onChange={onFileChange} />
          </label>
          {preview ? (
            <img src={preview} alt="Ad preview" className="max-h-64 w-full rounded-lg border object-contain" />
          ) : (
            <div className="flex h-32 items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
              <FileImage className="h-4 w-4" />
              Preview appears here
            </div>
          )}
          {message && <p className="text-sm text-destructive">{message}</p>}
          <Button type="submit" disabled={sending}>
            {sending ? "Sending..." : "Submit ad"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MarketerPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/marketer/list")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/login");
          return;
        }
        const d = await r.json();
        if (d.items) {
          setItems(d.items);
          setEmail(d.email ?? "");
          setName(d.name ?? "");
          setError(null);
        } else {
          setError(d.error ?? "Load failed.");
        }
      })
      .catch(() => setError("Load failed."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/marketer/list")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/login");
          return;
        }
        const d = await r.json();
        if (cancelled) return;
        if (d.items) {
          setItems(d.items);
          setEmail(d.email ?? "");
          setName(d.name ?? "");
          setError(null);
        } else {
          setError(d.error ?? "Load failed.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Load failed.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onLogout() {
    await fetch("/api/marketer/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  }

  const shown = filter === "all" ? items : items.filter((i) => i.status === filter);
  const countFor = (f: (typeof FILTERS)[number]) =>
    f === "all" ? items.length : items.filter((i) => i.status === f).length;

  return (
    <div className="min-h-screen">
      <AppHeader role="Marketer" email={email} onLogout={onLogout} />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{name ? `${name}'s Ads` : "My ads"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track review status and submit new ads.</p>
          </div>
          <SubmitDialog
            onSubmitted={() => {
              setNotice("Ad received. A reviewer will check it soon.");
              load();
            }}
          />
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
              {f} · {countFor(f)}
            </button>
          ))}
        </div>

        {notice && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>
        )}
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
              <FileImage className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No ads yet</p>
              <p className="text-sm text-muted-foreground">Submit your first ad to get it reviewed.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((item) => (
              <li key={item.id}>
                <Card>
                  <CardContent className="flex flex-col gap-3 pt-6">
                    <div className="flex items-center gap-4">
                      <AdThumb id={item.id} endpoint="/api/marketer/image" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.affiliate_name} · {item.product}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3 text-sm">
                      <p className="font-medium">Compliance decision</p>
                      <p className="mt-1 text-muted-foreground">
                        {item.reviewer_note ??
                          (item.status === "pending" ? "Under review." : "No decision recorded.")}
                      </p>
                      {item.reviewed_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Decided {new Date(item.reviewed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
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
