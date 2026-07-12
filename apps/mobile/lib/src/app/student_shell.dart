import "package:flutter/material.dart";
import "package:go_router/go_router.dart";

import "../core/platform/ios_course_policy.dart";
import "../core/theme/app_colors.dart";

/// شريط تنقّل سفلي فاتح — أسلوب تطبيقات الموبايل.
///
/// على iOS يُخفى تبويب «الدورات» (الكتالوج) بالكامل (Reader mode).
class StudentShell extends StatelessWidget {
  const StudentShell({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    final isIos = IosCoursePolicy.isIOSPlatform;
    final selectedIndex = IosCoursePolicy.navIndexForShellBranch(
      navigationShell.currentIndex,
    );

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: (index) {
          navigationShell.goBranch(
            IosCoursePolicy.shellBranchForNavIndex(index),
          );
        },
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: "الرئيسية",
          ),
          const NavigationDestination(
            icon: Icon(Icons.school_outlined),
            selectedIcon: Icon(Icons.school_rounded),
            label: "دوراتي",
          ),
          if (!isIos)
            const NavigationDestination(
              icon: Icon(Icons.menu_book_outlined),
              selectedIcon: Icon(Icons.menu_book_rounded),
              label: "الدورات",
            ),
          const NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: "حسابي",
          ),
        ],
      ),
    );
  }
}
