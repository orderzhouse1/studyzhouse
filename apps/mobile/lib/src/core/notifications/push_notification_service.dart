import "dart:async";
import "dart:io";

import "package:firebase_core/firebase_core.dart";
import "package:firebase_messaging/firebase_messaging.dart";
import "package:flutter/foundation.dart";
import "package:flutter_local_notifications/flutter_local_notifications.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "firebase_messaging_background.dart";
import "mobile_push_repository.dart";
import "push_diagnostics_store.dart";

const kAndroidDefaultChannelId = "studyzhouse_default";
const kAndroidDefaultChannelName = "STUDYZHOUSE";

class PushNotificationService {
  PushNotificationService({
    required MobilePushRepository repository,
    PushDiagnosticsStore? diagnostics,
  }) : _repository = repository,
       _diagnostics = diagnostics ?? PushDiagnosticsStore();

  final MobilePushRepository _repository;
  final PushDiagnosticsStore _diagnostics;
  final FlutterLocalNotificationsPlugin _local =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;
  bool _firebaseReady = false;
  String? _initError;
  String? _fcmToken;
  String? _apnsToken;
  AuthorizationStatus? _permissionStatus;
  StreamSubscription<String>? _tokenRefreshSub;
  StreamSubscription<RemoteMessage>? _onMessageSub;
  StreamSubscription<RemoteMessage>? _onOpenedSub;

  bool get isFirebaseReady => _firebaseReady;
  String? get initError => _initError;
  String? get fcmToken => _fcmToken;
  String? get apnsToken => _apnsToken;
  AuthorizationStatus? get permissionStatus => _permissionStatus;

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }
      _firebaseReady = true;
    } catch (e) {
      _firebaseReady = false;
      _initError =
          "Firebase.initializeApp failed. Add google-services.json / GoogleService-Info.plist. ($e)";
      await _diagnostics.setLastError(_initError);
      if (kDebugMode) {
        // ignore: avoid_print
        print("[STUDYZHOUSE][FCM] $_initError");
      }
      return;
    }

    // Background handler is also registered from main.dart; safe to set once here
    // if main init failed and service recovers after config is added.
    try {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    } catch (_) {
      /* already registered */
    }

    await _setupLocalNotifications();
    await FirebaseMessaging.instance
        .setForegroundNotificationPresentationOptions(
          alert: true,
          badge: true,
          sound: true,
        );

    await requestPermission();
    await refreshTokens();

    _tokenRefreshSub = FirebaseMessaging.instance.onTokenRefresh.listen((
      token,
    ) async {
      _fcmToken = token;
      await syncTokenWithBackend();
    });

    _onMessageSub = FirebaseMessaging.onMessage.listen(_onForegroundMessage);
    _onOpenedSub = FirebaseMessaging.onMessageOpenedApp.listen(
      _onNotificationOpened,
    );

    final initial = await FirebaseMessaging.instance.getInitialMessage();
    if (initial != null) {
      await _onNotificationOpened(initial);
    }
  }

  Future<void> _setupLocalNotifications() async {
    const androidInit = AndroidInitializationSettings("@mipmap/ic_launcher");
    const iosInit = DarwinInitializationSettings();
    await _local.initialize(
      settings: const InitializationSettings(android: androidInit, iOS: iosInit),
    );

    final androidPlugin = _local
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    await androidPlugin?.createNotificationChannel(
      const AndroidNotificationChannel(
        kAndroidDefaultChannelId,
        kAndroidDefaultChannelName,
        description: "إشعارات تطبيق STUDYZHOUSE",
        importance: Importance.high,
      ),
    );
  }

  Future<AuthorizationStatus> requestPermission() async {
    if (!_firebaseReady) {
      return AuthorizationStatus.notDetermined;
    }
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    _permissionStatus = settings.authorizationStatus;

    if (Platform.isAndroid) {
      final androidPlugin = _local
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >();
      await androidPlugin?.requestNotificationsPermission();
    }

    return _permissionStatus!;
  }

  Future<void> refreshTokens() async {
    if (!_firebaseReady) return;

    if (Platform.isIOS) {
      try {
        _apnsToken = await FirebaseMessaging.instance.getAPNSToken();
      } catch (_) {
        _apnsToken = null;
      }
    }

    try {
      _fcmToken = await FirebaseMessaging.instance.getToken();
    } catch (e) {
      _fcmToken = null;
      await _diagnostics.setLastError("getToken failed: $e");
    }
  }

  /// Registers the current FCM token with the backend when the user is logged in.
  Future<bool> syncTokenWithBackend() async {
    if (!_firebaseReady) {
      await _diagnostics.setBackendStatus("firebase_not_ready");
      return false;
    }
    await refreshTokens();
    final token = _fcmToken;
    if (token == null || token.isEmpty) {
      await _diagnostics.setBackendStatus("no_fcm_token");
      return false;
    }

    try {
      await _repository.registerToken(
        token: token,
        platform: mobilePushPlatformName(),
        deviceInfo: "${Platform.operatingSystem} ${Platform.operatingSystemVersion}",
      );
      await _diagnostics.setBackendStatus("registered");
      await _diagnostics.setLastError(null);
      return true;
    } catch (e) {
      await _diagnostics.setBackendStatus("register_failed");
      await _diagnostics.setLastError(e.toString());
      return false;
    }
  }

  Future<void> unregisterCurrentToken() async {
    final token = _fcmToken;
    if (token == null || token.isEmpty) return;
    try {
      await _repository.deleteToken(token);
      await _diagnostics.setBackendStatus("unregistered");
    } catch (e) {
      await _diagnostics.setLastError("unregister failed: $e");
    }
  }

  Future<void> _onForegroundMessage(RemoteMessage message) async {
    await _diagnostics.setLastForegroundNow();
    final notification = message.notification;
    if (notification == null) return;

    // iOS can present via setForegroundNotificationPresentationOptions.
    // Android needs a local notification while the app is open.
    if (Platform.isAndroid) {
      await _local.show(
        id: notification.hashCode,
        title: notification.title,
        body: notification.body,
        notificationDetails: const NotificationDetails(
          android: AndroidNotificationDetails(
            kAndroidDefaultChannelId,
            kAndroidDefaultChannelName,
            channelDescription: "إشعارات تطبيق STUDYZHOUSE",
            importance: Importance.high,
            priority: Priority.high,
          ),
          iOS: DarwinNotificationDetails(),
        ),
      );
    }
  }

  Future<void> _onNotificationOpened(RemoteMessage message) async {
    await _diagnostics.setLastOpenedNow();
  }

  Future<PushRuntimeDiagnostics> collectDiagnostics() async {
    await refreshTokens();
    final snap = await _diagnostics.read();
    return PushRuntimeDiagnostics(
      platform: mobilePushPlatformName(),
      firebaseReady: _firebaseReady,
      initError: _initError,
      permissionStatus: _permissionStatus?.name ?? "unknown",
      fcmTokenExists: _fcmToken != null && _fcmToken!.isNotEmpty,
      maskedFcmToken: maskToken(_fcmToken),
      apnsTokenExists: Platform.isIOS
          ? (_apnsToken != null && _apnsToken!.isNotEmpty)
          : null,
      backendStatus: snap.backendStatus ?? "unknown",
      lastForegroundIso: snap.lastForegroundIso,
      lastOpenedIso: snap.lastOpenedIso,
      lastError: snap.lastError,
    );
  }

  Future<void> dispose() async {
    await _tokenRefreshSub?.cancel();
    await _onMessageSub?.cancel();
    await _onOpenedSub?.cancel();
  }
}

class PushRuntimeDiagnostics {
  const PushRuntimeDiagnostics({
    required this.platform,
    required this.firebaseReady,
    required this.permissionStatus,
    required this.fcmTokenExists,
    required this.maskedFcmToken,
    required this.backendStatus,
    this.apnsTokenExists,
    this.initError,
    this.lastForegroundIso,
    this.lastOpenedIso,
    this.lastError,
  });

  final String platform;
  final bool firebaseReady;
  final String? initError;
  final String permissionStatus;
  final bool fcmTokenExists;
  final String maskedFcmToken;
  final bool? apnsTokenExists;
  final String backendStatus;
  final String? lastForegroundIso;
  final String? lastOpenedIso;
  final String? lastError;
}

final pushNotificationServiceProvider = Provider<PushNotificationService>((
  ref,
) {
  final service = PushNotificationService(
    repository: ref.watch(mobilePushRepositoryProvider),
  );
  ref.onDispose(() {
    unawaited(service.dispose());
  });
  return service;
});
