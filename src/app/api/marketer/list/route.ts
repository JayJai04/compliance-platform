import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MARKETER_COOKIE_NAME, verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";

export async function GET() {
  const store = await cookies();
  const token = await verifyToken(store.get(MARKETER_COOKIE_NAME)?.value);
  if (!token || token.role !== "marketer" || !token.email) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("submissions")
    .select("id, created_at, affiliate_name, product, status, reviewer_note, reviewed_at")
    .ilike("affiliate_email", token.email)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: "Could not load ads." }, { status: 500 });
  }
  return NextResponse.json({ items: data, email: token.email });
}
