import "package:flutter_riverpod/flutter_riverpod.dart";

import "push_notification_service.dart";

/// Initializes FCM listeners and registers the device token when a session exists.
Future<void> bootstrapMobilePush(WidgetRef ref) async {
  final push = ref.read(pushNotificationServiceProvider);
  await push.initialize();
  await push.syncTokenWithBackend();
}

Future<void> unregisterMobilePushOnLogout(WidgetRef ref) async {
  final push = ref.read(pushNotificationServiceProvider);
  await push.unregisterCurrentToken();
}
