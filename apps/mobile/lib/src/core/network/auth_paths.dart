/// Public auth endpoints — no Bearer token attached; 401 does not clear session.
bool isPublicAuthPath(String path) {
  const public = [
    "/auth/login",
    "/auth/signup/request-otp",
    "/auth/signup/verify-otp",
    "/auth/signup/resend-otp",
    "/auth/forgot-password/request-otp",
    "/auth/forgot-password/verify-otp",
    "/auth/forgot-password/resend-otp",
  ];
  for (final p in public) {
    if (path.contains(p)) return true;
  }
  return false;
}

bool shouldHandleUnauthorized401(String path, int? statusCode) {
  if (statusCode != 401) return false;
  return !isPublicAuthPath(path);
}
