import "package:flutter/foundation.dart";
import "package:flutter_dotenv/flutter_dotenv.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

/// Runtime configuration — no secrets. API base URL is public.
class AppConfig {
  AppConfig({required String apiBaseUrl})
    : apiBaseUrl = normalizeApiBaseUrl(apiBaseUrl);

  /// Base URL including `/api/v1` prefix.
  final String apiBaseUrl;

  /// Production fallback when `.env` and dart-define are absent.
  static const String defaultApiBaseUrl = "https://studyzhouse.com/api/v1";

  /// True when the API uses TLS (required for production).
  bool get usesHttps => apiBaseUrl.startsWith("https://");

  /// Debug: `.env` first (edit freely). Release: `dart-define` → default production.
  static AppConfig resolve() {
    final fromEnv = _apiBaseUrlFromDotenv();
    const fromDefine = String.fromEnvironment("API_BASE_URL");
    final defineTrimmed = fromDefine.trim();

    if (kDebugMode && fromEnv != null) {
      if (defineTrimmed.isNotEmpty && defineTrimmed != fromEnv) {
        // ignore: avoid_print
        print(
          "[STUDYZHOUSE] تجاهل --dart-define في التطوير؛ استخدام .env: $fromEnv",
        );
      }
      return AppConfig(apiBaseUrl: fromEnv);
    }

    if (defineTrimmed.isNotEmpty) {
      return AppConfig(apiBaseUrl: defineTrimmed);
    }

    if (fromEnv != null) {
      return AppConfig(apiBaseUrl: fromEnv);
    }

    return AppConfig(apiBaseUrl: defaultApiBaseUrl);
  }

  static String? _apiBaseUrlFromDotenv() {
    if (!dotenv.isInitialized) return null;
    final value = dotenv.maybeGet("API_BASE_URL")?.trim();
    if (value == null || value.isEmpty) return null;
    return value;
  }

  /// Trims trailing slashes; rejects empty input by falling back to [defaultApiBaseUrl].
  static String normalizeApiBaseUrl(String url) {
    var trimmed = url.trim();
    if (trimmed.isEmpty) return defaultApiBaseUrl;
    while (trimmed.endsWith("/")) {
      trimmed = trimmed.substring(0, trimmed.length - 1);
    }
    return trimmed;
  }
}

final appConfigProvider = Provider<AppConfig>((ref) => AppConfig.resolve());
