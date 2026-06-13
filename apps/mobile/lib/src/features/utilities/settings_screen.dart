import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:url_launcher/url_launcher.dart";

import "../../core/auth/current_user_provider.dart";
import "../../core/constants/legal_urls.dart";
import "../../core/theme/app_colors.dart";
import "../../core/widgets/account_page_header.dart";
import "../../core/widgets/app_button.dart";
import "../../core/widgets/app_card.dart";
import "../../core/widgets/app_screen.dart";
import "../../core/widgets/legal_link_row.dart";
import "../auth/auth_repository.dart";

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    await ref.read(authRepositoryProvider).logout();
    if (context.mounted) context.go("/login");
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return AppScreen(
      showAppBar: true,
      title: "الإعدادات",
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AccountPageHeader(title: "الإعدادات"),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "معلومات الحساب",
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 8),
                Text(user?.fullName ?? "—"),
                Text(user?.email ?? "—"),
              ],
            ),
          ),
          const SizedBox(height: 12),
          ListTile(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: AppColors.border),
            ),
            tileColor: AppColors.surface,
            leading: const Icon(Icons.lock_outline, color: AppColors.orange),
            title: const Text("تغيير كلمة المرور"),
            trailing: const Icon(Icons.chevron_left),
            onTap: () => context.push("/forgot-password"),
          ),
          const SizedBox(height: 16),
          const LegalLinkRow(),
          const SizedBox(height: 8),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 12,
            children: [
              TextButton(
                onPressed: () => _openUrl(LegalUrls.supportEmail),
                child: const Text("تواصل مع الدعم"),
              ),
            ],
          ),
          const SizedBox(height: 24),
          AppButton(
            label: "تسجيل الخروج",
            variant: AppButtonVariant.secondary,
            onPressed: () => _logout(context, ref),
          ),
        ],
      ),
    );
  }
}
