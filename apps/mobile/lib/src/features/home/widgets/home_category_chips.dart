import "package:flutter/material.dart";

import "../../courses/models/category.dart";
import "../utils/category_chip_style.dart";

class HomeCategoryChips extends StatelessWidget {
  const HomeCategoryChips({
    required this.categories,
    required this.onCategoryTap,
    super.key,
  });

  final List<Category> categories;
  final ValueChanged<String> onCategoryTap;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 46,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: categories.length,
        separatorBuilder: (context, index) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final category = categories[index];
          final style = categoryChipStyleFor(category.slug);

          return GestureDetector(
            onTap: () => onCategoryTap(category.slug),
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: style.gradient,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: style.borderColor, width: 1),
                boxShadow: [
                  BoxShadow(
                    color: style.borderColor.withValues(alpha: 0.35),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
                child: Text(
                  category.name,
                  style: TextStyle(
                    color: style.textColor,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
