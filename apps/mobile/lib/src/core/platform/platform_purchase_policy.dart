import "package:flutter/foundation.dart";

/// Purchase / payment rules for the Flutter student app.
///
/// Mobile (iOS + Android) is a Reader / Learning Companion — no marketplace
/// or in-app payment flows. Web marketplace behavior is separate.
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

  /// Apple IAP / Play Billing are not implemented.
  static const bool iapEnabled = false;

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

  /// Pending badge — mobile never shows payment wording.
  static String get pendingEnrollmentStatusLabel =>
      showExternalPaymentFlows ? "بانتظار الدفع" : "قيد المراجعة";
}
