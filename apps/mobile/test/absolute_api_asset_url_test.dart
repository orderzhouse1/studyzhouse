import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/utils/absolute_api_asset_url.dart";

void main() {
  const apiBase = "https://studyzhouse.com/api/v1";

  test("apiOrigin strips /api/v1", () {
    expect(apiOriginFromBaseUrl(apiBase), "https://studyzhouse.com");
  });

  test("absolute URL for relative upload path", () {
    expect(
      absoluteApiAssetUrl("/api/v1/uploads/course.png", apiBaseUrl: apiBase),
      "https://studyzhouse.com/api/v1/uploads/course.png",
    );
  });

  test("returns https URLs unchanged", () {
    const url = "https://cdn.example.com/a.png";
    expect(absoluteApiAssetUrl(url, apiBaseUrl: apiBase), url);
  });

  test("null returns null", () {
    expect(absoluteApiAssetUrl(null, apiBaseUrl: apiBase), isNull);
  });

  test("uploads path without api prefix", () {
    expect(
      absoluteApiAssetUrl(
        "uploads/course-thumbnails/abc.png",
        apiBaseUrl: "http://10.0.2.2:4000/api/v1",
      ),
      "http://10.0.2.2:4000/api/v1/uploads/course-thumbnails/abc.png",
    );
  });

  test("rewrites localhost to api host for emulator", () {
    expect(
      absoluteApiAssetUrl(
        "http://localhost:4000/api/v1/uploads/course-thumbnails/x.png",
        apiBaseUrl: "http://10.0.2.2:4000/api/v1",
      ),
      "http://10.0.2.2:4000/api/v1/uploads/course-thumbnails/x.png",
    );
  });

  test("rewrites production upload URL to configured API host", () {
    expect(
      absoluteApiAssetUrl(
        "https://studyzhouse.com/api/v1/uploads/course-thumbnails/7c0933d5-fa36-4a76-96f9-5249d59f4ac2.png",
        apiBaseUrl: "http://10.0.2.2:4000/api/v1",
      ),
      "http://10.0.2.2:4000/api/v1/uploads/course-thumbnails/7c0933d5-fa36-4a76-96f9-5249d59f4ac2.png",
    );
  });
}
