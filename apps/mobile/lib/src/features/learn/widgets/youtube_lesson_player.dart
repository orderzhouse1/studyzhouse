import "package:flutter/material.dart";
import "package:url_launcher/url_launcher.dart";
import "package:webview_flutter/webview_flutter.dart";

import "../../../core/theme/app_colors.dart";
import "../../../core/widgets/app_button.dart";
import "../../../core/widgets/app_card.dart";

bool isValidYoutubeVideoId(String? id) {
  if (id == null || id.trim().isEmpty) return false;
  return RegExp(r"^[a-zA-Z0-9_-]{11}$").hasMatch(id.trim());
}

/// مشغّل YouTube عبر WebView + iframe (نفس أسلوب الويب).
/// baseUrl يوفّر Referer مطلوب من يوتيوب لتجنّب خطأ 152.
class YoutubeLessonPlayer extends StatefulWidget {
  const YoutubeLessonPlayer({
    required this.videoId,
    this.watchUrl,
    this.embeddedInHero = false,
    super.key,
  });

  final String? videoId;
  final String? watchUrl;

  /// داخل الهيدر الكحلي — بدون بطاقة بيضاء.
  final bool embeddedInHero;

  @override
  State<YoutubeLessonPlayer> createState() => _YoutubeLessonPlayerState();
}

class _YoutubeLessonPlayerState extends State<YoutubeLessonPlayer> {
  WebViewController? _controller;
  String? _loadedId;
  bool _embedFailed = false;

  static const _embedBaseUrl = "https://www.youtube-nocookie.com";

  @override
  void didUpdateWidget(YoutubeLessonPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoId != widget.videoId) {
      _loadVideo(widget.videoId);
    }
  }

  @override
  void initState() {
    super.initState();
    _loadVideo(widget.videoId);
  }

  void _loadVideo(String? rawId) {
    final id = rawId?.trim();
    if (!isValidYoutubeVideoId(id)) {
      _controller = null;
      _loadedId = null;
      _embedFailed = false;
      if (mounted) setState(() {});
      return;
    }

    if (id == _loadedId && _controller != null) return;

    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onWebResourceError: (_) {
            if (!mounted) return;
            setState(() => _embedFailed = true);
          },
        ),
      )
      ..loadHtmlString(_embedHtml(id!), baseUrl: _embedBaseUrl);

    _controller = controller;
    _loadedId = id;
    _embedFailed = false;
    if (mounted) setState(() {});
  }

  static String _embedHtml(String videoId) {
    final src =
        "https://www.youtube.com/embed/$videoId"
        "?playsinline=1&rel=0&modestbranding=1&enablejsapi=1";
    return """
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: 0; }
  </style>
</head>
<body>
  <iframe
    src="$src"
    title="YouTube"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    referrerpolicy="strict-origin-when-cross-origin"
  ></iframe>
</body>
</html>
""";
  }

  Future<void> _openInYoutube() async {
    final url = widget.watchUrl?.trim();
    final uri = url != null && url.isNotEmpty
        ? Uri.tryParse(url)
        : Uri.tryParse("https://www.youtube.com/watch?v=${widget.videoId}");
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final valid = isValidYoutubeVideoId(widget.videoId);
    final showPlayer = valid && _controller != null && !_embedFailed;

    final player = AspectRatio(
      aspectRatio: 16 / 9,
      child: !valid
          ? _placeholder(
              message: "لا يوجد فيديو لهذا الدرس بعد.",
              onDark: widget.embeddedInHero,
            )
          : showPlayer
          ? WebViewWidget(controller: _controller!)
          : _embedErrorFallback(),
    );

    if (widget.embeddedInHero) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: DecoratedBox(
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.glassBorder),
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: player,
        ),
      );
    }

    return AppCard(
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: player,
      ),
    );
  }

  Widget _embedErrorFallback() {
    return Container(
      color: const Color(0xFF1A1A1A),
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.play_circle_outline,
            color: AppColors.textOnDarkMuted,
            size: 48,
          ),
          const SizedBox(height: 12),
          const Text(
            "تعذّر تشغيل الفيديو داخل التطبيق",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textOnDark,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            "قد يكون التضمين معطّلاً من يوتيوب. افتح الدرس في تطبيق YouTube.",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textOnDarkMuted,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 16),
          AppButton(
            label: "فتح في YouTube",
            onPressed: _openInYoutube,
          ),
        ],
      ),
    );
  }

  Widget _placeholder({required String message, bool onDark = false}) {
    return Container(
      color: onDark ? const Color(0xFF1A1A1A) : AppColors.surfaceMuted,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: onDark
                  ? AppColors.textOnDarkMuted
                  : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}
