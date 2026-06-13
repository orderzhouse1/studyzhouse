import "package:flutter/foundation.dart";
import "package:flutter/material.dart";
import "package:flutter_dotenv/flutter_dotenv.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "src/app/app.dart";
import "src/core/config/app_config.dart" show AppConfig, appConfigProvider;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: ".env", isOptional: true);

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
