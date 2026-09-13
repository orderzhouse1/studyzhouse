import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:in_app_purchase/in_app_purchase.dart";

import "../../../core/network/api_exception.dart";
import "../../../core/platform/platform_purchase_policy.dart";
import "../../../core/theme/app_colors.dart";
import "../../../core/widgets/app_button.dart";
import "../../courses/models/course.dart";
import "../apple_iap_service.dart";

/// iOS Apple IAP purchase / restore panel for a paid course.
class AppleIapPurchasePanel extends ConsumerStatefulWidget {
  const AppleIapPurchasePanel({
    required this.course,
    required this.onUnlocked,
    super.key,
  });

  final Course course;
  final VoidCallback onUnlocked;

  @override
  ConsumerState<AppleIapPurchasePanel> createState() =>
      _AppleIapPurchasePanelState();
}

class _AppleIapPurchasePanelState extends ConsumerState<AppleIapPurchasePanel> {
  bool _loadingProduct = true;
  bool _purchasing = false;
  bool _restoring = false;
  String? _error;
  ProductDetails? _product;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadProduct());
  }

  Future<void> _loadProduct() async {
    final productId = widget.course.appleProductId?.trim();
    if (productId == null || productId.isEmpty) {
      setState(() {
        _loadingProduct = false;
        _error = PlatformPurchasePolicy.paidCourseUnavailableLabel;
      });
      return;
    }

    setState(() {
      _loadingProduct = true;
      _error = null;
    });

    try {
      final service = ref.read(appleIapServiceProvider);
      await service.ensureListening(
        onStatus: _onStatus,
        onUnlocked: widget.onUnlocked,
      );
      final map = await service.queryProducts({productId});
      if (!mounted) return;
      final product = map[productId];
      setState(() {
        _product = product;
        _loadingProduct = false;
        _error = product == null
            ? "تعذّر تحميل سعر الكورس من Apple. حاول مرة أخرى."
            : null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingProduct = false;
        _error = e is StateError
            ? e.message
            : "تعذّر تحميل سعر الكورس من Apple. حاول مرة أخرى.";
      });
    }
  }

  void _onStatus(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red.shade700 : null,
      ),
    );
  }

  Future<void> _buy() async {
    setState(() => _purchasing = true);
    try {
      await ref.read(appleIapServiceProvider).buyCourse(
            course: widget.course,
            onStatus: _onStatus,
            onUnlocked: widget.onUnlocked,
          );
    } catch (e) {
      if (!mounted) return;
      if (e is StateError && e.message == "canceled") return;
      final msg = e is ApiException
          ? e.message
          : (e is StateError ? e.message : "تعذّر إتمام الشراء.");
      _onStatus(msg, isError: true);
    } finally {
      if (mounted) setState(() => _purchasing = false);
    }
  }

  Future<void> _restore() async {
    setState(() => _restoring = true);
    try {
      await ref.read(appleIapServiceProvider).restorePurchases(
            onStatus: _onStatus,
            onUnlocked: widget.onUnlocked,
          );
    } catch (e) {
      if (!mounted) return;
      final msg = e is ApiException
          ? e.message
          : (e is StateError ? e.message : "تعذّرت استعادة المشتريات.");
      _onStatus(msg, isError: true);
    } finally {
      if (mounted) setState(() => _restoring = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!PlatformPurchasePolicy.iapEnabled) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_loadingProduct)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_error != null) ...[
          Text(
            _error!,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.red.shade700,
                ),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: _loadProduct,
            child: const Text("إعادة المحاولة"),
          ),
        ] else ...[
          if (_product != null)
            Text(
              _product!.price,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppColors.orange,
                    fontWeight: FontWeight.w700,
                  ),
            ),
          const SizedBox(height: 8),
          Text(
            PlatformPurchasePolicy.applePurchaseDisclaimer,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          AppButton(
            label: PlatformPurchasePolicy.applePurchaseButtonLabel,
            isLoading: _purchasing,
            onPressed: (_purchasing || _restoring) ? null : _buy,
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: (_purchasing || _restoring) ? null : _restore,
            child: _restoring
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(PlatformPurchasePolicy.appleRestoreButtonLabel),
          ),
        ],
      ],
    );
  }
}
