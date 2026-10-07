import { SignJWT, jwtVerify } from "jose";
import { Role } from "@prisma/client";

export interface AuthTokenPayload {
  sub: string;             // User ID
  email: string;
  role: Role;
  companyId: string;
  branchId?: string | null;
  departmentId?: string | null;
  employeeId?: string | null;
  name?: string | null;
}

const JWT_SECRET_STRING = process.env.JWT_SECRET || "digisail_hrm_default_dev_secret_2026_change_in_prod";
const encodedKey = new TextEncoder().encode(JWT_SECRET_STRING);

export const AUTH_COOKIE_NAME = "digisail_session";
export const TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function signToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as AuthTokenPayload;
  } catch (error) {
    return null;
  }
}
