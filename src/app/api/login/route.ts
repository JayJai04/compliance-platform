import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import {
  ADMIN_COOKIE_NAME,
  MARKETER_COOKIE_NAME,
  clearCookieHeader,
  cookieHeader,
  signToken,
} from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let identifier = "";
  let password = "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    identifier = String(body?.identifier ?? body?.username ?? body?.email ?? "").trim();
    password = String(body?.password ?? "");
  } else {
    const form = await request.formData().catch(() => null);
    identifier = String(form?.get("identifier") ?? form?.get("username") ?? form?.get("email") ?? "").trim();
    password = String(form?.get("password") ?? "");
  }
  if (!identifier || !password) {
    return NextResponse.json({ error: "Wrong login." }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getSupabase();
  } catch (e) {
    console.error("[login] supabase client failed", e);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("username, password_hash")
    .eq("username", identifier)
    .single();
  if (admin && (await compare(password, admin.password_hash))) {
    const token = await signToken({ sub: admin.username, role: "admin" });
    const res = NextResponse.json({ ok: true, role: "admin" });
    res.headers.set("Set-Cookie", cookieHeader(ADMIN_COOKIE_NAME, token));
    res.headers.append("Set-Cookie", clearCookieHeader(MARKETER_COOKIE_NAME));
    return res;
  }

  const email = identifier.toLowerCase();
  const { data: marketer } = await supabase
    .from("marketer_users")
    .select("email, password_hash")
    .eq("email", email)
    .single();
  if (marketer && (await compare(password, marketer.password_hash))) {
    const token = await signToken({ sub: marketer.email, role: "marketer", email: marketer.email });
    const res = NextResponse.json({ ok: true, role: "marketer", email: marketer.email });
    res.headers.set("Set-Cookie", cookieHeader(MARKETER_COOKIE_NAME, token));
    res.headers.append("Set-Cookie", clearCookieHeader(ADMIN_COOKIE_NAME));
    return res;
  }

  return NextResponse.json({ error: "Wrong login." }, { status: 401 });
}
