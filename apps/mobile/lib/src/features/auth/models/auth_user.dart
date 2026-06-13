/// Mirrors API `authUserSchema` — hand-written for Phase 1; migrate to freezed in Phase 2.
class AuthUser {
  const AuthUser({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    required this.status,
    this.avatarUrl,
  });

  final String id;
  final String fullName;
  final String email;
  final String role;
  final String status;
  final String? avatarUrl;

  bool get isStudent => role == "STUDENT";

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json["id"] as String,
      fullName: json["fullName"] as String,
      email: json["email"] as String,
      role: json["role"] as String,
      status: json["status"] as String,
      avatarUrl: json["avatarUrl"] as String?,
    );
  }
}
