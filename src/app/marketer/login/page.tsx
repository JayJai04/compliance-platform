"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MarketerLoginPage() {
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/marketer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    if (res.ok) {
      router.push("/marketer");
    } else {
      setMessage("Wrong login.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Marketer login</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded border px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Log in
        </button>
      </form>
      {message && <p className="text-sm">{message}</p>}
      <Link href="/marketer/signup" className="text-sm text-zinc-500 underline">
        No account? Sign up
      </Link>
    </main>
  );
}
