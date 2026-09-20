import { createClient } from "@supabase/supabase-js";
import { hash } from "bcryptjs";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.ADMIN_INITIAL_PASSWORD;

if (!url || !key || !password) {
  console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and ADMIN_INITIAL_PASSWORD.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const password_hash = await hash(password, 10);
const { error } = await supabase
  .from("users")
  .upsert({ identifier: "admin", role: "admin", email: null, password_hash }, { onConflict: "identifier" });

if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}
console.log("Admin user 'admin' ready.");
