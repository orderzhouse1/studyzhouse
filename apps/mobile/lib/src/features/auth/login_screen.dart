import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../core/platform/ios_course_policy.dart";
import "../../core/theme/app_colors.dart";
import "../../core/theme/app_gradients.dart";
import "../../core/widgets/app_button.dart";
import "../../core/widgets/app_card.dart";
import "../../core/widgets/app_text_field.dart";
import "providers/login_controller.dart";

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key, this.flashMessage});

  final String? flashMessage;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final ok = await ref
        .read(loginControllerProvider.notifier)
        .submit(
          email: _emailController.text,
          password: _passwordController.text,
        );

    if (ok && mounted) {
      context.go(IosCoursePolicy.postLoginLocation);
    }
  }

  @override
  Widget build(BuildContext context) {
    final loginState = ref.watch(loginControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 28),
                    decoration: const BoxDecoration(
                      gradient: AppGradients.dashboardHero,
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: AppColors.glassFill,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(
                            Icons.school_rounded,
                            color: AppColors.primary,
                            size: 36,
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          "مرحباً",
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 6),
                        RichText(
                          textAlign: TextAlign.center,
                          text: const TextSpan(
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                            children: [
                              TextSpan(
                                text: "أهلاً بك في ",
                                style: TextStyle(color: AppColors.textOnDark),
                              ),
                              TextSpan(
                                text: "STUDYZHOUSE",
                                style: TextStyle(color: AppColors.primary),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  "سجّل دخولك لمتابعة دوراتك",
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                if (widget.flashMessage != null &&
                    widget.flashMessage!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceMuted,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Text(
                      widget.flashMessage!,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      AppTextField(
                        controller: _emailController,
                        label: "البريد الإلكتروني",
                        hint: "name@example.com",
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.email],
                        prefixIcon: Icons.mail_outline_rounded,
                        validator: (value) {
                          final v = value?.trim() ?? "";
                          if (v.isEmpty) return "أدخل البريد الإلكتروني.";
                          if (!v.contains("@")) return "البريد غير صالح.";
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        controller: _passwordController,
                        label: "كلمة المرور",
                        obscureText: true,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.password],
                        prefixIcon: Icons.lock_outline_rounded,
                        onFieldSubmitted: (_) => _submit(),
                        validator: (value) {
                          final v = value ?? "";
                          if (v.isEmpty) return "أدخل كلمة المرور.";
                          if (v.length < 8) {
                            return "كلمة المرور 8 أحرف على الأقل.";
                          }
                          return null;
                        },
                      ),
                      if (loginState.errorMessage != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          loginState.errorMessage!,
                          style: const TextStyle(color: AppColors.error),
                          textAlign: TextAlign.center,
                        ),
                      ],
                      const SizedBox(height: 20),
                      AppButton(
                        label: "تسجيل الدخول",
                        isLoading: loginState.isLoading,
                        onPressed: loginState.isLoading ? null : _submit,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    TextButton(
                      onPressed: () => context.push("/signup"),
                      child: const Text("إنشاء حساب"),
                    ),
                    const Text("•", style: TextStyle(color: AppColors.border)),
                    TextButton(
                      onPressed: () => context.push("/forgot-password"),
                      child: const Text("نسيت كلمة المرور؟"),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
