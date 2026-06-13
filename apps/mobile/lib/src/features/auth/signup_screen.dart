import "package:flutter/gestures.dart";
import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:url_launcher/url_launcher.dart";

import "../../core/auth/auth_messages.dart";
import "../../core/network/api_exception.dart";
import "../../core/theme/app_colors.dart";
import "../../core/utils/api_error_message.dart";
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

enum _SignupStep { account, otp, success }

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  _SignupStep _step = _SignupStep.account;
  final _formKey = GlobalKey<FormState>();

  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _otpController = TextEditingController();

  bool _acceptTerms = false;
  bool _loading = false;
  bool _resendLoading = false;
  String? _error;
  Map<String, List<String>>? _fieldErrors;
  String? _challengeId;
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
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _submitAccount() async {
    if (!_acceptTerms) {
      setState(() => _error = "يجب الموافقة على الشروط.");
      return;
    }
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _loading = true;
      _error = null;
      _fieldErrors = null;
    });

    try {
      final result = await ref
          .read(authRepositoryProvider)
          .requestSignupOtp(
            fullName: _fullNameController.text,
            email: _emailController.text,
            password: _passwordController.text,
            confirmPassword: _confirmController.text,
            acceptTerms: true,
          );
      _challengeId = result.challengeId;
      _cooldown.startFromIso(result.resendAvailableAt?.toIso8601String());
      setState(() => _step = _SignupStep.otp);
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _fieldErrors = e.fieldErrors;
      });
    } catch (_) {
      setState(() => _error = "تعذّر إرسال رمز التحقق.");
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resendOtp() async {
    final id = _challengeId;
    if (id == null) return;
    setState(() {
      _resendLoading = true;
      _error = null;
    });
    try {
      final result = await ref
          .read(authRepositoryProvider)
          .resendSignupOtp(challengeId: id);
      _cooldown.startFromIso(result.resendAvailableAt?.toIso8601String());
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _resendLoading = false);
    }
  }

  Future<void> _verifyOtp() async {
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
          .verifySignupOtp(challengeId: id, code: _otpController.text);
      setState(() => _step = _SignupStep.success);
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
                _SignupStep.account => "إنشاء حساب",
                _SignupStep.otp => "تأكيد البريد",
                _SignupStep.success => "تم بنجاح",
              },
              subtitle: switch (_step) {
                _SignupStep.account => "انضم إلى STUDYZHOUSE كطالب",
                _SignupStep.otp => AuthMessages.signupOtpSent,
                _SignupStep.success => AuthMessages.signupSuccess,
              },
            ),
            const SizedBox(height: 24),
            if (_step == _SignupStep.success) ...[
              AppButton(
                label: "الذهاب لتسجيل الدخول",
                onPressed: () => context.go("/login"),
              ),
            ] else
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_step == _SignupStep.account) ..._accountFields(),
                    if (_step == _SignupStep.otp) ..._otpFields(),
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
                    if (_step == _SignupStep.account)
                      AppButton(
                        label: "متابعة",
                        isLoading: _loading,
                        onPressed: _loading ? null : _submitAccount,
                      ),
                    if (_step == _SignupStep.otp) ...[
                      AppButton(
                        label: "تأكيد الحساب",
                        isLoading: _loading,
                        onPressed: _loading ? null : _verifyOtp,
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
            if (_step != _SignupStep.success) ...[
              const SizedBox(height: 16),
              Center(
                child: TextButton(
                  onPressed: () => context.go("/login"),
                  child: const Text("لديك حساب؟ تسجيل الدخول"),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  List<Widget> _accountFields() {
    return [
      AppTextField(
        controller: _fullNameController,
        label: "الاسم الكامل",
        prefixIcon: Icons.person_outline_rounded,
        validator: validateFullName,
      ),
      const SizedBox(height: 16),
      AppTextField(
        controller: _emailController,
        label: "البريد الإلكتروني",
        keyboardType: TextInputType.emailAddress,
        prefixIcon: Icons.mail_outline_rounded,
        validator: validateEmail,
      ),
      if (firstFieldError(_fieldErrors, "email") != null)
        _fieldHint(firstFieldError(_fieldErrors, "email")!),
      const SizedBox(height: 16),
      AppTextField(
        controller: _passwordController,
        label: "كلمة المرور",
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
        validator: (v) => validateConfirmPassword(_passwordController.text, v),
      ),
      const SizedBox(height: 12),
      CheckboxListTile(
        value: _acceptTerms,
        onChanged: (v) => setState(() => _acceptTerms = v ?? false),
        contentPadding: EdgeInsets.zero,
        controlAffinity: ListTileControlAffinity.leading,
        title: Text.rich(
          TextSpan(
            children: [
              const TextSpan(text: "أوافق على "),
              TextSpan(
                text: "الشروط",
                style: const TextStyle(
                  color: AppColors.orange,
                  decoration: TextDecoration.underline,
                ),
                recognizer: TapGestureRecognizer()
                  ..onTap = () => _openUrl("https://studyzhouse.com/terms"),
              ),
              const TextSpan(text: " و"),
              TextSpan(
                text: "سياسة الخصوصية",
                style: const TextStyle(
                  color: AppColors.orange,
                  decoration: TextDecoration.underline,
                ),
                recognizer: TapGestureRecognizer()
                  ..onTap = () =>
                      _openUrl("https://studyzhouse.com/privacy-policy"),
              ),
            ],
          ),
        ),
      ),
    ];
  }

  List<Widget> _otpFields() {
    return [OtpInputField(controller: _otpController, onSubmitted: _verifyOtp)];
  }

  Widget _fieldHint(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Text(
        text,
        style: Theme.of(
          context,
        ).textTheme.bodySmall?.copyWith(color: AppColors.error),
      ),
    );
  }
}
