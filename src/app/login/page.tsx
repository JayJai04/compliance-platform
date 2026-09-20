"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSending(true);
    try {
      const form = new FormData(event.currentTarget);
      const res = await fetch("/api/login", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(data.role === "admin" ? "/dashboard" : "/marketer");
      } else {
        setMessage("Wrong login.");
      }
    } catch {
      setMessage("Wrong login.");
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
          <CardTitle>Log in</CardTitle>
          <CardDescription>Reviewers and marketers use the same login.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Username or email</span>
              <Input name="identifier" required autoComplete="username" placeholder="admin or you@example.com" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Password</span>
              <Input name="password" type="password" required autoComplete="current-password" />
            </label>
            {message && <p className="text-sm text-destructive">{message}</p>}
            <Button type="submit" disabled={sending}>
              {sending ? "Logging in..." : "Log in"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/marketer/signup" className="font-medium text-primary underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
