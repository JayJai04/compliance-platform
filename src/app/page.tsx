"use client";

import { useState, type FormEvent } from "react";

export default function Home() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    } else {
      setMessage(data.error ?? "Submit failed. Try again.");
    }
    setSending(false);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-6 py-12">
      <div>
        <p className="text-sm text-zinc-500">ClearPath Financial</p>
        <h1 className="text-3xl font-semibold">Submit your ad</h1>
        <p className="mt-2 text-zinc-600">
          Upload a JPG of your ad. We check it and get back to you.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Your name</span>
          <input
            name="affiliate_name"
            required
            className="rounded border px-3 py-2"
            placeholder="Jane Doe"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Your email</span>
          <input
            name="affiliate_email"
            type="email"
            required
            className="rounded border px-3 py-2"
            placeholder="jane@example.com"
          />
        </label>
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
          <input
            name="ad_image"
            type="file"
            accept=".jpg,.jpeg,image/jpeg"
            required
            className="rounded border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={sending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {sending ? "Sending..." : "Submit ad"}
        </button>
      </form>
      {message && <p className="text-sm">{message}</p>}
      <a href="/login" className="text-sm text-zinc-500 underline">
        Reviewer login
      </a>
    </main>
  );
}
