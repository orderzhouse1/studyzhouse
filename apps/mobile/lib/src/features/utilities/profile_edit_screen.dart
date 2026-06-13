import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../core/constants/profile_options.dart";
import "../../core/network/api_exception.dart";
import "../../core/theme/app_colors.dart";
import "../../core/widgets/account_page_header.dart";
import "../../core/widgets/app_button.dart";
import "../../core/widgets/app_card.dart";
import "../../core/widgets/app_screen.dart";
import "../../core/widgets/app_text_field.dart";
import "../../core/widgets/error_state.dart";
import "../../core/widgets/loading_view.dart";
import "models/student_profile_page.dart";
import "repositories/student_utilities_repository.dart";
import "utils/form_validators.dart";

class ProfileEditScreen extends ConsumerStatefulWidget {
  const ProfileEditScreen({super.key});

  @override
  ConsumerState<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends ConsumerState<ProfileEditScreen> {
  final _phoneController = TextEditingController();
  final _countryController = TextEditingController();

  bool _loading = true;
  bool _saving = false;
  String? _error;
  String? _saveError;
  StudentAccount? _account;
  String? _gender;
  String? _currentLevel;
  String? _weeklyStudyTime;
  String? _preferredLearningStyle;
  final Set<String> _interests = {};
  final Set<String> _learningGoals = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _countryController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final page = await ref
          .read(studentUtilitiesRepositoryProvider)
          .getProfile();
      if (!mounted) return;
      final p = page.profile;
      setState(() {
        _account = page.account;
        _countryController.text = p.country ?? "";
        _phoneController.text = p.phone ?? "";
        _gender = p.gender;
        _currentLevel = p.currentLevel;
        _weeklyStudyTime = p.weeklyStudyTime;
        _preferredLearningStyle = p.preferredLearningStyle;
        _interests
          ..clear()
          ..addAll(p.interests);
        _learningGoals
          ..clear()
          ..addAll(p.learningGoals);
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
        _error = "تعذّر تحميل الملف الشخصي.";
        _loading = false;
      });
    }
  }

  Future<void> _save() async {
    final selectionError = validateProfileSelections(
      interests: _interests.toList(),
      learningGoals: _learningGoals.toList(),
    );
    final phoneError = validateOptionalPhone(_phoneController.text);
    final countryError = validateOptionalCountry(_countryController.text);
    if (selectionError != null || phoneError != null || countryError != null) {
      setState(() {
        _saveError = selectionError ?? phoneError ?? countryError;
      });
      return;
    }

    setState(() {
      _saving = true;
      _saveError = null;
    });
    try {
      final body = <String, dynamic>{
        "interests": _interests.toList(),
        "learningGoals": _learningGoals.toList(),
        if (_countryController.text.trim().isNotEmpty)
          "country": _countryController.text.trim(),
        if (_phoneController.text.trim().isNotEmpty)
          "phone": _phoneController.text.trim(),
        if (_gender != null) "gender": _gender,
        if (_currentLevel != null) "currentLevel": _currentLevel,
        if (_weeklyStudyTime != null) "weeklyStudyTime": _weeklyStudyTime,
        if (_preferredLearningStyle != null)
          "preferredLearningStyle": _preferredLearningStyle,
      };
      await ref.read(studentUtilitiesRepositoryProvider).patchProfile(body);
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("تم حفظ الملف الشخصي.")));
      Navigator.of(context).pop();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _saveError = e.message;
        _saving = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _saveError = "تعذّر الحفظ.";
        _saving = false;
      });
    } finally {
      if (mounted && _saving) setState(() => _saving = false);
    }
  }

  Widget _chipSection({
    required String title,
    required List<ProfileOption> options,
    required Set<String> selected,
    int? max,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((opt) {
            final isSelected = selected.contains(opt.id);
            return FilterChip(
              label: Text(opt.labelAr),
              selected: isSelected,
              selectedColor: AppColors.orange.withValues(alpha: 0.2),
              checkmarkColor: AppColors.navy,
              onSelected: (v) {
                if (v && max != null && selected.length >= max) return;
                setState(() {
                  if (v) {
                    selected.add(opt.id);
                  } else {
                    selected.remove(opt.id);
                  }
                });
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScreen(
      showAppBar: true,
      title: "الملف الشخصي",
      child: _loading
          ? const LoadingView(message: "جاري تحميل الملف…")
          : _error != null
          ? ErrorState(message: _error!, onRetry: _load)
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const AccountPageHeader(
                  title: "الملف الشخصي",
                  description:
                      "نستخدم هذه المعلومات لتحسين اقتراحات الكورسات ولن تظهر للطلاب الآخرين.",
                ),
                if (_account != null) ...[
                  const SizedBox(height: 12),
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _account!.fullName,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        Text(_account!.email),
                        const SizedBox(height: 4),
                        Text(
                          "لا يمكن تغيير البريد الإلكتروني من التطبيق.",
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                AppTextField(
                  controller: _countryController,
                  label: "الدولة",
                  validator: validateOptionalCountry,
                ),
                const SizedBox(height: 12),
                AppTextField(
                  controller: _phoneController,
                  label: "رقم الهاتف",
                  validator: validateOptionalPhone,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _gender,
                  decoration: const InputDecoration(
                    labelText: "الجنس",
                    border: OutlineInputBorder(),
                  ),
                  items: ProfileOptions.genders
                      .map(
                        (g) => DropdownMenuItem(
                          value: g.id,
                          child: Text(g.labelAr),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => _gender = v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _currentLevel,
                  decoration: const InputDecoration(
                    labelText: "المستوى الحالي",
                    border: OutlineInputBorder(),
                  ),
                  items: ProfileOptions.levels
                      .map(
                        (l) => DropdownMenuItem(
                          value: l.id,
                          child: Text(l.labelAr),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => _currentLevel = v),
                ),
                const SizedBox(height: 16),
                _chipSection(
                  title: "الاهتمامات",
                  options: ProfileOptions.interests,
                  selected: _interests,
                  max: 10,
                ),
                const SizedBox(height: 16),
                _chipSection(
                  title: "أهداف التعلّم",
                  options: ProfileOptions.learningGoals,
                  selected: _learningGoals,
                  max: 5,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: _weeklyStudyTime,
                  decoration: const InputDecoration(
                    labelText: "وقت الدراسة الأسبوعي",
                    border: OutlineInputBorder(),
                  ),
                  items: ProfileOptions.weeklyStudy
                      .map(
                        (w) => DropdownMenuItem(
                          value: w.id,
                          child: Text(w.labelAr),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => _weeklyStudyTime = v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _preferredLearningStyle,
                  decoration: const InputDecoration(
                    labelText: "أسلوب التعلّم المفضّل",
                    border: OutlineInputBorder(),
                  ),
                  items: ProfileOptions.learningStyles
                      .map(
                        (s) => DropdownMenuItem(
                          value: s.id,
                          child: Text(s.labelAr),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => _preferredLearningStyle = v),
                ),
                if (_saveError != null) ...[
                  const SizedBox(height: 12),
                  Text(_saveError!, style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 20),
                AppButton(
                  label: "حفظ التغييرات",
                  isLoading: _saving,
                  onPressed: _saving ? null : _save,
                ),
              ],
            ),
    );
  }
}
