import "package:flutter/material.dart";

import "../../../core/platform/platform_purchase_policy.dart";
import "../../../core/theme/app_colors.dart";
import "../../../core/widgets/account_page_header.dart";
import "../../../core/widgets/app_card.dart";

/// Neutral in-app message when external payment / code unlock is disabled on iOS.
class IosExternalPaymentBlockedContent extends StatelessWidget {
  const IosExternalPaymentBlockedContent({
    required this.title,
    this.description,
    super.key,
  });

  final String title;
  final String? description;

  @override
  Widget build(BuildContext context) {
    final body = description ?? PlatformPurchasePolicy.iosBlockedFeatureDescription;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AccountPageHeader(title: title, description: body),
        const SizedBox(height: 20),
        AppCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.info_outline,
                color: AppColors.orange,
                size: 28,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  PlatformPurchasePolicy.paidCourseIosUnavailableLabel,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
