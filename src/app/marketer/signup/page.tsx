"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function MarketerSignupPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSending(true);
    try {
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
    } catch {
      setMessage("Signup failed.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">ClearPath Compliance</p>
          <p className="text-xs text-muted-foreground">Ad review for ClearPath Financial</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Marketer signup</CardTitle>
          <CardDescription>Create an account to submit ads for review.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Your name</span>
              <Input name="affiliate_name" placeholder="Jane Doe" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Email</span>
              <Input name="email" type="email" required autoComplete="email" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Password (min 8 characters)</span>
              <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
            </label>
            {message && <p className="text-sm text-destructive">{message}</p>}
            <Button type="submit" disabled={sending}>
              {sending ? "Creating account..." : "Sign up"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline underline-offset-4">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
