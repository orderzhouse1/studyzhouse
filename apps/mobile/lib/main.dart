import "package:flutter/foundation.dart";
import "package:flutter/material.dart";
import "package:flutter_dotenv/flutter_dotenv.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:firebase_core/firebase_core.dart";
import "package:firebase_messaging/firebase_messaging.dart";

import "src/app/app.dart";
import "src/core/config/app_config.dart" show AppConfig, appConfigProvider;
import "src/core/notifications/firebase_messaging_background.dart";

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: ".env", isOptional: true);

  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (e) {
    if (kDebugMode) {
      // ignore: avoid_print
      print(
        "[STUDYZHOUSE] Firebase init skipped/failed (add google-services.json "
        "/ GoogleService-Info.plist for push): $e",
      );
    }
  }

  final config = AppConfig.resolve();
  if (kDebugMode) {
    // ignore: avoid_print
    print("[STUDYZHOUSE] API_BASE_URL=${config.apiBaseUrl}");
  }

  runApp(
    ProviderScope(
      overrides: [appConfigProvider.overrideWithValue(config)],
      child: const StudyZHouseApp(),
    ),
  );
}
