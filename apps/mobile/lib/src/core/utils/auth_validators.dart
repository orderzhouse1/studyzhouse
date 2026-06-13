String? validateRequired(String? value, String message) {
  if (value == null || value.trim().isEmpty) return message;
  return null;
}

String? validateEmail(String? value) {
  final v = value?.trim() ?? "";
  if (v.isEmpty) return "أدخل البريد الإلكتروني.";
  final emailRegex = RegExp(r"^[^\s@]+@[^\s@]+\.[^\s@]+$");
  if (!emailRegex.hasMatch(v)) return "البريد الإلكتروني غير صالح.";
  return null;
}

String? validatePassword(String? value) {
  final v = value ?? "";
  if (v.isEmpty) return "أدخل كلمة المرور.";
  if (v.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل.";
  if (v.length > 128) return "كلمة المرور طويلة جدًا.";
  if (!RegExp(r"[a-zA-Z\u0600-\u06FF]").hasMatch(v)) {
    return "كلمة المرور يجب أن تحتوي على حرف واحد على الأقل.";
  }
  if (!RegExp(r"\d").hasMatch(v)) {
    return "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل.";
  }
  return null;
}

String? validateConfirmPassword(String? password, String? confirm) {
  if (confirm == null || confirm.isEmpty) return "أكّد كلمة المرور.";
  if (confirm != password) return "تأكيد كلمة المرور غير متطابق.";
  return null;
}

String? validateOtpCode(String? value) {
  final v = value?.trim() ?? "";
  if (!RegExp(r"^\d{6}$").hasMatch(v)) {
    return "رمز التحقق يجب أن يكون 6 أرقام.";
  }
  return null;
}

String? validateFullName(String? value) {
  final v = value?.trim() ?? "";
  if (v.length < 2) return "الاسم قصير جدًا.";
  if (v.length > 120) return "الاسم طويل جدًا.";
  return null;
}
