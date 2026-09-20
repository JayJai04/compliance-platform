import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_COOKIE_NAME, MARKETER_COOKIE_NAME } from "./src/lib/auth";

async function roleFor(request: NextRequest, cookieName: string): Promise<string | null> {
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/login" || path === "/marketer/signup") {
    return NextResponse.next();
  }
  if (path === "/") {
    const adminRole = await roleFor(request, ADMIN_COOKIE_NAME);
    if (adminRole === "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    const marketerRole = await roleFor(request, MARKETER_COOKIE_NAME);
    if (marketerRole === "marketer") {
      return NextResponse.redirect(new URL("/marketer", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (path.startsWith("/dashboard") || path.startsWith("/review")) {
    const role = await roleFor(request, ADMIN_COOKIE_NAME);
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }
  if (path.startsWith("/marketer")) {
    const role = await roleFor(request, MARKETER_COOKIE_NAME);
    if (role !== "marketer") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/review/:path*", "/marketer/:path*"],
};
