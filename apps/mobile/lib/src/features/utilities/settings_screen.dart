import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:url_launcher/url_launcher.dart";

import "../../core/auth/current_user_provider.dart";
import "../../core/constants/legal_urls.dart";
import "../../core/network/api_exception.dart";
import "../../core/theme/app_colors.dart";
import "../../core/widgets/account_page_header.dart";
import "../../core/widgets/app_button.dart";
import "../../core/widgets/app_card.dart";
import "../../core/widgets/app_screen.dart";
import "../../core/widgets/legal_link_row.dart";
import "../auth/auth_repository.dart";
import "repositories/student_utilities_repository.dart";

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _deactivating = false;

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _logout(BuildContext context) async {
    await ref.read(authRepositoryProvider).logout();
    if (context.mounted) context.go("/login");
  }

  Future<void> _showDeleteAccountFlow() async {
    final firstConfirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text("تأكيد حذف الحساب"),
          content: const Text(
            "هل أنت متأكد أنك تريد حذف حسابك؟ سيتم تعطيل حسابك وتسجيل خروجك من التطبيق. يمكنك التواصل مع الإدارة لاحقًا لطلب استعادة الحساب.",
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text("إلغاء"),
            ),
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text("متابعة"),
            ),
          ],
        );
      },
    );

    if (firstConfirmed != true || !mounted) return;

    final confirmController = TextEditingController();
    final typedConfirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final canConfirm = confirmController.text.trim() == "حذف";
            return AlertDialog(
              title: const Text("تأكيد نهائي"),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    "لتأكيد التعطيل، اكتب «حذف» في الحقل أدناه:",
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: confirmController,
                    textAlign: TextAlign.center,
                    decoration: const InputDecoration(
                      hintText: "حذف",
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (_) => setDialogState(() {}),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: const Text("إلغاء"),
                ),
                TextButton(
                  onPressed: canConfirm
                      ? () => Navigator.of(dialogContext).pop(true)
                      : null,
                  child: const Text("نعم، حذف الحساب"),
                ),
              ],
            );
          },
        );
      },
    );

    confirmController.dispose();

    if (typedConfirmed != true || !mounted) return;

    setState(() => _deactivating = true);
    try {
      await ref
          .read(studentUtilitiesRepositoryProvider)
          .deactivateAccount();
      await ref.read(authRepositoryProvider).logout();
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) {
          return AlertDialog(
            content: const Text(
              "تم تعطيل حسابك بنجاح. يمكنك التواصل مع الإدارة لاستعادته لاحقًا.",
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: const Text("حسنًا"),
              ),
            ],
          );
        },
      );
      if (!mounted) return;
      context.go("/login");
    } on ApiException {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("تعذر حذف الحساب الآن، يرجى المحاولة لاحقًا."),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("تعذر حذف الحساب الآن، يرجى المحاولة لاحقًا."),
        ),
      );
    } finally {
      if (mounted) setState(() => _deactivating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  "حذف الحساب والبيانات",
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: AppColors.error,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  "يمكنك إغلاق حسابك وتعطيله. بعد التأكيد سيتم تسجيل خروجك ولن تتمكن من استخدام الحساب إلا بعد التواصل مع الإدارة لإعادة تفعيله.",
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.5,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => _openUrl(LegalUrls.accountDeletion),
                  child: const Text("تفاصيل حذف الحساب على الموقع"),
                ),
                const SizedBox(height: 8),
                AppButton(
                  label: "حذف الحساب",
                  variant: AppButtonVariant.secondary,
                  isLoading: _deactivating,
                  onPressed: _deactivating ? null : _showDeleteAccountFlow,
                ),
              ],
            ),
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
            onPressed: () => _logout(context),
          ),
        ],
      ),
    );
  }
}
