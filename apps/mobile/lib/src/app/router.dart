import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../features/auth/forgot_password_screen.dart";
import "../features/auth/login_screen.dart";
import "../features/auth/signup_screen.dart";
import "../features/courses/course_detail_screen.dart";
import "../features/courses/explore_courses_screen.dart";
import "../features/learn/learn_screen.dart";
import "../features/my_courses/my_courses_tab_screen.dart";
import "../features/courses/saved_courses_screen.dart";
import "../features/home/home_screen.dart";
import "../features/profile/profile_screen.dart";
import "../features/splash/splash_screen.dart";
import "../features/utilities/help_screen.dart";
import "../features/utilities/notifications_screen.dart";
import "../features/utilities/profile_edit_screen.dart";
import "../features/utilities/purchases_screen.dart";
import "../features/utilities/redeem_screen.dart";
import "../features/utilities/settings_screen.dart";
import "student_shell.dart";

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: "/splash",
    routes: [
      GoRoute(
        path: "/splash",
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: "/login",
        builder: (context, state) =>
            LoginScreen(flashMessage: state.uri.queryParameters["message"]),
      ),
      GoRoute(
        path: "/signup",
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: "/forgot-password",
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: "/saved",
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const SavedCoursesScreen(),
      ),
      GoRoute(
        path: "/learn/:slug",
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => LearnScreen(
          courseSlug: state.pathParameters["slug"]!,
          initialLessonId: state.uri.queryParameters["lessonId"],
        ),
      ),
      GoRoute(
        path: "/redeem",
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const RedeemScreen(),
      ),
      GoRoute(
        path: "/purchases",
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const PurchasesScreen(),
      ),
      GoRoute(
        path: "/notifications",
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: "/profile/edit",
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const ProfileEditScreen(),
      ),
      GoRoute(
        path: "/settings",
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: "/help",
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const HelpScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return StudentShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: "/home",
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: "/my-courses",
                builder: (context, state) => const MyCoursesTabScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: "/courses",
                builder: (context, state) => ExploreCoursesScreen(
                  initialCategorySlug:
                      state.uri.queryParameters["categorySlug"],
                ),
                routes: [
                  GoRoute(
                    path: ":slug",
                    builder: (context, state) =>
                        CourseDetailScreen(slug: state.pathParameters["slug"]!),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: "/profile",
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
