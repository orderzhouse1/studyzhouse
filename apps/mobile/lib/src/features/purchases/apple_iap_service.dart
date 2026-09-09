import "dart:async";

import "package:flutter/foundation.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:in_app_purchase/in_app_purchase.dart";

import "../../core/network/api_exception.dart";
import "../../core/platform/platform_purchase_policy.dart";
import "../courses/models/course.dart";
import "apple_iap_repository.dart";

typedef AppleIapStatusCallback = void Function(String message, {bool isError});

/// StoreKit purchase + server verification for iOS Non-Consumable courses.
class AppleIapService {
  AppleIapService(this._repository);

  final AppleIapRepository _repository;
  final InAppPurchase _iap = InAppPurchase.instance;

  StreamSubscription<List<PurchaseDetails>>? _subscription;
  final Map<String, ProductDetails> _productsById = {};
  Completer<void>? _purchaseCompleter;
  String? _activeCourseId;
  String? _activeProductId;
  bool _busy = false;
  AppleIapStatusCallback? _statusCb;
  VoidCallback? _unlockedCb;

  bool get isAvailableSync => PlatformPurchasePolicy.iapEnabled;

  Future<bool> isStoreAvailable() async {
    if (!PlatformPurchasePolicy.iapEnabled) return false;
    return _iap.isAvailable();
  }

  Future<void> ensureListening({
    AppleIapStatusCallback? onStatus,
    VoidCallback? onUnlocked,
  }) async {
    if (onStatus != null) _statusCb = onStatus;
    if (onUnlocked != null) _unlockedCb = onUnlocked;
    if (_subscription != null) return;
    _subscription = _iap.purchaseStream.listen(
      _onPurchaseUpdates,
      onError: (Object e) {
        _statusCb?.call("حدث خطأ في متجر Apple.", isError: true);
        _failActivePurchase(e);
      },
    );
  }

  Future<Map<String, ProductDetails>> queryProducts(
    Set<String> productIds,
  ) async {
    if (!PlatformPurchasePolicy.iapEnabled || productIds.isEmpty) {
      return const {};
    }
    final available = await _iap.isAvailable();
    if (!available) {
      throw StateError("متجر Apple غير متاح على هذا الجهاز.");
    }
    final response = await _iap.queryProductDetails(productIds);
    if (response.error != null) {
      throw StateError(
        response.error!.message.isNotEmpty
            ? response.error!.message
            : "تعذّر تحميل أسعار Apple.",
      );
    }
    for (final p in response.productDetails) {
      _productsById[p.id] = p;
    }
    return Map.unmodifiable({
      for (final id in productIds)
        if (_productsById[id] != null) id: _productsById[id]!,
    });
  }

  ProductDetails? cachedProduct(String productId) => _productsById[productId];

  Future<void> buyCourse({
    required Course course,
    AppleIapStatusCallback? onStatus,
    VoidCallback? onUnlocked,
  }) async {
    if (!PlatformPurchasePolicy.iapEnabled) {
      throw StateError("الشراء عبر Apple غير متاح على هذه المنصة.");
    }
    if (!course.isIosIapPurchasable) {
      throw StateError(PlatformPurchasePolicy.paidCourseUnavailableLabel);
    }
    final productId = course.appleProductId!.trim();
    if (_busy) {
      throw StateError("هناك عملية شراء قيد التنفيذ.");
    }

    await ensureListening(onStatus: onStatus, onUnlocked: onUnlocked);

    var product = _productsById[productId];
    if (product == null) {
      await queryProducts({productId});
      product = _productsById[productId];
    }
    if (product == null) {
      throw StateError(
        "تعذّر تحميل منتج Apple لهذا الكورس. حاول مرة أخرى.",
      );
    }

    _busy = true;
    _activeCourseId = course.id;
    _activeProductId = productId;
    _purchaseCompleter = Completer<void>();

    final started = await _iap.buyNonConsumable(
      purchaseParam: PurchaseParam(productDetails: product),
    );
    if (!started) {
      _busy = false;
      _activeCourseId = null;
      _activeProductId = null;
      _purchaseCompleter = null;
      throw StateError("تعذّر بدء عملية الشراء عبر Apple.");
    }

    await _purchaseCompleter!.future;
  }

  Future<void> restorePurchases({
    AppleIapStatusCallback? onStatus,
    VoidCallback? onUnlocked,
  }) async {
    if (!PlatformPurchasePolicy.iapEnabled) {
      throw StateError("استعادة المشتريات غير متاحة على هذه المنصة.");
    }
    await ensureListening(onStatus: onStatus, onUnlocked: onUnlocked);
    _statusCb?.call("جاري استعادة المشتريات…", isError: false);
    await _iap.restorePurchases();
  }

  Future<void> _onPurchaseUpdates(List<PurchaseDetails> purchases) async {
    for (final purchase in purchases) {
      switch (purchase.status) {
        case PurchaseStatus.pending:
          _statusCb?.call("جاري معالجة الشراء…", isError: false);
          break;
        case PurchaseStatus.canceled:
          _statusCb?.call("تم إلغاء الشراء.", isError: true);
          await _finish(purchase);
          _failActivePurchase(StateError("canceled"));
          break;
        case PurchaseStatus.error:
          _statusCb?.call(
            purchase.error?.message ?? "فشلت عملية الشراء.",
            isError: true,
          );
          await _finish(purchase);
          _failActivePurchase(
            StateError(purchase.error?.message ?? "purchase_error"),
          );
          break;
        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          try {
            await _verifyAndComplete(purchase);
          } catch (e) {
            _statusCb?.call(
              e is ApiException ? e.message : "تعذّر التحقق من الشراء.",
              isError: true,
            );
            if (purchase.pendingCompletePurchase &&
                e is ApiException &&
                (e.code == "IAP_TRANSACTION_CONFLICT" ||
                    e.code == "IAP_TRANSACTION_REVOKED")) {
              await _finish(purchase);
            }
            _failActivePurchase(e);
          }
          break;
      }
    }
  }

  Future<void> _verifyAndComplete(PurchaseDetails purchase) async {
    final productId = purchase.productID;
    final transactionId = purchase.purchaseID?.trim();
    final verificationData =
        purchase.verificationData.serverVerificationData.trim();

    if (transactionId == null || transactionId.isEmpty) {
      throw StateError("معرّف معاملة Apple مفقود.");
    }
    if (verificationData.isEmpty) {
      throw StateError("بيانات التحقق من Apple مفقودة.");
    }

    final isActiveBuy =
        _activeProductId != null && _activeProductId == productId;
    final isRestore = purchase.status == PurchaseStatus.restored;
    if (_busy && !isActiveBuy && !isRestore) {
      return;
    }

    _statusCb?.call("جاري التحقق من الشراء…", isError: false);

    final env = "Sandbox"; // Server API resolves sandbox/production.

    if (isRestore && !isActiveBuy) {
      await _repository.restorePurchases([
        {
          "productId": productId,
          "transactionId": transactionId,
          "verificationData": verificationData,
          "environment": env,
        },
      ]);
    } else {
      await _repository.verifyPurchase(
        courseId: _activeCourseId,
        productId: productId,
        transactionId: transactionId,
        verificationData: verificationData,
        environment: env,
      );
    }

    if (purchase.pendingCompletePurchase) {
      await _iap.completePurchase(purchase);
    }

    _statusCb?.call(
      isRestore ? "تمت استعادة المشتريات بنجاح." : "تم فتح الكورس بنجاح.",
      isError: false,
    );
    _unlockedCb?.call();
    _completeActivePurchase();
  }

  Future<void> _finish(PurchaseDetails purchase) async {
    if (purchase.pendingCompletePurchase) {
      await _iap.completePurchase(purchase);
    }
  }

  void _completeActivePurchase() {
    _busy = false;
    _activeCourseId = null;
    _activeProductId = null;
    final c = _purchaseCompleter;
    _purchaseCompleter = null;
    if (c != null && !c.isCompleted) c.complete();
  }

  void _failActivePurchase(Object error) {
    _busy = false;
    _activeCourseId = null;
    _activeProductId = null;
    final c = _purchaseCompleter;
    _purchaseCompleter = null;
    if (c != null && !c.isCompleted) {
      c.completeError(error);
    }
  }

  Future<void> dispose() async {
    await _subscription?.cancel();
    _subscription = null;
  }
}

final appleIapServiceProvider = Provider<AppleIapService>((ref) {
  final service = AppleIapService(ref.watch(appleIapRepositoryProvider));
  ref.onDispose(() {
    unawaited(service.dispose());
  });
  return service;
});
