import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { MARKETER_COOKIE_NAME, cookieHeader, signToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!email || !password) {
    return NextResponse.json({ error: "Wrong login." }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data: row } = await supabase
    .from("marketer_users")
    .select("email, password_hash")
    .eq("email", email)
    .single();
  const ok = row ? await compare(password, row.password_hash) : false;
  if (!ok || !row) {
    return NextResponse.json({ error: "Wrong login." }, { status: 401 });
  }

  const token = await signToken({ sub: row.email, role: "marketer", email: row.email });
  const res = NextResponse.json({ ok: true, email: row.email });
  res.headers.set("Set-Cookie", cookieHeader(MARKETER_COOKIE_NAME, token));
  return res;
}
