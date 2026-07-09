import "dart:convert";

/// Client-side JWT expiry helpers (no signature verification).
abstract final class JwtUtils {
  static DateTime? expiresAt(String token) {
    final payload = _decodePayload(token);
    if (payload == null) return null;
    final exp = payload["exp"];
    if (exp is int) {
      return DateTime.fromMillisecondsSinceEpoch(exp * 1000, isUtc: true);
    }
    if (exp is num) {
      return DateTime.fromMillisecondsSinceEpoch(exp.toInt() * 1000, isUtc: true);
    }
    return null;
  }

  static bool isExpired(String token, {Duration clockSkew = const Duration(seconds: 30)}) {
    final expiry = expiresAt(token);
    if (expiry == null) return false;
    return DateTime.now().toUtc().add(clockSkew).isAfter(expiry);
  }

  static Map<String, dynamic>? _decodePayload(String token) {
    try {
      final parts = token.split(".");
      if (parts.length != 3) return null;
      final normalized = base64Url.normalize(parts[1]);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final json = jsonDecode(decoded);
      return json is Map<String, dynamic> ? json : null;
    } catch (_) {
      return null;
    }
  }
}
