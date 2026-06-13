import "package:flutter/material.dart";
import "package:url_launcher/url_launcher.dart";
import "package:youtube_player_iframe/youtube_player_iframe.dart";

import "../../../core/theme/app_colors.dart";
import "../../../core/widgets/app_button.dart";
import "../../../core/widgets/app_card.dart";

bool isValidYoutubeVideoId(String? id) {
  if (id == null || id.trim().isEmpty) return false;
  return RegExp(r"^[a-zA-Z0-9_-]{11}$").hasMatch(id.trim());
}

/// مشغّل YouTube — origin صحيح لتجنّب خطأ 152 على Android.
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
  YoutubePlayerController? _controller;
  String? _loadedId;
  bool _embedFailed = false;

  static const _embedParams = YoutubePlayerParams(
    showFullscreenButton: true,
    strictRelatedVideos: true,
    enableJavaScript: true,
    playsInline: true,
    // مطلوب على Android WebView — يقلّل خطأ 152 / 153.
    origin: "https://www.youtube-nocookie.com",
  );

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
      _disposeController();
      setState(() {
        _loadedId = null;
        _embedFailed = false;
      });
      return;
    }

    if (id == _loadedId && _controller != null) return;

    _disposeController();

    try {
      final controller = YoutubePlayerController(
        params: _embedParams,
        key: id,
      );
      controller.cueVideoById(videoId: id!);
      controller.listen((value) {
        if (!mounted) return;
        final failed = value.hasError;
        if (failed != _embedFailed) {
          setState(() => _embedFailed = failed);
        }
      });
      _controller = controller;
      _loadedId = id;
      _embedFailed = false;
    } catch (_) {
      _controller = null;
      _loadedId = null;
      _embedFailed = true;
    }
    if (mounted) setState(() {});
  }

  void _disposeController() {
    _controller?.close();
    _controller = null;
    _loadedId = null;
    _embedFailed = false;
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
  void dispose() {
    _disposeController();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final valid = isValidYoutubeVideoId(widget.videoId);
    final showPlayer =
        valid && _controller != null && !_embedFailed;

    final player = AspectRatio(
      aspectRatio: 16 / 9,
      child: !valid
          ? _placeholder(
              message: "لا يوجد فيديو لهذا الدرس بعد.",
              onDark: widget.embeddedInHero,
            )
          : showPlayer
          ? YoutubePlayer(controller: _controller!, aspectRatio: 16 / 9)
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
