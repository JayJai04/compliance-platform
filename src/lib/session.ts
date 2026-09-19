import { createHmac, timingSafeEqual } from "crypto";

export const COOKIE_NAME = "cp_reviewer";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Missing SESSION_SECRET");
  return s;
}

export function createSessionValue(): string {
  const expiry = String(Date.now() + MAX_AGE * 1000);
  const sig = createHmac("sha256", secret()).update(expiry).digest("base64url");
  return `${expiry}.${sig}`;
}

export function verifySessionValue(value: string | undefined): boolean {
  if (!value) return false;
  const [expiry, sig] = value.split(".");
  if (!expiry || !sig) return false;
  if (Number(expiry) < Date.now()) return false;
  const expected = createHmac("sha256", secret()).update(expiry).digest("base64url");
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function sessionCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${createSessionValue()}; HttpOnly; Path=/${secure}; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}
