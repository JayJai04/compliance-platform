"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  created_at: string;
  affiliate_name: string;
  affiliate_email: string;
  product: string;
  status: string;
};

function Thumb({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/api/image?id=${id}`)
      .then((r) => r.json())
      .then((d) => setUrl(d.url ?? null))
      .catch(() => setUrl(null));
  }, [id]);
  if (!url) return <div className="h-16 w-16 rounded bg-zinc-100" />;
  return <img src={url} alt="" className="h-16 w-16 rounded object-cover" />;
}

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/list")
      .then((r) => r.json())
      .then((d) => {
        if (d.items) setItems(d.items);
        else setError(d.error ?? "Load failed.");
      })
      .catch(() => setError("Load failed."));
  }, []);

  const shown = filter === "all" ? items : items.filter((i) => i.status === filter);
  const counts = {
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Reviewer dashboard</h1>
      <p className="text-sm text-zinc-600">
        Pending: {counts.pending} · Approved: {counts.approved} · Rejected: {counts.rejected}
      </p>
      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-3 py-1 text-sm ${filter === f ? "bg-black text-white" : "bg-zinc-100"}`}
          >
            {f}
          </button>
        ))}
      </div>
      {error && <p className="text-sm">{error}</p>}
      <ul className="flex flex-col gap-3">
        {shown.map((item) => (
          <li key={item.id} className="flex items-center gap-4 rounded border p-3">
            <Thumb id={item.id} />
            <div className="flex-1">
              <p className="font-medium">
                {item.affiliate_name} · {item.product}
              </p>
              <p className="text-sm text-zinc-500">{item.affiliate_email}</p>
            </div>
            <span className="rounded bg-zinc-100 px-2 py-1 text-xs">{item.status}</span>
            <Link href={`/review/${item.id}`} className="text-sm underline">
              Open
            </Link>
          </li>
        ))}
      </ul>
      {shown.length === 0 && !error && <p className="text-sm text-zinc-500">No ads yet.</p>}
    </main>
  );
}
