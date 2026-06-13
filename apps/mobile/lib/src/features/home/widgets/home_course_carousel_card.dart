import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../courses/models/course.dart";
import "../../courses/widgets/course_catalog_card.dart";

/// بطاقة أفقية في أقسام الهوم — غلاف حول [CourseCatalogCard].
class HomeCourseCarouselCard extends ConsumerWidget {
  const HomeCourseCarouselCard({required this.course, super.key});

  final Course course;

  static const double cardWidth = CourseCatalogCard.carouselWidth;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return CourseCatalogCard(
      course: course,
      width: CourseCatalogCard.carouselWidth,
    );
  }
}
