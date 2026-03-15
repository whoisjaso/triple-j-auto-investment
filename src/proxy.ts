import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "dev-secret-triple-j";
const SESSION_MAX_AGE = 86400 * 1000; // 24 hours in ms

const intlMiddleware = createIntlMiddleware(routing);

async function verifyToken(token: string): Promise<boolean> {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;

  const timestamp = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  if (!timestamp || !signature) return false;

  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age > SESSION_MAX_AGE || age < 0) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ADMIN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expected;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes: apply auth only, skip i18n
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const token = request.cookies.get("admin-session")?.value;
    if (!token || !(await verifyToken(token))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  // Document portal: public, no i18n — skip locale routing
  if (pathname.startsWith("/documents")) {
    return NextResponse.next();
  }

  // All other matched routes: apply i18n locale routing
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except:
  // - /api, /_next, /_vercel
  // - files with dots (e.g. favicon.ico, images)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
