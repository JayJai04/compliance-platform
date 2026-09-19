import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionValue } from "@/lib/session";
import { getSupabase } from "@/lib/supabase/server";

export async function GET() {
  const store = await cookies();
  if (!verifySessionValue(store.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("submissions")
    .select("id, created_at, affiliate_name, affiliate_email, product, ad_image_path, status, ai_result, reviewer_note, reviewed_at")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: "Could not load ads." }, { status: 500 });
  }
  return NextResponse.json({ items: data });
}
