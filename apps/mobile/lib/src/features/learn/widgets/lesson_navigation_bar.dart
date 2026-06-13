import "package:flutter/material.dart";

import "../../../core/widgets/app_button.dart";

class LessonNavigationBar extends StatelessWidget {
  const LessonNavigationBar({
    required this.hasPrevious,
    required this.hasNext,
    required this.onPrevious,
    required this.onNext,
    super.key,
  });

  final bool hasPrevious;
  final bool hasNext;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: AppButton(
            label: "الدرس السابق",
            variant: AppButtonVariant.secondary,
            icon: Icons.skip_previous_rounded,
            onPressed: hasPrevious ? onPrevious : null,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: AppButton(
            label: "الدرس التالي",
            icon: Icons.skip_next_rounded,
            onPressed: hasNext ? onNext : null,
          ),
        ),
      ],
    );
  }
}
