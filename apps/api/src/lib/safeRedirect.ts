/** Allowed post-login redirect paths (must match web safeInternalNext). */
const ALLOWED_PREFIXES = ["/student", "/admin", "/super-admin"] as const;

export function safeOAuthNext(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (!path.startsWith("/") || path.startsWith("//")) return undefined;
  const normalized = path.split("?")[0] ?? "";
  const ok = ALLOWED_PREFIXES.some(
    (p) => normalized === p || normalized.startsWith(`${p}/`),
  );
  return ok ? path : undefined;
}

export function studentHomePath(next?: string): string {
  return safeOAuthNext(next) ?? "/student";
}
