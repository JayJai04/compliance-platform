import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { MARKETER_COOKIE_NAME, cookieHeader, signToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const affiliate_name = String(body?.affiliate_name ?? "").trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const supabase = getSupabase();
  const password_hash = await hash(password, 10);
  const { error } = await supabase
    .from("marketer_users")
    .insert({ email, password_hash, affiliate_name: affiliate_name || null });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email already registered. Log in instead." }, { status: 409 });
    }
    return NextResponse.json({ error: "Signup failed." }, { status: 500 });
  }

  const token = await signToken({ sub: email, role: "marketer", email });
  const res = NextResponse.json({ ok: true, email });
  res.headers.set("Set-Cookie", cookieHeader(MARKETER_COOKIE_NAME, token));
  return res;
}
