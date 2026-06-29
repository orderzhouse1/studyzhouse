import "package:dio/dio.dart";

import "../network/api_exception.dart";

const studentOnlyMessage = "هذا التطبيق مخصص للطلاب فقط.";

String messageFromDioError(DioException error) {
  final parsed = parseApiErrorEnvelope(error.response?.data);
  if (parsed != null) {
    if (parsed.message.isNotEmpty) return parsed.message;
    if (parsed.code != null) return codeToArabic(parsed.code!);
  }

  switch (error.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.receiveTimeout:
    case DioExceptionType.sendTimeout:
      return "انتهت مهلة الاتصال. حاول مرة أخرى.";
    case DioExceptionType.connectionError:
      return "تعذّر الاتصال بالخادم. تحقق من الإنترنت.";
    default:
      break;
  }

  final status = error.response?.statusCode;
  if (status == 401) return "يجب تسجيل الدخول.";
  if (status != null && status >= 500) {
    return "خطأ في الخادم. حاول لاحقًا.";
  }

  return "حدث خطأ غير متوقع.";
}

ApiException apiExceptionFromDio(DioException error) {
  final parsed = parseApiErrorEnvelope(error.response?.data);
  return ApiException(
    message: messageFromDioError(error),
    statusCode: error.response?.statusCode,
    code: parsed?.code,
    fieldErrors: parsed?.fieldErrors,
  );
}

class ParsedApiError {
  const ParsedApiError({this.code, required this.message, this.fieldErrors});

  final String? code;
  final String message;
  final Map<String, List<String>>? fieldErrors;
}

ParsedApiError? parseApiErrorEnvelope(Object? data) {
  if (data is! Map<String, dynamic>) return null;
  if (data["success"] != false) return null;
  final err = data["error"];
  if (err is! Map<String, dynamic>) return null;

  final code = err["code"] as String?;
  final message = err["message"] as String? ?? "";
  Map<String, List<String>>? fieldErrors;

  final details = err["details"];
  if (details is Map<String, dynamic>) {
    final raw = details["fieldErrors"];
    if (raw is Map<String, dynamic>) {
      fieldErrors = {};
      for (final entry in raw.entries) {
        final list = entry.value;
        if (list is List) {
          fieldErrors[entry.key] = list.map((e) => e.toString()).toList();
        }
      }
    }
  }

  final resolvedMessage = message.isNotEmpty
      ? message
      : (code != null ? codeToArabic(code) : "حدث خطأ.");

  return ParsedApiError(
    code: code,
    message: resolvedMessage,
    fieldErrors: fieldErrors,
  );
}

String? firstFieldError(Map<String, List<String>>? errors, String key) {
  final list = errors?[key];
  if (list == null || list.isEmpty) return null;
  return list.first;
}

String codeToArabic(String code) {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    case "ACCOUNT_SUSPENDED":
      return "تم تعليق حسابك. تواصل مع الدعم.";
    case "ACCOUNT_NOT_ACTIVE":
      return "حسابك غير مفعّل بعد.";
    case "ACCOUNT_DELETED":
      return "تم تعطيل هذا الحساب. يمكنك التواصل مع الإدارة لاستعادته لاحقًا.";
    case "ACCOUNT_PENDING":
      return "حسابك قيد المراجعة.";
    case "FORBIDDEN":
    case "STUDENT_ONLY":
      return studentOnlyMessage;
    case "VALIDATION_ERROR":
      return "بيانات غير صالحة.";
    case "EMAIL_NOT_CONFIGURED":
      return "إرسال البريد غير متاح حاليًا. حاول لاحقًا.";
    case "OTP_INVALID":
      return "رمز التحقق غير صحيح.";
    case "OTP_EXPIRED":
      return "انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا.";
    case "OTP_ATTEMPTS_EXCEEDED":
      return "تجاوزت عدد المحاولات. اطلب رمزًا جديدًا لاحقًا.";
    case "DUPLICATE_EMAIL":
      return "هذا البريد مسجّل مسبقًا.";
    case "RATE_LIMITED":
      return "محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.";
    case "INVALID_CODE":
      return "كود التفعيل غير صالح أو منتهٍ.";
    case "CODE_INACTIVE":
      return "هذا الكود غير مفعّل.";
    case "CODE_EXPIRED":
      return "انتهت صلاحية هذا الكود.";
    case "CODE_DEPLETED":
      return "استُنفدت عدد مرات استخدام هذا الكود.";
    case "ALREADY_REDEEMED":
      return "سبق أن استخدمت هذا الكود.";
    case "ALREADY_ENROLLED":
      return "أنت مسجّل بالفعل في هذا الكورس.";
    case "CODE_WRONG_COURSE":
      return "هذا الكود لا يخص هذا الكورس.";
    case "COURSE_UNAVAILABLE":
      return "الكورس غير متاح حاليًا.";
    case "PENDING_EXISTS":
      return "لديك طلب دفع قيد المراجعة لهذا الكورس.";
    case "NOT_PAID_COURSE":
      return "هذا الكورس مجاني — لا حاجة لطلب دفع.";
    case "NOT_FREE_COURSE":
      return "هذا الكورس مدفوع.";
    case "UNAUTHORIZED":
      return "يجب تسجيل الدخول.";
    default:
      return "حدث خطأ. حاول مرة أخرى.";
  }
}
