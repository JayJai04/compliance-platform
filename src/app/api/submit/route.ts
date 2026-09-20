import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { MARKETER_COOKIE_NAME, verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";
import { fakeCheck } from "@/lib/check";
import { runAiCheck } from "@/lib/ai-check";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const store = await cookies();
    const token = await verifyToken(store.get(MARKETER_COOKIE_NAME)?.value);
    if (!token || token.role !== "marketer" || !token.email) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const form = await request.formData();
    const product = String(form.get("product") ?? "").trim();
    const file = form.get("ad_image");

    const supabase = getSupabase();
    const { data: user } = await supabase
      .from("users")
      .select("affiliate_name")
      .eq("email", token.email)
      .single();
    const affiliate_name = user?.affiliate_name?.trim();

    if (!affiliate_name || !product) {
      return NextResponse.json({ error: "Account has no name on file." }, { status: 400 });
    }
    if (!["loan", "card", "mortgage"].includes(product)) {
      return NextResponse.json({ error: "Bad product." }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "JPG image is required." }, { status: 400 });
    }
    if (file.type !== "image/jpeg" && file.type !== "image/jpg") {
      return NextResponse.json({ error: "Only JPG files allowed." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too big. Max 5MB." }, { status: 400 });
    }

    const id = randomUUID();
    const path = `${id}.jpg`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("ads")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }

    let ai_result;
    try {
      ai_result = await runAiCheck(bytes, product);
    } catch {
      ai_result = fakeCheck();
    }

    const { error: insertError } = await supabase.from("submissions").insert({
      id,
      affiliate_name,
      affiliate_email: token.email,
      product,
      ad_image_path: path,
      status: "pending",
      ai_result,
    });

    if (insertError) {
      await supabase.storage.from("ads").remove([path]);
      return NextResponse.json({ error: "Save failed." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
