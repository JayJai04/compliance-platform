import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
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

  const adminUser = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.REVIEWER_PASSWORD ?? "";
  if (
    adminPassword &&
    identifier === adminUser &&
    password.length === adminPassword.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword))
  ) {
    const token = await signToken({ sub: adminUser, role: "admin" });
    const res = NextResponse.json({ ok: true, role: "admin" });
    res.headers.set("Set-Cookie", cookieHeader(ADMIN_COOKIE_NAME, token));
    res.headers.append("Set-Cookie", clearCookieHeader(MARKETER_COOKIE_NAME));
    return res;
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
  let found = user && user.role === "marketer" ? user : null;
  if (!found && identifier.includes("@")) {
    const { data: byEmail } = await supabase
      .from("users")
      .select("identifier, role, email, password_hash")
      .eq("email", identifier.toLowerCase())
      .single();
    if (byEmail && byEmail.role === "marketer") found = byEmail;
  }
  if (found && found.email && (await compare(password, found.password_hash))) {
    const token = await signToken({ sub: found.email, role: "marketer", email: found.email });
    const res = NextResponse.json({ ok: true, role: "marketer", email: found.email });
    res.headers.set("Set-Cookie", cookieHeader(MARKETER_COOKIE_NAME, token));
    res.headers.append("Set-Cookie", clearCookieHeader(ADMIN_COOKIE_NAME));
    return res;
  }

  return NextResponse.json({ error: "Wrong login." }, { status: 401 });
}
