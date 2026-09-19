import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionValue } from "@/lib/session";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const store = await cookies();
  if (!verifySessionValue(store.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "");
  const decision = String(body?.decision ?? "");
  const reviewer_note = String(body?.reviewer_note ?? "").trim();

  if (!id || !["approved", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("submissions")
    .update({ status: decision, reviewer_note: reviewer_note || null, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
