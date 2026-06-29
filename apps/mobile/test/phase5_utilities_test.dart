import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/utils/action_url_mapper.dart";
import "package:studyzhouse_mobile/src/core/utils/api_error_message.dart";
import "package:studyzhouse_mobile/src/features/utilities/models/activation_redeem.dart";
import "package:studyzhouse_mobile/src/features/utilities/models/notification_item.dart";
import "package:studyzhouse_mobile/src/features/utilities/models/payment_request.dart";
import "package:studyzhouse_mobile/src/features/utilities/models/student_profile_page.dart";
import "package:studyzhouse_mobile/src/features/utilities/utils/form_validators.dart";

void main() {
  group("activation redeem parsing", () {
    test("parses success envelope", () {
      final result = ActivationRedeemResponse.fromEnvelope({
        "success": true,
        "data": {
          "course": {
            "id": "c1",
            "title": "كورس",
            "slug": "course-a",
            "pricingType": "PAID",
          },
          "enrollment": {"id": "e1", "status": "ACTIVE"},
        },
      });
      expect(result.course.slug, "course-a");
      expect(result.enrollment.status, "ACTIVE");
    });
  });

  group("notification parsing", () {
    test("parses list envelope", () {
      final list = NotificationsListResult.fromEnvelope({
        "success": true,
        "data": {
          "unreadCount": 2,
          "items": [
            {
              "id": "n1",
              "type": "ENROLLMENT",
              "title": "تفعيل",
              "body": "تم التفعيل",
              "actionUrl": "/learn/course-a",
              "createdAt": "2026-01-01T00:00:00.000Z",
            },
          ],
        },
      });
      expect(list.unreadCount, 2);
      expect(list.items.first.actionUrl, "/learn/course-a");
      expect(list.items.first.isRead, isFalse);
    });

    test("copyWithRead marks read", () {
      final n = AppNotification(
        id: "n1",
        type: "SYSTEM",
        title: "t",
        body: "b",
        createdAt: "2026-01-01T00:00:00.000Z",
      );
      expect(n.copyWithRead().isRead, isTrue);
    });
  });

  group("profile parsing", () {
    test("parses profile page envelope", () {
      final page = StudentProfilePage.fromEnvelope({
        "success": true,
        "data": {
          "account": {
            "fullName": "أحمد",
            "email": "a@example.com",
            "status": "ACTIVE",
            "hasGoogleLogin": false,
          },
          "profile": {
            "country": "Jordan",
            "interests": ["programming"],
            "learningGoals": ["career"],
            "needsOnboarding": false,
          },
        },
      });
      expect(page.account.fullName, "أحمد");
      expect(page.profile.interests, ["programming"]);
    });
  });

  group("payment request parsing", () {
    test("parses payment request item", () {
      final item = PaymentRequestItem.fromJson({
        "id": "pr1",
        "status": "PENDING",
        "paidAmount": "25",
        "currency": "JOD",
        "paymentReference": "REF-1",
        "course": {"id": "c1", "title": "كورس", "slug": "c"},
        "createdAt": "2026-01-01T00:00:00.000Z",
      });
      expect(item.status, "PENDING");
      expect(paymentStatusLabelAr("PENDING"), contains("المراجعة"));
    });

    test("parses purchase item", () {
      final purchase = StudentPurchaseItem.fromJson({
        "id": "p1",
        "source": "CLIQ_PAYMENT",
        "status": "APPROVED",
        "course": {"id": "c1", "title": "كورس", "slug": "c"},
        "amount": "25",
        "currency": "JOD",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "canLearn": true,
        "learnUrl": "/learn/c",
      });
      expect(purchase.canLearn, isTrue);
      expect(purchaseSourceLabelAr("CLIQ_PAYMENT"), contains("CliQ"));
    });
  });

  group("actionUrl mapper", () {
    test("maps web student paths to mobile routes", () {
      expect(mapActionUrlToMobileRoute("/learn/foo"), "/learn/foo");
      expect(mapActionUrlToMobileRoute("/student/my-courses"), "/my-courses");
      expect(mapActionUrlToMobileRoute("/student/purchases"), "/purchases");
      expect(mapActionUrlToMobileRoute("/student/saved"), "/saved");
      expect(mapActionUrlToMobileRoute("https://studyzhouse.com"), isNull);
    });

    test("isExternalUrl detects http and mailto", () {
      expect(isExternalUrl("https://x.com"), isTrue);
      expect(isExternalUrl("/learn/x"), isFalse);
    });
  });

  group("form validators", () {
    test("activation code validation", () {
      expect(validateActivationCode(""), isNotNull);
      expect(validateActivationCode("ABCD"), isNull);
    });

    test("payment validators", () {
      expect(validatePaymentAmount("10"), isNull);
      expect(validatePaymentAmount("0"), isNotNull);
      expect(validateOptionalPaymentReference(""), isNull);
      expect(validateOptionalPaymentReference("REF"), isNull);
      expect(validateOptionalPaymentReference("AB"), isNotNull);
      expect(
        paymentRequestHasRequiredProof(
          paymentReference: "1234",
          note: "",
        ),
        isTrue,
      );
      expect(
        paymentRequestHasRequiredProof(
          paymentReference: "",
          note: "تفاصيل كافية للحوالة",
        ),
        isTrue,
      );
      expect(
        paymentRequestHasRequiredProof(
          paymentReference: "",
          note: "قصير",
          proofImageBase64: "data:image/png;base64,abc",
        ),
        isTrue,
      );
      expect(
        paymentRequestHasRequiredProof(
          paymentReference: "12",
          note: "قصير",
        ),
        isFalse,
      );
    });

    test("profile selection validation", () {
      expect(
        validateProfileSelections(interests: [], learningGoals: ["career"]),
        isNotNull,
      );
      expect(
        validateProfileSelections(
          interests: ["programming"],
          learningGoals: ["career"],
        ),
        isNull,
      );
    });
  });

  test("activation error codes map to Arabic", () {
    expect(codeToArabic("INVALID_CODE"), contains("غير صالح"));
    expect(codeToArabic("CODE_EXPIRED"), contains("صلاحية"));
    expect(codeToArabic("PENDING_EXISTS"), contains("قيد المراجعة"));
  });
}
