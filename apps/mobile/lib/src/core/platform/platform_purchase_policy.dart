import "package:flutter/foundation.dart";

/// Platform rules for paid course access (App Store vs Play Store).
abstract final class PlatformPurchasePolicy {
  static bool get isIOS =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  /// When true, iOS must not surface CliQ, proof upload, or activation-code unlock.
  static const bool iosExternalPaymentsDisabled = true;

  /// Apple IAP / StoreKit is disabled — iOS is a learning companion only.
  static const bool iapEnabled = false;

  static bool get showExternalPaymentFlows =>
      !(isIOS && iosExternalPaymentsDisabled);

  static const String paidCourseIosUnavailableLabel =
      "هذا الكورس غير متاح داخل iOS حاليًا";

  /// Neutral title for deep-linked routes that are disabled on iOS.
  static const String iosBlockedFeatureTitle = "غير متاح حاليًا";

  static const String iosBlockedFeatureDescription =
      "تطبيق iOS مخصّص للطلاب المسجّلين لمشاهدة محتوى التعلّم. لا يتوفّر شراء أو تفعيل كورسات داخل التطبيق.";

  /// Pending enrollment badge/filter — avoids «دفع» on iOS.
  static String get pendingEnrollmentStatusLabel =>
      showExternalPaymentFlows ? "بانتظار الدفع" : "قيد المراجعة";
}
