import "package:flutter/material.dart";
import "package:flutter_localizations/flutter_localizations.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../core/auth/auth_messages.dart";
import "../core/auth/session_expired_provider.dart";
import "../core/theme/app_theme.dart";
import "router.dart";

class StudyZHouseApp extends ConsumerWidget {
  const StudyZHouseApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    ref.listen<bool>(sessionExpiredProvider, (previous, next) {
      if (next) {
        ref.read(sessionExpiredProvider.notifier).state = false;
        final encoded = Uri.encodeComponent(AuthMessages.sessionExpired);
        router.go("/login?message=$encoded");
      }
    });

    return MaterialApp.router(
      title: "STUDYZHOUSE",
      debugShowCheckedModeBanner: false,
      locale: const Locale("ar"),
      supportedLocales: const [Locale("ar")],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: AppTheme.light,
      routerConfig: router,
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
