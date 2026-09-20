import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { ADMIN_COOKIE_NAME, cookieHeader, signToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const username = String(form?.get("username") ?? "").trim();
  const password = String(form?.get("password") ?? "");
  if (!username || !password) {
    return NextResponse.json({ error: "Wrong login." }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data: row } = await supabase
    .from("admin_users")
    .select("username, password_hash")
    .eq("username", username)
    .single();
  const ok = row ? await compare(password, row.password_hash) : false;
  if (!ok || !row) {
    return NextResponse.json({ error: "Wrong login." }, { status: 401 });
  }

  const token = await signToken({ sub: row.username, role: "admin" });
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", cookieHeader(ADMIN_COOKIE_NAME, token));
  return res;
}
