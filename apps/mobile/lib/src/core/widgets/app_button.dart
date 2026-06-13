import "package:flutter/material.dart";

enum AppButtonVariant { primary, secondary, text }

class AppButton extends StatelessWidget {
  const AppButton({
    required this.label,
    required this.onPressed,
    super.key,
    this.isLoading = false,
    this.variant = AppButtonVariant.primary,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final AppButtonVariant variant;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final child = isLoading
        ? const SizedBox(
            height: 22,
            width: 22,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        : Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 20),
                const SizedBox(width: 8),
              ],
              Text(label),
            ],
          );

    final disabled = onPressed == null || isLoading;

    switch (variant) {
      case AppButtonVariant.primary:
        return FilledButton(
          onPressed: disabled ? null : onPressed,
          child: child,
        );
      case AppButtonVariant.secondary:
        return OutlinedButton(
          onPressed: disabled ? null : onPressed,
          child: child,
        );
      case AppButtonVariant.text:
        return TextButton(onPressed: disabled ? null : onPressed, child: child);
    }
  }
}
