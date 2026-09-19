import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionValue } from "@/lib/session";
import { getSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const store = await cookies();
  if (!verifySessionValue(store.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }
  const supabase = getSupabase();
  const { data: row } = await supabase
    .from("submissions")
    .select("ad_image_path")
    .eq("id", id)
    .single();
  if (!row) {
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
