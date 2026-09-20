import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { MARKETER_COOKIE_NAME, cookieHeader, signToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
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

    let supabase;
    try {
      supabase = getSupabase();
    } catch (e) {
      console.error("[marketer/signup] supabase client failed", e, {
        hasUrl: Boolean(process.env.SUPABASE_URL),
        hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      });
      return NextResponse.json({ error: "Signup failed." }, { status: 500 });
    }
    const password_hash = await hash(password, 10);
    const { error } = await supabase
      .from("users")
      .insert({ identifier: email, role: "marketer", email, password_hash, affiliate_name: affiliate_name || null });
    if (error) {
      console.error("[marketer/signup] insert failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email already registered. Log in instead." }, { status: 409 });
      }
      return NextResponse.json({ error: "Signup failed." }, { status: 500 });
    }

    let token;
    try {
      token = await signToken({ sub: email, role: "marketer", email });
    } catch (e) {
      console.error("[marketer/signup] sign failed", e, {
        hasSessionSecret: Boolean(process.env.SESSION_SECRET),
      });
      return NextResponse.json({ error: "Signup failed." }, { status: 500 });
    }
    const res = NextResponse.json({ ok: true, email });
    res.headers.set("Set-Cookie", cookieHeader(MARKETER_COOKIE_NAME, token));
    return res;
  } catch (e) {
    console.error("[marketer/signup] unhandled", e);
    return NextResponse.json({ error: "Signup failed." }, { status: 500 });
  }
}
