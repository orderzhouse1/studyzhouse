const ALLOWED_PREFIXES = ["/student", "/admin", "/super-admin"] as const;

export function safeInternalNext(path: string | null): string | null {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  const normalized = path.split("?")[0] ?? "";
  return ALLOWED_PREFIXES.some(
    (p) => normalized === p || normalized.startsWith(`${p}/`),
  )
    ? path
    : null;
}

export function defaultHomeForRole(role: string): string {
  if (role === "SUPER_ADMIN") return "/super-admin";
  if (role === "ADMIN") return "/admin";
  return "/student";
}
