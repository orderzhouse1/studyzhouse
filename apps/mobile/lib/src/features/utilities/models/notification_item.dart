class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    this.actionUrl,
    this.readAt,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final String? actionUrl;
  final String? readAt;
  final String createdAt;

  bool get isRead => readAt != null;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json["id"] as String,
      type: json["type"] as String? ?? "SYSTEM",
      title: json["title"] as String,
      body: json["body"] as String,
      actionUrl: json["actionUrl"] as String?,
      readAt: json["readAt"] as String?,
      createdAt: json["createdAt"] as String,
    );
  }

  AppNotification copyWithRead() {
    return AppNotification(
      id: id,
      type: type,
      title: title,
      body: body,
      actionUrl: actionUrl,
      readAt: DateTime.now().toUtc().toIso8601String(),
      createdAt: createdAt,
    );
  }
}

class NotificationsListResult {
  const NotificationsListResult({
    required this.items,
    required this.unreadCount,
  });

  final List<AppNotification> items;
  final int unreadCount;

  factory NotificationsListResult.fromEnvelope(Map<String, dynamic> json) {
    if (json["success"] != true) throw const FormatException();
    final data = json["data"] as Map<String, dynamic>? ?? {};
    final list = data["items"] as List<dynamic>? ?? [];
    return NotificationsListResult(
      items: list
          .whereType<Map<String, dynamic>>()
          .map(AppNotification.fromJson)
          .toList(),
      unreadCount: (data["unreadCount"] as num?)?.toInt() ?? 0,
    );
  }
}
