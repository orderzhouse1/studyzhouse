import "dart:typed_data";

import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:image_picker/image_picker.dart";
import "package:intl/intl.dart";
import "package:url_launcher/url_launcher.dart";

import "../../core/constants/legal_urls.dart";
import "../../core/network/api_exception.dart";
import "../../core/network/pagination_meta.dart";
import "../../core/theme/app_colors.dart";
import "../../core/utils/image_data_url.dart";
import "../../core/widgets/account_page_header.dart";
import "../../core/widgets/app_button.dart";
import "../../core/widgets/app_card.dart";
import "../../core/widgets/app_screen.dart";
import "../../core/widgets/app_text_field.dart";
import "../../core/widgets/error_state.dart";
import "../../core/widgets/loading_view.dart";
import "../../core/widgets/legal_link_row.dart";
import "../courses/models/course.dart";
import "../courses/repositories/course_repository.dart";
import "models/payment_request.dart";
import "repositories/student_utilities_repository.dart";
import "utils/form_validators.dart";
import "widgets/status_badge.dart";

class PurchasesScreen extends ConsumerStatefulWidget {
  const PurchasesScreen({this.initialCourseId, super.key});

  /// يُمرَّر من تفاصيل الكورس لاختيار الكورس مسبقًا.
  final String? initialCourseId;

  @override
  ConsumerState<PurchasesScreen> createState() => _PurchasesScreenState();
}

class _PurchasesScreenState extends ConsumerState<PurchasesScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _referenceController = TextEditingController();
  final _payerNameController = TextEditingController();
  final _payerPhoneController = TextEditingController();
  final _noteController = TextEditingController();

  bool _loading = true;
  bool _submitting = false;
  String? _error;
  String? _submitError;
  PaymentInfo? _paymentInfo;
  List<PaymentRequestItem> _requests = [];
  List<StudentPurchaseItem> _purchases = [];
  List<Course> _paidCourses = [];
  String? _selectedCourseId;
  Uint8List? _proofBytes;
  String? _proofMime;
  String? _proofFileName;
  final ImagePicker _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _referenceController.dispose();
    _payerNameController.dispose();
    _payerPhoneController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = ref.read(studentUtilitiesRepositoryProvider);
      final courseRepo = ref.read(courseRepositoryProvider);
      final results = await Future.wait([
        repo.getPaymentInfo(),
        repo.listPaymentRequests(),
        repo.listPurchases(),
        courseRepo.listCourses(pageSize: 100, pricingType: "PAID"),
      ]);
      if (!mounted) return;
      setState(() {
        _paymentInfo = results[0] as PaymentInfo;
        _requests = results[1] as List<PaymentRequestItem>;
        _purchases = results[2] as List<StudentPurchaseItem>;
        _paidCourses = (results[3] as PaginatedResult<Course>).items;
        _loading = false;
      });
      _applyInitialCourseSelection();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = "تعذّر تحميل البيانات.";
        _loading = false;
      });
    }
  }

  void _applyInitialCourseSelection() {
    final id = widget.initialCourseId?.trim();
    if (id == null || id.isEmpty) return;
    Course? match;
    for (final c in _paidCourses) {
      if (c.id == id) {
        match = c;
        break;
      }
    }
    if (match == null) return;
    setState(() {
      _selectedCourseId = match!.id;
      if (_amountController.text.trim().isEmpty &&
          match.priceAmount != null &&
          match.priceAmount!.isNotEmpty) {
        _amountController.text = match.priceAmount!;
      }
    });
  }

  void _clearProofImage() {
    setState(() {
      _proofBytes = null;
      _proofMime = null;
      _proofFileName = null;
    });
  }

  Future<void> _pickProofImage() async {
    try {
      final picked = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1920,
      );
      if (picked == null) return;

      final bytes = await picked.readAsBytes();
      if (bytes.length > 5 * 1024 * 1024) {
        if (!mounted) return;
        setState(() => _submitError = "حجم الصورة يجب أن لا يتجاوز 5 ميجابايت.");
        return;
      }

      final mime =
          mimeTypeFromPath(picked.path) ??
          (picked.mimeType?.startsWith("image/") == true
              ? picked.mimeType
              : "image/jpeg");

      setState(() {
        _proofBytes = bytes;
        _proofMime = mime ?? "image/jpeg";
        _proofFileName = picked.name;
        _submitError = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _submitError = "تعذّر اختيار الصورة.");
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCourseId == null) {
      setState(() => _submitError = "اختر الكورس.");
      return;
    }

    final reference = _referenceController.text.trim();
    final note = _noteController.text.trim();
    String? proofImageBase64;
    if (_proofBytes != null) {
      proofImageBase64 = imageBytesToDataUrl(
        _proofBytes!,
        mimeType: _proofMime ?? "image/jpeg",
      );
    }

    if (!paymentRequestHasRequiredProof(
      paymentReference: reference,
      note: note,
      proofImageBase64: proofImageBase64,
    )) {
      setState(() => _submitError = paymentRequestProofValidationMessage());
      return;
    }

    setState(() {
      _submitting = true;
      _submitError = null;
    });
    try {
      await ref
          .read(studentUtilitiesRepositoryProvider)
          .createPaymentRequest(
            courseId: _selectedCourseId!,
            paidAmount: _amountController.text.trim(),
            paymentReference: reference.length >= 4 ? reference : null,
            payerName: _payerNameController.text.trim(),
            payerPhone: _payerPhoneController.text.trim(),
            note: note.isNotEmpty ? note : null,
            proofImageBase64: proofImageBase64,
          );
      if (!mounted) return;
      _amountController.clear();
      _referenceController.clear();
      _payerNameController.clear();
      _payerPhoneController.clear();
      _noteController.clear();
      _selectedCourseId = widget.initialCourseId;
      _clearProofImage();
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("تم إرسال طلب الدفع للمراجعة.")),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _submitError = e.message;
        _submitting = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _submitError = "تعذّر إرسال الطلب.";
        _submitting = false;
      });
    } finally {
      if (mounted && _submitting) {
        setState(() => _submitting = false);
      }
    }
  }

  Future<void> _openRefundPolicy() async {
    final uri = Uri.parse(LegalUrls.refund);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return DateFormat("d MMM y، HH:mm", "ar").format(dt);
    } catch (_) {
      return iso;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScreen(
      showAppBar: true,
      title: "مشترياتي وطلبات الدفع",
      child: _loading
          ? const LoadingView(message: "جاري التحميل…")
          : _error != null
          ? ErrorState(message: _error!, onRetry: _load)
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const AccountPageHeader(
                  title: "مشترياتي وطلبات الدفع",
                  description:
                      "طلبات الدفع عبر CliQ تُراجع يدويًا من الإدارة. أرفق رقم العملية أو تفاصيل الحوالة أو صورة الإيصال.",
                ),
                const SizedBox(height: 16),
                if (_paymentInfo != null &&
                    (_paymentInfo!.cliqAlias.isNotEmpty ||
                        _paymentInfo!.cliqInstructions.isNotEmpty))
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "معلومات CliQ",
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        if (_paymentInfo!.cliqAlias.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          SelectableText(
                            "الاسم: ${_paymentInfo!.cliqAlias}",
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ],
                        if (_paymentInfo!.cliqInstructions.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(_paymentInfo!.cliqInstructions),
                        ],
                      ],
                    ),
                  ),
                const SizedBox(height: 16),
                Text(
                  "إرسال طلب دفع",
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      DropdownButtonFormField<String>(
                        initialValue: _selectedCourseId,
                        decoration: const InputDecoration(
                          labelText: "الكورس",
                          border: OutlineInputBorder(),
                        ),
                        items: _paidCourses
                            .map(
                              (c) => DropdownMenuItem(
                                value: c.id,
                                child: Text(
                                  c.title,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (v) => setState(() => _selectedCourseId = v),
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        controller: _amountController,
                        label: "المبلغ المدفوع (د.أ)",
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        validator: validatePaymentAmount,
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        controller: _referenceController,
                        label: "رقم مرجع التحويل (اختياري)",
                        validator: validateOptionalPaymentReference,
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        controller: _payerNameController,
                        label: "اسم الدافع (اختياري)",
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        controller: _payerPhoneController,
                        label: "هاتف الدافع (اختياري)",
                        validator: validateOptionalPhone,
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        controller: _noteController,
                        label: "ملاحظة / تفاصيل الحوالة (اختياري)",
                      ),
                      const SizedBox(height: 12),
                      Text(
                        "صورة الإيصال (اختياري)",
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 8),
                      if (_proofBytes != null) ...[
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.memory(
                            _proofBytes!,
                            height: 160,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                _proofFileName ?? "صورة مرفقة",
                                style: Theme.of(context).textTheme.bodySmall,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            TextButton(
                              onPressed: _clearProofImage,
                              child: const Text("إزالة"),
                            ),
                          ],
                        ),
                      ] else
                        OutlinedButton.icon(
                          onPressed: _submitting ? null : _pickProofImage,
                          icon: const Icon(Icons.upload_outlined),
                          label: const Text("اختيار صورة الإيصال"),
                        ),
                      if (_submitError != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          _submitError!,
                          style: const TextStyle(color: Colors.red),
                        ),
                      ],
                      const SizedBox(height: 12),
                      AppButton(
                        label: "إرسال طلب الدفع",
                        isLoading: _submitting,
                        onPressed: _submitting ? null : _submit,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _openRefundPolicy,
                  child: const Text(
                    "سياسة الاسترجاع",
                    style: TextStyle(color: AppColors.orange),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  "سجل طلبات الدفع",
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                if (_requests.isEmpty)
                  const Text("لا توجد طلبات دفع بعد.")
                else
                  ..._requests.map(
                    (r) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: AppCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    r.course.title,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleSmall,
                                  ),
                                ),
                                StatusBadge(status: r.status),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              "${r.paidAmount} ${r.currency}"
                              "${r.paymentReference != null ? " · ${r.paymentReference}" : ""}",
                            ),
                            Text(
                              _formatDate(r.createdAt),
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                            if (r.rejectionReason != null &&
                                r.rejectionReason!.isNotEmpty)
                              Text(
                                r.rejectionReason!,
                                style: const TextStyle(color: Colors.red),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                const SizedBox(height: 24),
                Text(
                  "سجل المشتريات",
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                if (_purchases.isEmpty)
                  const Text("لا توجد مشتريات مسجّلة بعد.")
                else
                  ..._purchases.map(
                    (p) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: AppCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    p.course.title,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleSmall,
                                  ),
                                ),
                                StatusBadge(status: p.status),
                              ],
                            ),
                            Text(purchaseSourceLabelAr(p.source)),
                            if (p.amount != null)
                              Text("${p.amount} ${p.currency ?? "JOD"}"),
                            Text(
                              _formatDate(p.createdAt),
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                const LegalLinkRow(),
              ],
            ),
    );
  }
}
