import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../features/auth/models/auth_user.dart";

final currentUserProvider = StateProvider<AuthUser?>((ref) => null);
