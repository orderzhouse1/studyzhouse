import "package:cached_network_image/cached_network_image.dart";
import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../config/app_config.dart";
import "../theme/app_colors.dart";
import "../utils/absolute_api_asset_url.dart";

class CourseThumbnail extends ConsumerWidget {
  const CourseThumbnail({
    this.thumbnailUrl,
    super.key,
    this.aspectRatio = 16 / 10,
    this.borderRadius = 12,
  });

  final String? thumbnailUrl;
  final double aspectRatio;
  final double borderRadius;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apiBase = ref.watch(appConfigProvider).apiBaseUrl;
    final absolute = absoluteApiAssetUrl(thumbnailUrl, apiBaseUrl: apiBase);

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: AspectRatio(
        aspectRatio: aspectRatio,
        child: absolute == null
            ? _placeholder()
            : CachedNetworkImage(
                imageUrl: absolute,
                fit: BoxFit.cover,
                placeholder: (_, _) => _placeholder(),
                errorWidget: (_, _, _) => _placeholder(),
              ),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: AppColors.surfaceMuted,
      child: const Center(
        child: Icon(Icons.menu_book_rounded, color: AppColors.orange, size: 40),
      ),
    );
  }
}
