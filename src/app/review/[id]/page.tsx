"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Detail = {
  id: string;
  affiliate_name: string;
  affiliate_email: string;
  product: string;
  status: string;
  ai_result: { notes?: string[] } | null;
  reviewer_note: string | null;
};

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<Detail | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/list")
      .then((r) => r.json())
      .then((d) => {
        const found = (d.items ?? []).find((i: Detail) => i.id === id);
        if (found) {
          setItem(found);
          setNote(found.reviewer_note ?? (found.ai_result?.notes ?? []).join("\n") ?? "");
        }
      });
    fetch(`/api/image?id=${id}`)
      .then((r) => r.json())
      .then((d) => setImageUrl(d.url ?? null));
  }, [id]);

  async function decide(decision: "approved" | "rejected") {
    setMessage(null);
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
  }

  if (!item) return <main className="p-12">Loading...</main>;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Review ad</h1>
      <p className="text-sm text-zinc-600">
        {item.affiliate_name} ({item.affiliate_email}) · {item.product} · {item.status}
      </p>
      {imageUrl && <img src={imageUrl} alt="Ad" className="w-full rounded border" />}
      <div className="rounded border p-3 text-sm">
        <p className="font-medium">Auto check notes</p>
        {(item.ai_result?.notes ?? ["No notes."]).map((n, i) => (
          <p key={i} className="mt-1 text-zinc-600">{n}</p>
        ))}
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Final decision (edit the AI draft, then approve)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="rounded border px-3 py-2"
          placeholder="What needs fixing, or why it passed."
        />
      </label>
      <div className="flex gap-3">
        <button onClick={() => decide("approved")} className="rounded bg-green-700 px-4 py-2 text-white">
          Approve
        </button>
        <button onClick={() => decide("rejected")} className="rounded bg-red-700 px-4 py-2 text-white">
          Reject
        </button>
      </div>
      {message && <p className="text-sm">{message}</p>}
    </main>
  );
}
