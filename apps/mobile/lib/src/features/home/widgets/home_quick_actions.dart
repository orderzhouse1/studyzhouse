import "package:flutter/material.dart";
import "package:go_router/go_router.dart";

import "../../../core/theme/app_colors.dart";

class HomeQuickAction {
  const HomeQuickAction({
    required this.icon,
    required this.label,
    required this.route,
  });

  final IconData icon;
  final String label;
  final String route;
}

/// شبكة 3×2 بأيقونات دائرية كحلية (أسلوب المرجع).
class HomeQuickActionsGrid extends StatelessWidget {
  const HomeQuickActionsGrid({super.key});

  static const _actions = [
    HomeQuickAction(
      icon: Icons.explore_outlined,
      label: "استكشف",
      route: "/courses",
    ),
    HomeQuickAction(
      icon: Icons.school_outlined,
      label: "كورساتي",
      route: "/my-courses",
    ),
    HomeQuickAction(
      icon: Icons.bookmark_outline,
      label: "المحفوظات",
      route: "/saved",
    ),
    HomeQuickAction(
      icon: Icons.vpn_key_outlined,
      label: "تفعيل كورس",
      route: "/redeem",
    ),
    HomeQuickAction(
      icon: Icons.payments_outlined,
      label: "مشترياتي",
      route: "/purchases",
    ),
    HomeQuickAction(
      icon: Icons.help_outline,
      label: "مساعدة",
      route: "/help",
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 22, 16, 0),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: _actions.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 4,
          crossAxisSpacing: 8,
          childAspectRatio: 1.05,
        ),
        itemBuilder: (context, index) {
          return _ActionTile(action: _actions[index]);
        },
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({required this.action});

  final HomeQuickAction action;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        const shellTabs = {"/home", "/my-courses", "/courses", "/profile"};
        if (shellTabs.contains(action.route)) {
          context.go(action.route);
        } else {
          context.push(action.route);
        }
      },
      borderRadius: BorderRadius.circular(12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.navy, Color(0xFF1E2D4A)],
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.navy.withValues(alpha: 0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(action.icon, color: AppColors.textOnDark, size: 26),
          ),
          const SizedBox(height: 6),
          Text(
            action.label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.navy,
              fontSize: 11,
              fontWeight: FontWeight.w500,
              height: 1.15,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
