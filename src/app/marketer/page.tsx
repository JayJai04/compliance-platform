"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  created_at: string;
  affiliate_name: string;
  product: string;
  status: string;
  reviewer_note: string | null;
  reviewed_at: string | null;
};

function Thumb({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/api/marketer/image?id=${id}`)
      .then((r) => r.json())
      .then((d) => setUrl(d.url ?? null))
      .catch(() => setUrl(null));
  }, [id]);
  if (!url) return <div className="h-16 w-16 rounded bg-zinc-100" />;
  return <img src={url} alt="" className="h-16 w-16 rounded object-cover" />;
}

export default function MarketerPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/marketer/list").then(async (r) => {
      if (r.status === 401) {
        router.push("/marketer/login");
        return;
      }
      const d = await r.json();
      if (d.items) {
        setItems(d.items);
        setEmail(d.email ?? "");
        setName(d.name ?? "");
      } else {
        setError(d.error ?? "Load failed.");
      }
    }).catch(() => setError("Load failed."));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/submit", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMessage("Ad received. A reviewer will check it soon.");
      event.currentTarget.reset();
      load();
    } else {
      setMessage(data.error ?? "Submit failed. Try again.");
    }
    setSending(false);
  }

  const shown = filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">{name ? `${name}'s Ads` : "My ads"}</h1>
      {email && <p className="text-sm text-zinc-600">{email}</p>}
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
          <li key={item.id} className="flex flex-col gap-2 rounded border p-3">
            <div className="flex items-center gap-4">
              <Thumb id={item.id} />
              <div className="flex-1">
                <p className="font-medium">
                  {item.affiliate_name} · {item.product}
                </p>
                <p className="text-sm text-zinc-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className="rounded bg-zinc-100 px-2 py-1 text-xs">{item.status}</span>
            </div>
            <div className="rounded bg-zinc-50 p-3 text-sm">
              <p className="font-medium">Compliance decision</p>
              <p className="mt-1 text-zinc-600">
                {item.reviewer_note ?? (item.status === "pending" ? "Under review." : "No decision recorded.")}
              </p>
              {item.reviewed_at && (
                <p className="mt-1 text-xs text-zinc-500">
                  Decided {new Date(item.reviewed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {shown.length === 0 && !error && <p className="text-sm text-zinc-500">No ads yet.</p>}

      <h2 className="mt-4 text-xl font-semibold">Submit a new ad</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Product</span>
          <select name="product" required className="rounded border px-3 py-2">
            <option value="loan">Personal loan</option>
            <option value="card">Credit card</option>
            <option value="mortgage">Mortgage</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Ad image (JPG, max 5MB)</span>
          <input name="ad_image" type="file" accept=".jpg,.jpeg,image/jpeg" required className="rounded border px-3 py-2" />
        </label>
        <button type="submit" disabled={sending} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
          {sending ? "Sending..." : "Submit ad"}
        </button>
      </form>
      {message && <p className="text-sm">{message}</p>}
    </main>
  );
}
