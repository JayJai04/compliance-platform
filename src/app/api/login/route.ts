import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { sessionCookieHeader } from "@/lib/session";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const password = String(form?.get("password") ?? "");
  const expected = process.env.REVIEWER_PASSWORD ?? "";

  if (!expected || password.length !== expected.length) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  let match = false;
  try {
    match = timingSafeEqual(Buffer.from(password), Buffer.from(expected));
  } catch {
    match = false;
  }
  if (!match) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", sessionCookieHeader());
  return res;
}
