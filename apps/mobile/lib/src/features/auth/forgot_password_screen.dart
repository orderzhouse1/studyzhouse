import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../core/auth/auth_messages.dart";
import "../../core/network/api_exception.dart";
import "../../core/theme/app_colors.dart";
import "../../core/utils/auth_validators.dart";
import "../../core/utils/otp_cooldown.dart";
import "../../core/widgets/app_button.dart";
import "../../core/widgets/app_card.dart";
import "../../core/widgets/app_screen.dart";
import "../../core/widgets/app_text_field.dart";
import "../../core/widgets/auth_form_header.dart";
import "../../core/widgets/otp_input_field.dart";
import "../../core/widgets/resend_otp_button.dart";
import "auth_repository.dart";

enum _ForgotStep { email, verify, success, emailOnly }

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  _ForgotStep _step = _ForgotStep.email;
  final _formKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  bool _loading = false;
  bool _resendLoading = false;
  String? _error;
  String? _challengeId;
  String? _storedEmail;
  late final OtpCooldown _cooldown;

  @override
  void initState() {
    super.initState();
    _cooldown = OtpCooldown(
      onTick: (_) {
        if (mounted) setState(() {});
      },
    );
  }

  @override
  void dispose() {
    _cooldown.dispose();
    _emailController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await ref
          .read(authRepositoryProvider)
          .requestForgotPasswordOtp(email: _emailController.text);
      _storedEmail = _emailController.text.trim().toLowerCase();
      if (result.hasChallenge) {
        _challengeId = result.challengeId;
        _cooldown.startFromIso(result.resendAvailableAt?.toIso8601String());
        setState(() => _step = _ForgotStep.verify);
      } else {
        setState(() => _step = _ForgotStep.emailOnly);
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = "تعذّر إرسال الطلب.");
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resendOtp() async {
    final id = _challengeId;
    final email = _storedEmail;
    if (id == null || email == null) return;
    setState(() {
      _resendLoading = true;
      _error = null;
    });
    try {
      final result = await ref
          .read(authRepositoryProvider)
          .resendForgotPasswordOtp(challengeId: id, email: email);
      _cooldown.startFromIso(result.resendAvailableAt?.toIso8601String());
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _resendLoading = false);
    }
  }

  Future<void> _verify() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final id = _challengeId;
    if (id == null) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await ref
          .read(authRepositoryProvider)
          .verifyForgotPasswordOtp(
            challengeId: id,
            code: _otpController.text,
            newPassword: _passwordController.text,
            confirmPassword: _confirmController.text,
          );
      setState(() => _step = _ForgotStep.success);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScreen(
      scrollable: true,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: IconButton(
                onPressed: () => context.pop(),
                icon: const Icon(Icons.arrow_forward_rounded),
              ),
            ),
            AuthFormHeader(
              title: switch (_step) {
                _ForgotStep.email => "نسيت كلمة المرور",
                _ForgotStep.verify => "إعادة التعيين",
                _ForgotStep.success => "تم التغيير",
                _ForgotStep.emailOnly => "تحقق من بريدك",
              },
              subtitle: switch (_step) {
                _ForgotStep.email =>
                  "أدخل بريدك وسنرسل رمز التحقق إن كان مسجّلًا",
                _ForgotStep.verify => "أدخل الرمز وكلمة المرور الجديدة",
                _ForgotStep.success => AuthMessages.forgotSuccess,
                _ForgotStep.emailOnly => AuthMessages.forgotRequestGeneric,
              },
            ),
            const SizedBox(height: 24),
            if (_step == _ForgotStep.success ||
                _step == _ForgotStep.emailOnly) ...[
              AppButton(
                label: "العودة لتسجيل الدخول",
                onPressed: () => context.go("/login"),
              ),
            ] else
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_step == _ForgotStep.email) ...[
                      AppTextField(
                        controller: _emailController,
                        label: "البريد الإلكتروني",
                        keyboardType: TextInputType.emailAddress,
                        prefixIcon: Icons.mail_outline_rounded,
                        validator: validateEmail,
                      ),
                    ],
                    if (_step == _ForgotStep.verify) ...[
                      OtpInputField(
                        controller: _otpController,
                        onSubmitted: _verify,
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        controller: _passwordController,
                        label: "كلمة المرور الجديدة",
                        obscureText: true,
                        prefixIcon: Icons.lock_outline_rounded,
                        validator: validatePassword,
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        controller: _confirmController,
                        label: "تأكيد كلمة المرور",
                        obscureText: true,
                        prefixIcon: Icons.lock_outline_rounded,
                        validator: (v) => validateConfirmPassword(
                          _passwordController.text,
                          v,
                        ),
                      ),
                    ],
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.error,
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    if (_step == _ForgotStep.email)
                      AppButton(
                        label: "إرسال الرمز",
                        isLoading: _loading,
                        onPressed: _loading ? null : _requestOtp,
                      ),
                    if (_step == _ForgotStep.verify) ...[
                      AppButton(
                        label: "تغيير كلمة المرور",
                        isLoading: _loading,
                        onPressed: _loading ? null : _verify,
                      ),
                      const SizedBox(height: 8),
                      ResendOtpButton(
                        cooldownSeconds: _cooldown.secondsLeft,
                        isLoading: _resendLoading,
                        onResend: _resendOtp,
                      ),
                    ],
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
