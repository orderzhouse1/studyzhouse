import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/theme/app_colors.dart";
import "../../../core/utils/friendly_error_message.dart";
import "../../../core/widgets/error_state.dart";
import "../../../core/widgets/brand_loading_indicator.dart";
import "../../courses/providers/saved_course_ids_provider.dart";
import "../providers/home_discover_provider.dart";
import "../utils/courses_catalog_navigation.dart";
import "../utils/home_discover_sections.dart";
import "home_category_chips.dart";
import "home_course_carousel_section.dart";

class HomeDiscoverSection extends ConsumerStatefulWidget {
  const HomeDiscoverSection({super.key});

  @override
  ConsumerState<HomeDiscoverSection> createState() =>
      _HomeDiscoverSectionState();
}

class _HomeDiscoverSectionState extends ConsumerState<HomeDiscoverSection> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(savedCourseIdsProvider.notifier).refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(homeDiscoverProvider);

    return async.when(
      loading: () => const BrandLoadingIndicator(minHeight: 280),
      error: (e, _) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: ErrorState(
          message: userFacingErrorMessage(
            e,
            fallback: "تعذّر تحميل كتالوج الكورسات",
          ),
          onRetry: () => ref.invalidate(homeDiscoverProvider),
        ),
      ),
      data: (catalog) {
        final rows = buildHomeDiscoverRows(
          courses: catalog.courses,
          interests: catalog.interests,
        );

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Text(
                "استكشف الأصناف",
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 8),
            HomeCategoryChips(
              categories: catalog.categories,
              onCategoryTap: (slug) =>
                  openCoursesCatalog(context, categorySlug: slug),
            ),
            if (rows.isEmpty)
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 24, 16, 8),
                child: Text(
                  "لا توجد كورسات منشورة حاليًا.",
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              )
            else
              ...rows.map(
                (row) => HomeCourseCarouselSection(
                  title: row.title,
                  courses: row.courses,
                  onViewAll: () => context.go("/courses"),
                ),
              ),
            const SizedBox(height: 8),
          ],
        );
      },
    );
  }
}
