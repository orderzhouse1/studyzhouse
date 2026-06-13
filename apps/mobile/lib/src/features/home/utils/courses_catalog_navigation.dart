import "package:flutter/material.dart";
import "package:go_router/go_router.dart";

/// يفتح تبويب الدورات مع فلتر التصنيف (إن وُجد).
void openCoursesCatalog(BuildContext context, {String? categorySlug}) {
  final slug = categorySlug?.trim();
  if (slug == null || slug.isEmpty) {
    context.go("/courses");
    return;
  }
  context.go(
    Uri(
      path: "/courses",
      queryParameters: {"categorySlug": slug},
    ).toString(),
  );
}
