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

  const { data: user } = await supabase
    .from("users")
    .select("identifier, role, email, password_hash")
    .eq("identifier", identifier)
    .single();
  if (!user || !(await compare(password, user.password_hash))) {
    if (identifier.includes("@")) {
      const { data: byEmail } = await supabase
        .from("users")
        .select("identifier, role, email, password_hash")
        .eq("email", identifier.toLowerCase())
        .single();
      if (byEmail && (await compare(password, byEmail.password_hash))) {
        return await sessionFor(byEmail);
      }
    }
    return NextResponse.json({ error: "Wrong login." }, { status: 401 });
  }
  return await sessionFor(user);
}

async function sessionFor(user: { identifier: string; role: string; email: string | null }) {
  if (user.role === "admin") {
    const token = await signToken({ sub: user.identifier, role: "admin" });
    const res = NextResponse.json({ ok: true, role: "admin" });
    res.headers.set("Set-Cookie", cookieHeader(ADMIN_COOKIE_NAME, token));
    res.headers.append("Set-Cookie", clearCookieHeader(MARKETER_COOKIE_NAME));
    return res;
  }
  if (user.role === "marketer" && user.email) {
    const token = await signToken({ sub: user.email, role: "marketer", email: user.email });
    const res = NextResponse.json({ ok: true, role: "marketer", email: user.email });
    res.headers.set("Set-Cookie", cookieHeader(MARKETER_COOKIE_NAME, token));
    res.headers.append("Set-Cookie", clearCookieHeader(ADMIN_COOKIE_NAME));
    return res;
  }
  return NextResponse.json({ error: "Wrong login." }, { status: 401 });
}
