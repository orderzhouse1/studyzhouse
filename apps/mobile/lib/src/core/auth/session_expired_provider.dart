import "package:flutter_riverpod/flutter_riverpod.dart";

/// Set to true when a protected API call returns 401 — app listens and routes to login.
final sessionExpiredProvider = StateProvider<bool>((ref) => false);
