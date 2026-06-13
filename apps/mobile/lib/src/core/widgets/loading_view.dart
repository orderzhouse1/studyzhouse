import "package:flutter/material.dart";

import "brand_loading_indicator.dart";

/// تحميل مركّز بلوجو الشركة (نبض شفافية).
class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.message, this.expand = true});

  final String? message;

  /// `false` عند وضع التحميل داخل `SafeArea` أو حاوية محددة.
  final bool expand;

  @override
  Widget build(BuildContext context) {
    return BrandLoadingIndicator(
      message: message,
      expand: expand,
    );
  }
}
