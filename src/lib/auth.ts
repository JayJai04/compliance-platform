import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE_NAME = "cp_reviewer";
export const MARKETER_COOKIE_NAME = "cp_marketer";
export const COOKIE_NAME = ADMIN_COOKIE_NAME;

const MAX_AGE = 60 * 60 * 24 * 7;

export type Role = "admin" | "marketer";
export type TokenPayload = { sub: string; role: Role; email?: string };

function secretKey(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Missing SESSION_SECRET");
  return new TextEncoder().encode(s);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifyToken(value: string | undefined): Promise<TokenPayload | null> {
  if (!value) return null;
  try {
    const { payload } = await jwtVerify(value, secretKey());
    if (typeof payload.sub !== "string") return null;
    if (payload.role !== "admin" && payload.role !== "marketer") return null;
    return {
      sub: payload.sub,
      role: payload.role,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}

export function cookieHeader(name: string, token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${token}; HttpOnly; Path=/${secure}; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearCookieHeader(name: string): string {
  return `${name}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}
