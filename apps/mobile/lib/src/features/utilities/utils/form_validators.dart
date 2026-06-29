String? validateActivationCode(String? value) {
  final code = value?.trim() ?? "";
  if (code.isEmpty) return "أدخل كود التفعيل.";
  if (code.length < 4) return "كود التفعيل قصير جدًا.";
  if (code.length > 64) return "كود التفعيل طويل جدًا.";
  return null;
}

String? validatePaymentAmount(String? value) {
  final raw = value?.trim() ?? "";
  if (raw.isEmpty) return "أدخل المبلغ المدفوع.";
  final amount = double.tryParse(raw.replaceAll(",", "."));
  if (amount == null || amount <= 0) return "المبلغ غير صالح.";
  if (amount > 99999) return "المبلغ كبير جدًا.";
  return null;
}

String? validateOptionalPaymentReference(String? value) {
  final ref = value?.trim() ?? "";
  if (ref.isEmpty) return null;
  if (ref.length < 3) return "رقم المرجع قصير جدًا.";
  if (ref.length > 200) return "رقم المرجع طويل جدًا.";
  return null;
}

/// يطابق تحقق الويب: مرجع ≥4 أو ملاحظة ≥8 أو صورة إيصال.
bool paymentRequestHasRequiredProof({
  required String paymentReference,
  required String note,
  String? proofImageBase64,
}) {
  final refOk = paymentReference.trim().length >= 4;
  final noteOk = note.trim().length >= 8;
  final imgOk = proofImageBase64?.startsWith("data:image/") ?? false;
  return refOk || noteOk || imgOk;
}

String paymentRequestProofValidationMessage() {
  return "أدخل رقم العملية، أو اكتب تفاصيل الحوالة، أو أرفق صورة الإيصال.";
}

String? validateOptionalPhone(String? value) {
  final phone = value?.trim() ?? "";
  if (phone.isEmpty) return null;
  if (phone.length < 7) return "رقم الهاتف قصير جدًا.";
  if (phone.length > 20) return "رقم الهاتف طويل جدًا.";
  if (!RegExp(r"^[\d\s+()-]+$").hasMatch(phone)) {
    return "صيغة رقم الهاتف غير صالحة.";
  }
  return null;
}

String? validateOptionalCountry(String? value) {
  final country = value?.trim() ?? "";
  if (country.isEmpty) return null;
  if (country.length < 2) return "اسم الدولة قصير جدًا.";
  if (country.length > 80) return "اسم الدولة طويل جدًا.";
  return null;
}

String? validateProfileSelections({
  required List<String> interests,
  required List<String> learningGoals,
}) {
  if (interests.isEmpty) return "اختر اهتمامًا واحدًا على الأقل.";
  if (interests.length > 10) return "يمكنك اختيار 10 اهتمامات كحد أقصى.";
  if (learningGoals.isEmpty) return "اختر هدفًا واحدًا على الأقل.";
  if (learningGoals.length > 5) return "يمكنك اختيار 5 أهداف كحد أقصى.";
  return null;
}
