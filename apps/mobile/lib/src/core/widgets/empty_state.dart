import "package:flutter/material.dart";

import "../theme/app_colors.dart";

class EmptyState extends StatelessWidget {
  const EmptyState({
    required this.title,
    super.key,
    this.subtitle,
    this.icon = Icons.inbox_outlined,
    this.onDark = false,
  });

  final String title;
  final String? subtitle;
  final IconData icon;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final titleStyle = onDark
        ? const TextStyle(
            color: AppColors.textOnDark,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          )
        : Theme.of(context).textTheme.titleLarge;
    final subtitleStyle = onDark
        ? const TextStyle(color: AppColors.textOnDarkMuted, fontSize: 14)
        : Theme.of(context).textTheme.bodyMedium;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 56,
              color: onDark
                  ? AppColors.textOnDarkMuted
                  : Theme.of(context).colorScheme.outline,
            ),
            const SizedBox(height: 16),
            Text(title, textAlign: TextAlign.center, style: titleStyle),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: subtitleStyle,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
