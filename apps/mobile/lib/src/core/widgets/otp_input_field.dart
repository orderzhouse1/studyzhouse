import "package:flutter/material.dart";
import "package:flutter/services.dart";

class OtpInputField extends StatelessWidget {
  const OtpInputField({required this.controller, super.key, this.onSubmitted});

  final TextEditingController controller;
  final VoidCallback? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: TextInputType.number,
      textInputAction: TextInputAction.done,
      textAlign: TextAlign.center,
      maxLength: 6,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      onFieldSubmitted: (_) => onSubmitted?.call(),
      decoration: const InputDecoration(
        labelText: "رمز التحقق (6 أرقام)",
        hintText: "000000",
        counterText: "",
      ),
      validator: (value) {
        final v = value?.trim() ?? "";
        if (!RegExp(r"^\d{6}$").hasMatch(v)) {
          return "رمز التحقق يجب أن يكون 6 أرقام.";
        }
        return null;
      },
    );
  }
}
