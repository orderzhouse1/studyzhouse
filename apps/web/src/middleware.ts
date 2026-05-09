import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ROLE_RULES = [
  { prefix: "/student", roles: new Set(["STUDENT"]) },
  { prefix: "/admin", roles: new Set(["ADMIN", "SUPER_ADMIN"]) },
  { prefix: "/super-admin", roles: new Set(["SUPER_ADMIN"]) },
] as const;

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const rule = ROLE_RULES.find((r) => pathname.startsWith(r.prefix));
  if (!rule) {
    return NextResponse.next();
  }

  const meUrl = new URL("/api/v1/auth/me", request.url);
  const res = await fetch(meUrl, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store",
  });

  if (!res.ok) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const json: unknown = await res.json();
  const role = extractRole(json);
  if (typeof role !== "string" || !rule.roles.has(role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

function extractRole(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const root = json as { data?: unknown };
  if (!root.data || typeof root.data !== "object") return undefined;
  const data = root.data as { user?: { role?: unknown } };
  const role = data.user?.role;
  return typeof role === "string" ? role : undefined;
}

export const config = {
  matcher: [
    "/student",
    "/student/:path*",
    "/admin",
    "/admin/:path*",
    "/super-admin",
    "/super-admin/:path*",
  ],
};
