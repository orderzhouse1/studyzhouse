import "package:shared_preferences/shared_preferences.dart";

class PushDiagnosticsStore {
  static const _kLastForeground = "push_diag_last_foreground_iso";
  static const _kLastOpened = "push_diag_last_opened_iso";
  static const _kBackendStatus = "push_diag_backend_status";
  static const _kLastError = "push_diag_last_error";

  Future<void> setLastForegroundNow() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kLastForeground, DateTime.now().toIso8601String());
  }

  Future<void> setLastOpenedNow() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kLastOpened, DateTime.now().toIso8601String());
  }

  Future<void> setBackendStatus(String status) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kBackendStatus, status);
  }

  Future<void> setLastError(String? error) async {
    final prefs = await SharedPreferences.getInstance();
    if (error == null || error.isEmpty) {
      await prefs.remove(_kLastError);
    } else {
      await prefs.setString(_kLastError, error);
    }
  }

  Future<PushDiagnosticsSnapshot> read() async {
    final prefs = await SharedPreferences.getInstance();
    return PushDiagnosticsSnapshot(
      lastForegroundIso: prefs.getString(_kLastForeground),
      lastOpenedIso: prefs.getString(_kLastOpened),
      backendStatus: prefs.getString(_kBackendStatus),
      lastError: prefs.getString(_kLastError),
    );
  }
}

class PushDiagnosticsSnapshot {
  const PushDiagnosticsSnapshot({
    this.lastForegroundIso,
    this.lastOpenedIso,
    this.backendStatus,
    this.lastError,
  });

  final String? lastForegroundIso;
  final String? lastOpenedIso;
  final String? backendStatus;
  final String? lastError;
}

String maskToken(String? token) {
  if (token == null || token.isEmpty) return "—";
  if (token.length <= 12) return "***";
  return "${token.substring(0, 6)}…${token.substring(token.length - 4)}";
}
