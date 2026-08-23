import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Always allow the login page so a signed-in user can switch accounts.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const adminToken = request.cookies.get("admin_token")?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname.startsWith("/rep")) {
    const repToken = request.cookies.get("roberts_rep_token")?.value;

    if (!repToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/rep/:path*"],
};