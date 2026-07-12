import "package:flutter/material.dart";

import "../../../core/platform/ios_course_policy.dart";
import "../../../core/platform/platform_purchase_policy.dart";
import "../../../core/theme/app_colors.dart";
import "../../../core/widgets/account_page_header.dart";
import "../../../core/widgets/app_card.dart";

/// Neutral block screen for courses unavailable on iOS (no payment or external links).
class IosPaidCourseBlockedView extends StatelessWidget {
  const IosPaidCourseBlockedView({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AccountPageHeader(
            title: IosCoursePolicy.paidCourseBlockedTitle,
            description: PlatformPurchasePolicy.iosBlockedFeatureDescription,
          ),
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
                    IosCoursePolicy.paidCourseBlockedMessage,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
