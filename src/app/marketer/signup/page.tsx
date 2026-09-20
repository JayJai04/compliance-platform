"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MarketerSignupPage() {
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/marketer/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
        affiliate_name: form.get("affiliate_name"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push("/marketer");
    } else {
      setMessage(data.error ?? "Signup failed.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Marketer signup</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Your name</span>
          <input name="affiliate_name" className="rounded border px-3 py-2" placeholder="Jane Doe" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Password (min 8 characters)</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded border px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Sign up
        </button>
      </form>
      {message && <p className="text-sm">{message}</p>}
      <Link href="/login" className="text-sm text-zinc-500 underline">
        Have an account? Log in
      </Link>
    </main>
  );
}
