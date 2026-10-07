import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { AUTH_COOKIE_NAME, TOKEN_EXPIRATION_SECONDS, verifyToken, AuthTokenPayload } from "./jwt";

/**
 * Retrieves the current user's session payload from cookies.
 * Supports both Server Components / Route Handlers (via cookies())
 * and Middleware (via NextRequest).
 */
export async function getSession(req?: NextRequest): Promise<AuthTokenPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  }

  if (!token) return null;
  return verifyToken(token);
}

/**
 * Attaches the auth cookie to a NextResponse.
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_EXPIRATION_SECONDS,
  });
}

/**
 * Clears the auth cookie on a NextResponse.
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Guard utility for Route Handlers:
 * Ensures the requester is authenticated and belongs to an active tenant.
 */
export async function requireAuth(req?: NextRequest): Promise<{
  session: AuthTokenPayload;
  errorResponse?: null;
} | {
  session: null;
  errorResponse: NextResponse;
}> {
  const session = await getSession(req);

  if (!session) {
    return {
      session: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized. Please log in.", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }

  return { session, errorResponse: null };
}

/**
 * Guard utility for Route Handlers:
 * Ensures the requester has at least one of the specified roles.
 */
export function requireRole(
  session: AuthTokenPayload,
  allowedRoles: Role[]
): { authorized: boolean; errorResponse?: NextResponse } {
  // SUPER_ADMIN has global override authority
  if (session.role === Role.SUPER_ADMIN || allowedRoles.includes(session.role)) {
    return { authorized: true };
  }

  return {
    authorized: false,
    errorResponse: NextResponse.json(
      {
        success: false,
        error: `Forbidden. Requires one of roles: ${allowedRoles.join(", ")}`,
        code: "FORBIDDEN",
      },
      { status: 403 }
    ),
  };
}
