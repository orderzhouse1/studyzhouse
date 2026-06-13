import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:intl/intl.dart";
import "package:url_launcher/url_launcher.dart";

import "../../core/network/api_exception.dart";
import "../../core/theme/app_colors.dart";
import "../../core/utils/action_url_mapper.dart";
import "../../core/widgets/account_page_header.dart";
import "../../core/widgets/app_button.dart";
import "../../core/widgets/app_card.dart";
import "../../core/widgets/app_screen.dart";
import "../../core/widgets/loading_view.dart";
import "models/notification_item.dart";
import "repositories/student_utilities_repository.dart";

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  bool _loading = true;
  String? _error;
  List<AppNotification> _items = [];
  int _unread = 0;
  bool _markingAll = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await ref
          .read(studentUtilitiesRepositoryProvider)
          .listNotifications();
      if (!mounted) return;
      setState(() {
        _items = result.items;
        _unread = result.unreadCount;
        _loading = false;
      });
      ref.invalidate(notificationsUnreadProvider);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = "تعذّر تحميل الإشعارات.";
        _loading = false;
      });
    }
  }

  Future<void> _markAllRead() async {
    setState(() => _markingAll = true);
    try {
      await ref
          .read(studentUtilitiesRepositoryProvider)
          .markAllNotificationsRead();
      await _load();
    } finally {
      if (mounted) setState(() => _markingAll = false);
    }
  }

  Future<void> _onTap(AppNotification item) async {
    if (!item.isRead) {
      try {
        await ref
            .read(studentUtilitiesRepositoryProvider)
            .markNotificationRead(item.id);
      } catch (_) {}
      setState(() {
        final i = _items.indexWhere((n) => n.id == item.id);
        if (i >= 0) {
          _items[i] = item.copyWithRead();
          _unread = (_unread - 1).clamp(0, 9999);
        }
      });
      ref.invalidate(notificationsUnreadProvider);
    }

    final url = item.actionUrl;
    if (url == null || url.isEmpty) return;
    if (isExternalUrl(url)) {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
      return;
    }
    final route = mapActionUrlToMobileRoute(url);
    if (route != null && mounted) context.push(route);
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return DateFormat("d MMM y، HH:mm", "ar").format(dt);
    } catch (_) {
      return iso;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScreen(
      showAppBar: true,
      title: "الإشعارات",
      actions: _unread > 0
          ? [
              TextButton(
                onPressed: _markingAll ? null : _markAllRead,
                child: _markingAll
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text("تحديد الكل كمقروء"),
              ),
            ]
          : null,
      child: _loading
          ? const LoadingView(message: "جاري تحميل الإشعارات…")
          : _error != null
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_error!),
                  const SizedBox(height: 12),
                  AppButton(label: "إعادة المحاولة", onPressed: _load),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                children: [
                  AccountPageHeader(
                    title: "الإشعارات",
                    description: _unread > 0
                        ? "لديك $_unread إشعار غير مقروء"
                        : "لا توجد إشعارات غير مقروءة",
                  ),
                  const SizedBox(height: 16),
                  if (_items.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: Text(
                        "لا توجد إشعارات بعد.",
                        textAlign: TextAlign.center,
                      ),
                    )
                  else
                    ..._items.map((n) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: AppCard(
                          child: InkWell(
                            onTap: () => _onTap(n),
                            borderRadius: BorderRadius.circular(14),
                            child: Padding(
                              padding: const EdgeInsets.all(4),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    n.isRead
                                        ? Icons.notifications_none
                                        : Icons.notifications_active,
                                    color: n.isRead
                                        ? AppColors.textSecondary
                                        : AppColors.orange,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          n.title,
                                          style: Theme.of(context)
                                              .textTheme
                                              .titleSmall
                                              ?.copyWith(
                                                fontWeight: n.isRead
                                                    ? FontWeight.normal
                                                    : FontWeight.bold,
                                              ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(n.body),
                                        const SizedBox(height: 4),
                                        Text(
                                          _formatDate(n.createdAt),
                                          style: Theme.of(
                                            context,
                                          ).textTheme.bodySmall,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
