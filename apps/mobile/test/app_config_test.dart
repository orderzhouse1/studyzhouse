import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/config/app_config.dart";

void main() {
  test("default API base URL is production HTTPS", () {
    expect(AppConfig.defaultApiBaseUrl, "https://studyzhouse.com/api/v1");
  });

  test("constructor trims trailing slashes", () {
    final config = AppConfig(apiBaseUrl: "https://example.com/api/v1/");
    expect(config.apiBaseUrl, "https://example.com/api/v1");
    expect(config.usesHttps, isTrue);
  });

  test("normalizeApiBaseUrl falls back when empty", () {
    expect(AppConfig.normalizeApiBaseUrl(""), AppConfig.defaultApiBaseUrl);
    expect(AppConfig.normalizeApiBaseUrl("   "), AppConfig.defaultApiBaseUrl);
  });

  test("resolve uses production when dotenv empty", () {
    final config = AppConfig.resolve();
    expect(config.apiBaseUrl, contains("studyzhouse.com"));
    expect(config.apiBaseUrl, endsWith("/api/v1"));
    expect(config.usesHttps, isTrue);
  });
}
