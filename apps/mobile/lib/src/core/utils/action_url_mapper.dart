/// Maps API notification `actionUrl` (web paths) to mobile go_router paths.
String? mapActionUrlToMobileRoute(String? actionUrl) {
  if (actionUrl == null || actionUrl.trim().isEmpty) return null;
  var path = actionUrl.trim();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return null;
  }
  if (!path.startsWith("/")) path = "/$path";

  if (path.startsWith("/learn/")) return path;
  if (path == "/student/my-courses" || path == "/my-courses") {
    return "/my-courses";
  }
  if (path == "/student/purchases" || path == "/purchases") {
    return "/purchases";
  }
  if (path == "/student/saved" || path == "/saved") return "/saved";
  if (path == "/student/redeem" || path == "/redeem") return "/redeem";
  if (path == "/student/notifications" || path == "/notifications") {
    return "/notifications";
  }
  if (path.startsWith("/courses/")) return path;
  if (path == "/student/explore" || path == "/courses") return "/courses";

  return path.startsWith("/student/") ? null : path;
}

bool isExternalUrl(String url) {
  return url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("mailto:");
}
