import "package:flutter/material.dart";

import "../theme/app_colors.dart";

/// شعار STUDYZHOUSE مع نبض شفافية سلس في منتصف الشاشة.
class BrandLoadingIndicator extends StatefulWidget {
  const BrandLoadingIndicator({
    super.key,
    this.message,
    this.logoSize = 88,
    this.expand = false,
    this.minHeight,
  });

  final String? message;
  final double logoSize;

  /// يملأ المساحة المتاحة ويوسّط الشعار.
  final bool expand;

  /// ارتفاع أدنى عند التحميل داخل قائمة (مثل قسم جزئي).
  final double? minHeight;

  @override
  State<BrandLoadingIndicator> createState() => _BrandLoadingIndicatorState();
}

class _BrandLoadingIndicatorState extends State<BrandLoadingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _opacity = Tween<double>(begin: 0.38, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final content = Column(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        FadeTransition(
          opacity: _opacity,
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.navy,
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: AppColors.navy.withValues(alpha: 0.12),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Image.asset(
              "assets/branding/studyhouse_logo.png",
              width: widget.logoSize,
              height: widget.logoSize,
              fit: BoxFit.contain,
              filterQuality: FilterQuality.medium,
            ),
          ),
        ),
        if (widget.message != null && widget.message!.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text(
            widget.message!,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ],
    );

    if (widget.expand) {
      return ColoredBox(
        color: AppColors.canvas,
        child: Center(child: content),
      );
    }

    final minH = widget.minHeight ?? 240;
    return SizedBox(
      width: double.infinity,
      height: minH,
      child: Center(child: content),
    );
  }
}

/// تحميل صفحة كاملة — بديل السكيلتون.
class AppPageLoading extends StatelessWidget {
  const AppPageLoading({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    return BrandLoadingIndicator(message: message, expand: true);
  }
}
