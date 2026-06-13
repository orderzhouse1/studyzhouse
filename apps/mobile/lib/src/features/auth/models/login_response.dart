import "auth_user.dart";

class LoginResponse {
  const LoginResponse({required this.user, required this.accessToken});

  final AuthUser user;
  final String accessToken;

  factory LoginResponse.fromEnvelope(Map<String, dynamic> json) {
    if (json["success"] != true) {
      throw const FormatException("Login response was not successful.");
    }
    final data = json["data"];
    if (data is! Map<String, dynamic>) {
      throw const FormatException("Missing login data.");
    }
    return LoginResponse.fromJson(data);
  }

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      user: AuthUser.fromJson(json["user"] as Map<String, dynamic>),
      accessToken: json["accessToken"] as String,
    );
  }
}
