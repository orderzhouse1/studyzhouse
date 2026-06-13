import "package:flutter/material.dart";

import "../theme/app_colors.dart";

class AppScreen extends StatelessWidget {
  const AppScreen({
    required this.child,
    super.key,
    this.title,
    this.actions,
    this.padding = const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
    this.scrollable = true,
    this.showAppBar = false,
    this.dark = false,
  });

  final Widget child;
  final String? title;
  final List<Widget>? actions;
  final EdgeInsetsGeometry padding;
  final bool scrollable;
  final bool showAppBar;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final body = Padding(
      padding: padding,
      child: scrollable ? SingleChildScrollView(child: child) : child,
    );

    return Scaffold(
      backgroundColor: dark ? AppColors.canvasDark : AppColors.background,
      appBar: showAppBar && title != null
          ? AppBar(
              title: Text(
                title!,
                style: TextStyle(
                  color: dark ? AppColors.textOnDark : AppColors.textPrimary,
                ),
              ),
              actions: actions,
              backgroundColor: dark ? AppColors.navyMid : AppColors.surface,
              foregroundColor:
                  dark ? AppColors.textOnDark : AppColors.textPrimary,
              elevation: 0,
            )
          : null,
      body: SafeArea(child: body),
    );
  }
}
