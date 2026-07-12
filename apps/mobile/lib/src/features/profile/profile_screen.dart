import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../core/auth/current_user_provider.dart";
import "../../core/platform/ios_course_policy.dart";
import "../../core/platform/platform_purchase_policy.dart";
import "../../core/theme/app_colors.dart";
import "../../core/widgets/app_button.dart";
import "../auth/auth_repository.dart";
import "../utilities/repositories/student_utilities_repository.dart";
import "widgets/profile_page_header.dart";

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    await ref.read(authRepositoryProvider).logout();
    if (context.mounted) context.go("/login");
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final unreadAsync = ref.watch(notificationsUnreadProvider);
    final unread = unreadAsync.whenOrNull(data: (c) => c > 0 ? c : null);

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          ProfilePageHeader(user: user),
          const SizedBox(height: 20),
          const _SectionLabel(title: "التعلّم"),
          _ProfileMenuTile(
            icon: Icons.school_outlined,
            label: "دوراتي",
            onTap: () => context.go("/my-courses"),
          ),
          if (IosCoursePolicy.showExploreCatalog)
            _ProfileMenuTile(
              icon: Icons.menu_book_outlined,
              label: "استكشف الدورات",
              onTap: () => context.go("/courses"),
            ),
          _ProfileMenuTile(
            icon: Icons.bookmark_outline,
            label: "المحفوظات",
            onTap: () => context.push("/saved"),
          ),
          if (PlatformPurchasePolicy.showExternalPaymentFlows) ...[
            _ProfileMenuTile(
              icon: Icons.vpn_key_outlined,
              label: "تفعيل كورس",
              onTap: () => context.push("/redeem"),
            ),
          ],
          const SizedBox(height: 8),
          const _SectionLabel(title: "الحساب"),
          _ProfileMenuTile(
            icon: Icons.person_outline,
            label: "الملف الشخصي",
            onTap: () => context.push("/profile/edit"),
          ),
          if (PlatformPurchasePolicy.showExternalPaymentFlows)
            _ProfileMenuTile(
              icon: Icons.payments_outlined,
              label: "مشترياتي وطلبات الدفع",
              onTap: () => context.push("/purchases"),
            ),
          _ProfileMenuTile(
            icon: Icons.notifications_outlined,
            label: "الإشعارات",
            badge: unread,
            onTap: () => context.push("/notifications"),
          ),
          _ProfileMenuTile(
            icon: Icons.settings_outlined,
            label: "الإعدادات",
            onTap: () => context.push("/settings"),
          ),
          const SizedBox(height: 8),
          const _SectionLabel(title: "الدعم"),
          _ProfileMenuTile(
            icon: Icons.help_outline,
            label: "مركز التعليمات",
            onTap: () => context.push("/help"),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
            child: AppButton(
              label: "تسجيل الخروج",
              variant: AppButtonVariant.secondary,
              icon: Icons.logout_rounded,
              onPressed: () => _logout(context, ref),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: Text(
        title,
        style: const TextStyle(
          color: AppColors.navy,
          fontSize: 15,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _ProfileMenuTile extends StatelessWidget {
  const _ProfileMenuTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.badge,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final int? badge;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(16),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [AppColors.navy, Color(0xFF1E2D4A)],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: AppColors.textOnDark, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (badge != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.orange,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      badge! > 99 ? "99+" : "$badge",
                      style: const TextStyle(
                        color: AppColors.textOnNavy,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                ],
                const Icon(
                  Icons.chevron_left,
                  color: AppColors.orange,
                  size: 22,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
