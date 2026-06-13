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
