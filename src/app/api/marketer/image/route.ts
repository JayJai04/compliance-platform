import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MARKETER_COOKIE_NAME, verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const store = await cookies();
  const token = await verifyToken(store.get(MARKETER_COOKIE_NAME)?.value);
  if (!token || token.role !== "marketer" || !token.email) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const supabase = getSupabase();
  const { data: row } = await supabase
    .from("submissions")
    .select("ad_image_path, affiliate_email")
    .eq("id", id)
    .single();
  if (!row || row.affiliate_email.toLowerCase() !== token.email.toLowerCase()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const { data, error } = await supabase.storage
    .from("ads")
    .createSignedUrl(row.ad_image_path, 300);
  if (error || !data) {
    return NextResponse.json({ error: "Could not load image." }, { status: 500 });
  }
  return NextResponse.json({ url: data.signedUrl });
}
