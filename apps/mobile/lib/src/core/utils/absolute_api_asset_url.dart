/// Origin without `/api/v1` — e.g. `https://studyzhouse.com`.
String apiOriginFromBaseUrl(String apiBaseUrl) {
  var trimmed = apiBaseUrl.trim();
  while (trimmed.endsWith("/")) {
    trimmed = trimmed.substring(0, trimmed.length - 1);
  }
  const suffix = "/api/v1";
  if (trimmed.endsWith(suffix)) {
    return trimmed.substring(0, trimmed.length - suffix.length);
  }
  final uri = Uri.parse(trimmed);
  return uri.origin;
}

String _normalizeAssetPath(String path) {
  var p = path.trim();
  if (p.startsWith("uploads/")) {
    p = "/api/v1/$p";
  } else if (p.startsWith("api/v1/")) {
    p = "/$p";
  } else if (!p.startsWith("/")) {
    p = "/$p";
  }
  return p;
}

/// يعيد رابط API المناسب للمحاكي/الجهاز عند حفظ `localhost` في قاعدة البيانات.
Uri _rewriteLocalDevHost(Uri url, String apiBaseUrl) {
  const localHosts = {"localhost", "127.0.0.1", "0.0.0.0"};
  if (!localHosts.contains(url.host.toLowerCase())) return url;

  final apiUri = Uri.parse(apiOriginFromBaseUrl(apiBaseUrl));
  return url.replace(
    host: apiUri.host.isEmpty ? url.host : apiUri.host,
    port: apiUri.hasPort ? apiUri.port : url.port,
    scheme: apiUri.scheme.isEmpty ? url.scheme : apiUri.scheme,
  );
}

/// مسار رفع غلاف كورس — يُستخرج من أي host (مثلاً studyzhouse.com في التطوير).
final RegExp _courseThumbnailUploadPath = RegExp(
  r"/api/v1/uploads/course-thumbnails/[a-zA-Z0-9-]+\.(?:jpg|jpeg|png|webp)",
  caseSensitive: false,
);

String? _extractCourseThumbnailPath(String raw) {
  final match = _courseThumbnailUploadPath.firstMatch(raw);
  return match?.group(0);
}

/// Resolves relative upload paths to absolute URLs for [CachedNetworkImage].
String? absoluteApiAssetUrl(String? pathOrUrl, {required String apiBaseUrl}) {
  if (pathOrUrl == null || pathOrUrl.trim().isEmpty) return null;
  final raw = pathOrUrl.trim();

  final uploadPath = _extractCourseThumbnailPath(raw);
  if (uploadPath != null) {
    final origin = apiOriginFromBaseUrl(apiBaseUrl);
    return "$origin$uploadPath";
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    final uri = Uri.tryParse(raw);
    if (uri == null) return raw;
    return _rewriteLocalDevHost(uri, apiBaseUrl).toString();
  }

  final origin = apiOriginFromBaseUrl(apiBaseUrl);
  final path = _normalizeAssetPath(raw);
  return "$origin$path";
}
