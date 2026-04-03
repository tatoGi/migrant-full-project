import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/client", "/provider", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  // Auth check disabled — will be re-enabled when Laravel backend is ready
  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/provider/:path*", "/admin/:path*"],
};
