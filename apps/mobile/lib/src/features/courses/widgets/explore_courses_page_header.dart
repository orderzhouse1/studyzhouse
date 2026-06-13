import "package:flutter/material.dart";
import "package:flutter/services.dart";

import "../../../core/theme/app_colors.dart";
import "../../../core/theme/app_gradients.dart";

class ExploreCoursesPageHeader extends StatelessWidget {
  const ExploreCoursesPageHeader({
    required this.searchController,
    required this.onSearch,
    this.resultsLabel,
    super.key,
  });

  final TextEditingController searchController;
  final VoidCallback onSearch;
  final String? resultsLabel;

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: ClipRRect(
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
        child: Container(
          width: double.infinity,
          decoration: const BoxDecoration(gradient: AppGradients.dashboardHero),
          child: Stack(
            clipBehavior: Clip.hardEdge,
            children: [
              Positioned(
                right: -20,
                top: 40,
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.purpleTint.withValues(alpha: 0.35),
                  ),
                ),
              ),
              Padding(
                padding: EdgeInsets.fromLTRB(20, topInset + 12, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      "الدورات",
                      style: TextStyle(
                        color: AppColors.textOnDark,
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      resultsLabel ?? "تصفّح وابحث عن دورات تناسبك",
                      style: const TextStyle(
                        color: AppColors.textOnDarkMuted,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: searchController,
                      textInputAction: TextInputAction.search,
                      onSubmitted: (_) => onSearch(),
                      style: const TextStyle(
                        color: AppColors.textOnDark,
                        fontSize: 14,
                      ),
                      decoration: InputDecoration(
                        hintText: "ابحث عن دورة…",
                        hintStyle: TextStyle(
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                        filled: true,
                        fillColor: AppColors.glassFill,
                        prefixIcon: const Icon(
                          Icons.search_rounded,
                          color: AppColors.orange,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 12,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                            color: AppColors.glassBorder,
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                            color: AppColors.glassBorder,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                            color: AppColors.orange,
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
