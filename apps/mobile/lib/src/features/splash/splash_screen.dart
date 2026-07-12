import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../core/auth/current_user_provider.dart";
import "../../core/platform/ios_course_policy.dart";
import "../../core/theme/app_colors.dart";
import "../../core/widgets/brand_loading_indicator.dart";
import "../../core/widgets/error_state.dart";
import "../auth/auth_session_repository.dart";
import "../auth/models/session_validation_result.dart";

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  String? _restoreError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  Future<void> _bootstrap() async {
    setState(() => _restoreError = null);

    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;

    final sessionRepo = ref.read(authSessionRepositoryProvider);
    final result = await sessionRepo.validateSession();
    if (!mounted) return;

    switch (result) {
      case SessionValid(:final user):
        ref.read(currentUserProvider.notifier).state = user;
        context.go(IosCoursePolicy.postLoginLocation);
      case SessionNoToken():
        context.go("/login");
      case SessionNotStudent():
      case SessionNotActive():
      case SessionInvalid():
        final message = AuthSessionRepository.messageForLoginRedirect(result);
        final query = message.isNotEmpty
            ? "?message=${Uri.encodeComponent(message)}"
            : "";
        context.go("/login$query");
      case SessionRestoreFailed(:final message):
        setState(
          () => _restoreError = message ?? "تعذّر التحقق من الجلسة. حاول مرة أخرى.",
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.navy,
      body: SafeArea(
        child: Column(
          children: [
            const Spacer(),
            if (_restoreError != null)
              ErrorState(
                message: _restoreError!,
                onDark: true,
                onRetry: _bootstrap,
              )
            else
              const BrandLoadingIndicator(
                logoSize: 96,
                minHeight: 200,
                message: "جاري التحقق من الجلسة…",
              ),
            const Spacer(),
            Text(
              "STUDYZHOUSE",
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppColors.textOnDarkMuted,
                letterSpacing: 1.1,
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
