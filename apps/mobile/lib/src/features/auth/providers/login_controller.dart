import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/network/api_exception.dart";
import "../auth_repository.dart";
import "../models/auth_user.dart";

class LoginState {
  const LoginState({this.isLoading = false, this.errorMessage, this.user});

  final bool isLoading;
  final String? errorMessage;
  final AuthUser? user;

  LoginState copyWith({
    bool? isLoading,
    String? errorMessage,
    AuthUser? user,
    bool clearError = false,
  }) {
    return LoginState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      user: user ?? this.user,
    );
  }
}

class LoginController extends StateNotifier<LoginState> {
  LoginController(this._repository) : super(const LoginState());

  final AuthRepository _repository;

  Future<bool> submit({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.login(email: email, password: password);
      state = LoginState(isLoading: false, user: result.user);
      return true;
    } on ApiException catch (e) {
      state = LoginState(isLoading: false, errorMessage: e.message);
      return false;
    } catch (_) {
      state = const LoginState(
        isLoading: false,
        errorMessage: "تعذّر تسجيل الدخول.",
      );
      return false;
    }
  }
}

final loginControllerProvider =
    StateNotifierProvider<LoginController, LoginState>((ref) {
      return LoginController(ref.watch(authRepositoryProvider));
    });
