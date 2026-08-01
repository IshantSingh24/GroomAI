import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/sign-in", "/sign-up"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes and Next.js internals
  if (
    PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for JWT token stored in cookie
  const token = req.cookies.get("groomai_token")?.value;
  if (!token) {
    const signInUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)" ],
};
