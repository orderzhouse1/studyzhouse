import "package:firebase_messaging/firebase_messaging.dart";
import "package:flutter/foundation.dart";

/// Must be a top-level function for background isolates.
@pragma("vm:entry-point")
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Native OS already shows the notification tray entry when a `notification`
  // payload is present. Keep this handler light; diagnostics are updated when
  // the app opens from a tap via getInitialMessage / onMessageOpenedApp.
  if (kDebugMode) {
    // ignore: avoid_print
    print(
      "[STUDYZHOUSE][FCM][bg] id=${message.messageId} "
      "title=${message.notification?.title}",
    );
  }
}
