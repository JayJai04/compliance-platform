import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/supabase/server";
import { fakeCheck } from "@/lib/check";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const affiliate_name = String(form.get("affiliate_name") ?? "").trim();
    const affiliate_email = String(form.get("affiliate_email") ?? "").trim();
    const product = String(form.get("product") ?? "").trim();
    const file = form.get("ad_image");

    if (!affiliate_name || !affiliate_email || !product) {
      return NextResponse.json({ error: "Name, email, and product are required." }, { status: 400 });
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

    const supabase = getSupabase();
    const id = randomUUID();
    const path = `${id}.jpg`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("ads")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }

    const ai_result = fakeCheck();

    const { error: insertError } = await supabase.from("submissions").insert({
      id,
      affiliate_name,
      affiliate_email,
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
