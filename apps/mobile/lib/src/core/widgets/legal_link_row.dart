import "package:flutter/material.dart";
import "package:url_launcher/url_launcher.dart";

import "../constants/legal_urls.dart";
import "../platform/platform_purchase_policy.dart";
import "../theme/app_colors.dart";

class LegalLinkRow extends StatelessWidget {
  const LegalLinkRow({super.key});

  Future<void> _open(BuildContext context, String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 12,
      runSpacing: 8,
      children: [
        _Link(
          label: "سياسة الخصوصية",
          onTap: () => _open(context, LegalUrls.privacy),
        ),
        _Link(label: "الشروط", onTap: () => _open(context, LegalUrls.terms)),
        if (PlatformPurchasePolicy.showExternalPaymentFlows)
          _Link(
            label: "سياسة الاسترجاع",
            onTap: () => _open(context, LegalUrls.refund),
          ),
      ],
    );
  }
}

class _Link extends StatelessWidget {
  const _Link({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onTap,
      child: Text(
        label,
        style: const TextStyle(
          color: AppColors.orange,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
