import "package:flutter/material.dart";

import "app_button.dart";

class ResendOtpButton extends StatelessWidget {
  const ResendOtpButton({
    required this.cooldownSeconds,
    required this.isLoading,
    required this.onResend,
    super.key,
  });

  final int cooldownSeconds;
  final bool isLoading;
  final VoidCallback? onResend;

  @override
  Widget build(BuildContext context) {
    final canResend = cooldownSeconds <= 0 && !isLoading;
    final label = cooldownSeconds > 0
        ? "إعادة الإرسال ($cooldownSeconds)"
        : "إعادة إرسال الرمز";

    return AppButton(
      label: label,
      variant: AppButtonVariant.text,
      isLoading: isLoading,
      onPressed: canResend ? onResend : null,
    );
  }
}
