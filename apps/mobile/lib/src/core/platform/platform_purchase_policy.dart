import "package:flutter/foundation.dart";

/// Purchase / payment rules for the Flutter student app.
///
/// - iOS: Apple IAP only for paid digital courses (no CliQ/Stripe/external).
/// - Android: Reader companion — no marketplace payment flows (unchanged).
/// - Web marketplace remains outside this Flutter app.
abstract final class PlatformPurchasePolicy {
  static bool get isIOS =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  static bool get isAndroid =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  /// Native mobile builds (not web).
  static bool get isMobile => isIOS || isAndroid;

  /// External CliQ / proof / redeem are never shown in the mobile app.
  static const bool mobileExternalPaymentsDisabled = true;

  /// @deprecated Use [mobileExternalPaymentsDisabled].
  static const bool iosExternalPaymentsDisabled = mobileExternalPaymentsDisabled;

  /// Apple IAP enabled on iOS only.
  static bool get iapEnabled => isIOS;

  static bool get showExternalPaymentFlows =>
      !(isMobile && mobileExternalPaymentsDisabled);

  static const String paidCourseUnavailableLabel =
      "هذا الكورس غير متاح داخل التطبيق.";

  /// @deprecated Use [paidCourseUnavailableLabel].
  static const String paidCourseIosUnavailableLabel =
      paidCourseUnavailableLabel;

  static const String blockedFeatureTitle = "غير متاح حاليًا";

  /// @deprecated Use [blockedFeatureTitle].
  static const String iosBlockedFeatureTitle = blockedFeatureTitle;

  static const String blockedFeatureDescription =
      "التطبيق مخصّص لمتابعة التعلّم من الكورسات المتوفّرة في حسابك.";

  /// @deprecated Use [blockedFeatureDescription].
  static const String iosBlockedFeatureDescription =
      blockedFeatureDescription;

  static const String applePurchaseButtonLabel = "شراء الكورس عبر Apple";
  static const String appleRestoreButtonLabel = "استعادة المشتريات";
  static const String applePurchaseDisclaimer =
      "هذا الشراء يفتح الوصول إلى هذا الكورس داخل تطبيق STUDYZHOUSE";

  /// Pending badge — mobile never shows payment wording.
  static String get pendingEnrollmentStatusLabel =>
      showExternalPaymentFlows ? "بانتظار الدفع" : "قيد المراجعة";
}
