import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../core/network/api_exception.dart";
import "../../core/notifications/mobile_push_repository.dart";
import "../../core/notifications/push_notification_service.dart";
import "../../core/theme/app_colors.dart";
import "../../core/widgets/app_button.dart";
import "../../core/widgets/app_card.dart";
import "../../core/widgets/app_screen.dart";
import "../../core/widgets/brand_loading_indicator.dart";

class PushDiagnosticsScreen extends ConsumerStatefulWidget {
  const PushDiagnosticsScreen({super.key});

  @override
  ConsumerState<PushDiagnosticsScreen> createState() =>
      _PushDiagnosticsScreenState();
}

class _PushDiagnosticsScreenState extends ConsumerState<PushDiagnosticsScreen> {
  PushRuntimeDiagnostics? _diag;
  bool _loading = true;
  bool _sendingTest = false;
  String? _testMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _refresh());
  }

  Future<void> _refresh() async {
    setState(() {
      _loading = true;
      _testMessage = null;
    });
    final push = ref.read(pushNotificationServiceProvider);
    await push.initialize();
    await push.syncTokenWithBackend();
    final diag = await push.collectDiagnostics();
    if (!mounted) return;
    setState(() {
      _diag = diag;
      _loading = false;
    });
  }

  Future<void> _sendTest() async {
    setState(() {
      _sendingTest = true;
      _testMessage = null;
    });
    try {
      final result = await ref.read(mobilePushRepositoryProvider).sendTest();
      if (!mounted) return;
      setState(() {
        if (result.sent) {
          _testMessage =
              "تم الإرسال. messageId=${result.messageId ?? '—'}. ضع التطبيق في الخلفية وتحقق من شريط الإشعارات.";
        } else {
          _testMessage =
              result.reason ??
              (result.configured
                  ? "لم يُرسل الإشعار."
                  : "Firebase Admin غير مضبوط على الخادم.");
        }
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _testMessage = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() => _testMessage = e.toString());
    } finally {
      if (mounted) setState(() => _sendingTest = false);
      await _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = _diag;

    return AppScreen(
      showAppBar: true,
      title: "تشخيص الإشعارات",
      child: _loading && d == null
          ? const BrandLoadingIndicator(message: "جاري جمع التشخيص…")
          : RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "تشخيص الإشعارات",
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          "للتحقق من إشعارات الجهاز (خلفية/مغلق)، وليس إشعارات داخل التطبيق فقط. يجب الاختبار على جهاز حقيقي.",
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.5,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (d != null) ...[
                    _row("المنصة", d.platform),
                    _row(
                      "Firebase جاهز",
                      d.firebaseReady ? "نعم" : "لا",
                    ),
                    _row("صلاحية الإشعارات", d.permissionStatus),
                    _row(
                      "رمز FCM موجود",
                      d.fcmTokenExists ? "نعم" : "لا",
                    ),
                    _row("رمز FCM (مقنّع)", d.maskedFcmToken),
                    if (d.apnsTokenExists != null)
                      _row(
                        "رمز APNs موجود",
                        d.apnsTokenExists! ? "نعم" : "لا",
                      ),
                    _row("تسجيل الخادم", d.backendStatus),
                    _row(
                      "آخر رسالة (واجهة)",
                      d.lastForegroundIso ?? "—",
                    ),
                    _row(
                      "آخر فتح من إشعار",
                      d.lastOpenedIso ?? "—",
                    ),
                    if (d.initError != null) _row("خطأ التهيئة", d.initError!),
                    if (d.lastError != null) _row("آخر خطأ", d.lastError!),
                  ],
                  const SizedBox(height: 16),
                  AppButton(
                    label: "تحديث التشخيص",
                    variant: AppButtonVariant.secondary,
                    onPressed: _loading ? null : _refresh,
                  ),
                  const SizedBox(height: 8),
                  AppButton(
                    label: "إرسال إشعار تجريبي",
                    isLoading: _sendingTest,
                    onPressed: _sendingTest ? null : _sendTest,
                  ),
                  if (d?.fcmTokenExists == true) ...[
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () async {
                        final token = ref
                            .read(pushNotificationServiceProvider)
                            .fcmToken;
                        if (token == null) return;
                        await Clipboard.setData(ClipboardData(text: token));
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text("تم نسخ رمز FCM الكامل"),
                          ),
                        );
                      },
                      child: const Text("نسخ رمز FCM الكامل"),
                    ),
                  ],
                  if (_testMessage != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _testMessage!,
                      style: const TextStyle(
                        fontSize: 13,
                        height: 1.5,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 4),
            SelectableText(value),
          ],
        ),
      ),
    );
  }
}
