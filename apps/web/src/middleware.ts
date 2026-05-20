import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_ACCESS_COOKIE_NAME } from "@studyhouse/shared";

import { verifyAccessTokenFromCookie } from "@/lib/edge-access-token";

/**
 * Route protection uses JWT signature verification only (no DB round-trip).
 * Express continues to call requireAuth and load the user from the database for every API.
 *
 * Tradeoff: role and session validity in middleware follow the JWT until it expires;
 * revocation or role changes apply to APIs immediately but navigation may lag until re-login
 * or token expiry. See docs/MIDDLEWARE_JWT_AUTH.md.
 */

const ROLE_RULES = [
  { prefix: "/student", roles: new Set(["STUDENT"]) },
  { prefix: "/learn", roles: new Set(["STUDENT"]) },
  { prefix: "/admin", roles: new Set(["ADMIN", "SUPER_ADMIN"]) },
  { prefix: "/super-admin", roles: new Set(["SUPER_ADMIN"]) },
] as const;

/** طالب مسجّل يفتح /courses/:slug → نسخة الطالب (يسمح بـ ISR للصفحة العامة بدون cookies). */
const PUBLIC_COURSE_DETAIL = /^\/courses\/([^/]+)$/;

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const publicCourseMatch = PUBLIC_COURSE_DETAIL.exec(pathname);
  if (publicCourseMatch?.[1]) {
    const slug = publicCourseMatch[1];
    const token = request.cookies.get(AUTH_ACCESS_COOKIE_NAME)?.value;
    const auth = await verifyAccessTokenFromCookie(token);
    if (auth?.role === "STUDENT") {
      return NextResponse.redirect(
        new URL(
          `/student/courses/${encodeURIComponent(slug)}`,
          request.url,
        ),
      );
    }
    return NextResponse.next();
  }

  const rule = ROLE_RULES.find((r) => pathname.startsWith(r.prefix));
  if (!rule) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_ACCESS_COOKIE_NAME)?.value;
  const auth = await verifyAccessTokenFromCookie(token);

  if (!auth) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (!rule.roles.has(auth.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/courses/:slug",
    "/student",
    "/student/:path*",
    "/learn",
    "/learn/:path*",
    "/admin",
    "/admin/:path*",
    "/super-admin",
    "/super-admin/:path*",
  ],
};
