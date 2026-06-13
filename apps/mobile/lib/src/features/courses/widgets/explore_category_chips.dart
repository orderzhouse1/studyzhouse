import "package:flutter/material.dart";

import "../../../core/theme/app_colors.dart";
import "../../home/utils/category_chip_style.dart";
import "../models/category.dart";

class ExploreCategoryChips extends StatelessWidget {
  const ExploreCategoryChips({
    required this.categories,
    required this.selectedSlug,
    required this.onSelected,
    super.key,
  });

  final List<Category> categories;
  final String? selectedSlug;
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 46,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: categories.length + 1,
        separatorBuilder: (context, index) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          if (index == 0) {
            return _AllChip(
              selected: selectedSlug == null,
              onTap: () => onSelected(null),
            );
          }
          final category = categories[index - 1];
          final style = categoryChipStyleFor(category.slug);
          final selected = selectedSlug == category.slug;

          return GestureDetector(
            onTap: () => onSelected(category.slug),
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: style.gradient,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: selected ? AppColors.navy : style.borderColor,
                  width: selected ? 2 : 1,
                ),
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
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
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

class _AllChip extends StatelessWidget {
  const _AllChip({required this.selected, required this.onTap});

  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.navy : AppColors.surfaceMuted,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: selected ? AppColors.navy : AppColors.border,
          ),
        ),
        child: Text(
          "الكل",
          style: TextStyle(
            color: selected ? AppColors.textOnNavy : AppColors.navy,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
