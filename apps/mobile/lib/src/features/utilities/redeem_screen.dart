import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../core/network/api_exception.dart";
import "../../core/theme/app_colors.dart";
import "../../core/widgets/account_page_header.dart";
import "../../core/widgets/app_button.dart";
import "../../core/widgets/app_card.dart";
import "../../core/widgets/app_screen.dart";
import "../../core/widgets/app_text_field.dart";
import "models/activation_redeem.dart";
import "repositories/student_utilities_repository.dart";
import "utils/form_validators.dart";

class RedeemScreen extends ConsumerStatefulWidget {
  const RedeemScreen({super.key});

  @override
  ConsumerState<RedeemScreen> createState() => _RedeemScreenState();
}

class _RedeemScreenState extends ConsumerState<RedeemScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  bool _loading = false;
  String? _error;
  ActivationRedeemResponse? _success;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
      _success = null;
    });
    try {
      final result = await ref
          .read(studentUtilitiesRepositoryProvider)
          .redeemActivationCode(_codeController.text);
      if (!mounted) return;
      setState(() {
        _success = result;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = "تعذّر تفعيل الكورس. حاول مرة أخرى.";
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScreen(
      showAppBar: true,
      title: "تفعيل كورس",
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const AccountPageHeader(
              eyebrow: "تفعيل",
              title: "تفعيل كورس",
              description:
                  "أدخل كود التفعيل الذي حصلت عليه لتفعيل الكورس في حسابك.",
            ),
            const SizedBox(height: 24),
            if (_success != null) ...[
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Icon(
                      Icons.check_circle_outline,
                      color: AppColors.orange,
                      size: 40,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      "تم تفعيل «${_success!.course.title}» بنجاح.",
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 16),
                    AppButton(
                      label: "ابدأ التعلّم",
                      onPressed: () =>
                          context.push("/learn/${_success!.course.slug}"),
                    ),
                    const SizedBox(height: 8),
                    AppButton(
                      label: "تفعيل كود آخر",
                      variant: AppButtonVariant.secondary,
                      onPressed: () => setState(() {
                        _success = null;
                        _codeController.clear();
                      }),
                    ),
                  ],
                ),
              ),
            ] else ...[
              AppTextField(
                controller: _codeController,
                label: "كود التفعيل",
                textInputAction: TextInputAction.done,
                onFieldSubmitted: (_) => _submit(),
                validator: validateActivationCode,
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.red),
                ),
              ],
              const SizedBox(height: 20),
              AppButton(
                label: "تفعيل الكورس",
                isLoading: _loading,
                onPressed: _loading ? null : _submit,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
