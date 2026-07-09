import "auth_user.dart";

sealed class SessionValidationResult {
  const SessionValidationResult();
}

class SessionValid extends SessionValidationResult {
  const SessionValid(this.user);

  final AuthUser user;
}

class SessionNoToken extends SessionValidationResult {
  const SessionNoToken();
}

class SessionInvalid extends SessionValidationResult {
  const SessionInvalid({this.message});

  final String? message;
}

class SessionNotStudent extends SessionValidationResult {
  const SessionNotStudent();
}

class SessionNotActive extends SessionValidationResult {
  const SessionNotActive(this.message);

  final String message;
}

/// Token exists but session could not be restored (e.g. transient network error).
/// Token is preserved so the user can retry without re-entering credentials.
class SessionRestoreFailed extends SessionValidationResult {
  const SessionRestoreFailed({this.message});

  final String? message;
}
