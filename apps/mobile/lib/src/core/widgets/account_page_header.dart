import "package:flutter/material.dart";

import "../theme/app_colors.dart";

class AccountPageHeader extends StatelessWidget {
  const AccountPageHeader({
    required this.title,
    super.key,
    this.eyebrow,
    this.description,
  });

  final String? eyebrow;
  final String title;
  final String? description;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (eyebrow != null)
          Text(
            eyebrow!,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: AppColors.orange,
              fontWeight: FontWeight.w600,
            ),
          ),
        if (eyebrow != null) const SizedBox(height: 6),
        Text(
          title,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        if (description != null) ...[
          const SizedBox(height: 8),
          Text(
            description!,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ],
    );
  }
}
