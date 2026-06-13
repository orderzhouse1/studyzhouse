import "package:flutter/material.dart";

import "../../../core/theme/app_colors.dart";
import "../models/payment_request.dart";

class StatusBadge extends StatelessWidget {
  const StatusBadge({required this.status, super.key});

  final String status;

  Color get _background {
    switch (status) {
      case "PENDING":
        return const Color(0xFFFFF3E0);
      case "APPROVED":
      case "ACTIVE":
      case "COMPLETED":
        return const Color(0xFFE8F5E9);
      case "REJECTED":
      case "REVOKED":
        return const Color(0xFFFFEBEE);
      default:
        return AppColors.surface;
    }
  }

  Color get _foreground {
    switch (status) {
      case "PENDING":
        return const Color(0xFFE65100);
      case "APPROVED":
      case "ACTIVE":
      case "COMPLETED":
        return const Color(0xFF2E7D32);
      case "REJECTED":
      case "REVOKED":
        return const Color(0xFFC62828);
      default:
        return AppColors.navy;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        paymentStatusLabelAr(status),
        style: TextStyle(
          color: _foreground,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
