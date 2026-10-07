import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "digisail_session";
const JWT_SECRET_STRING = process.env.JWT_SECRET || "digisail_hrm_default_dev_secret_2026_change_in_prod";
const encodedKey = new TextEncoder().encode(JWT_SECRET_STRING);

// Public route prefixes that bypass authentication
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/switch-role",
  "/favicon.ico",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow static files, Next internals, and public endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/switch-role") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Read and verify session token
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, encodedKey, { algorithms: ["HS256"] });
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // 3. If accessing /login while already authenticated, redirect to dashboard /
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // 4. If not authenticated and attempting to access protected route, redirect to /login
  if (!isAuthenticated) {
    // For API calls, return 401 JSON instead of redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Multi-Tenant Subdomain Routing
  // Extracts tenant subdomain (e.g. "apexfin" from "apexfin.digisailhrm.com" or "apexfin.localhost:3000")
  const host = req.headers.get("host") || "";
  const hostWithoutPort = host.split(":")[0];
  const parts = hostWithoutPort.split(".");

  const requestHeaders = new Headers(req.headers);

  // If subdomain exists and isn't "www" or "app" or "localhost"
  if (parts.length > 2 || (parts.length === 2 && parts[1] === "localhost")) {
    const subdomain = parts[0].toLowerCase();
    if (subdomain !== "www" && subdomain !== "app" && subdomain !== "api") {
      requestHeaders.set("x-tenant-subdomain", subdomain);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, public files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
