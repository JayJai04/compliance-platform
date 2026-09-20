import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, clearCookieHeader } from "@/lib/auth";

export async function POST() {
  const store = await cookies();
  if (!store.get(ADMIN_COOKIE_NAME)?.value) {
    return NextResponse.json({ ok: true });
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearCookieHeader(ADMIN_COOKIE_NAME));
  return res;
}
