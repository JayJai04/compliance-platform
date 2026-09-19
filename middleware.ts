import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME } from "./src/lib/session";

export function middleware(request: NextRequest) {
  const hasCookie = Boolean(request.cookies.get(COOKIE_NAME)?.value);
  if (!hasCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/review/:path*"],
};
