import "package:flutter/material.dart";
import "package:url_launcher/url_launcher.dart";

import "../../core/constants/legal_urls.dart";
import "../../core/theme/app_colors.dart";
import "../../core/widgets/account_page_header.dart";
import "../../core/widgets/app_screen.dart";
import "../../core/widgets/legal_link_row.dart";

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  /// Reader / learning companion FAQs — no payment or marketplace copy.
  static const _faqs = [
    (
      "لماذا لا يظهر الكورس في كورساتي؟",
      "يظهر في «كورساتي» فقط ما هو مسجّل في حسابك. راجع الإشعارات أو تواصل مع الدعم إن كنت تتوقع كورسًا.",
    ),
    (
      "كيف أتابع التعلّم؟",
      "من «كورساتي» افتح الكورس ثم «متابعة التعلّم» لمشاهدة الدروس وتتبع التقدّم.",
    ),
    (
      "كيف أغيّر كلمة المرور؟",
      "من الإعدادات اختر «تغيير كلمة المرور» واتبع خطوات استعادة كلمة المرور عبر البريد.",
    ),
    (
      "كيف أعدّل ملفي الشخصي؟",
      "من حسابي اختر «الملف الشخصي» وعدّل الاهتمامات والأهداف وبيانات التواصل ثم احفظ.",
    ),
    (
      "كيف أتواصل مع الإدارة؟",
      "راسلنا على support@studyhouse.app أو من خلال روابط المساعدة والسياسات أدناه.",
    ),
  ];

  Future<void> _emailSupport() async {
    final uri = Uri.parse(LegalUrls.supportEmail);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScreen(
      showAppBar: true,
      title: "مركز التعليمات",
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AccountPageHeader(
            title: "مركز التعليمات",
            description: "إجابات سريعة عن استخدام التطبيق.",
          ),
          const SizedBox(height: 16),
          ..._faqs.map(
            (faq) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: AppColors.border),
              ),
              child: ExpansionTile(
                title: Text(
                  faq.$1,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: Text(faq.$2),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: _emailSupport,
            child: const Text(
              "support@studyhouse.app",
              style: TextStyle(color: AppColors.orange),
            ),
          ),
          const LegalLinkRow(),
        ],
      ),
    );
  }
}
