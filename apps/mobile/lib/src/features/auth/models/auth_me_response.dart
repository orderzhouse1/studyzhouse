import "auth_user.dart";

class AuthMeResponse {
  const AuthMeResponse({required this.user});

  final AuthUser user;

  factory AuthMeResponse.fromEnvelope(Map<String, dynamic> json) {
    if (json["success"] != true) {
      throw const FormatException("Auth me was not successful.");
    }
    final data = json["data"];
    if (data is! Map<String, dynamic>) {
      throw const FormatException("Missing auth me data.");
    }
    return AuthMeResponse(
      user: AuthUser.fromJson(data["user"] as Map<String, dynamic>),
    );
  }
}
