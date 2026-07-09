import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../core/network/api_exception.dart";
import "../../core/network/pagination_meta.dart";
import "../../core/platform/ios_course_policy.dart";
import "../../core/theme/app_colors.dart";
import "../../core/widgets/app_filter_chip.dart";
import "../../core/widgets/error_state.dart";
import "../../core/widgets/brand_loading_indicator.dart";
import "models/category.dart";
import "models/course.dart";
import "providers/saved_course_ids_provider.dart";
import "repositories/course_repository.dart";
import "widgets/course_catalog_card.dart";
import "widgets/explore_category_chips.dart";
import "widgets/explore_courses_page_header.dart";

class ExploreCoursesScreen extends ConsumerStatefulWidget {
  const ExploreCoursesScreen({this.initialCategorySlug, super.key});

  /// من مسار `/courses?categorySlug=...` (مثلاً من الهوم).
  final String? initialCategorySlug;

  @override
  ConsumerState<ExploreCoursesScreen> createState() =>
      _ExploreCoursesScreenState();
}

class _ExploreCoursesScreenState extends ConsumerState<ExploreCoursesScreen> {
  final _searchController = TextEditingController();
  List<Category> _categories = [];
  List<Course> _courses = [];
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;
  int _page = 1;
  bool _hasMore = false;
  String? _categorySlug;
  String? _pricingType;
  String _search = "";

  @override
  void initState() {
    super.initState();
    _categorySlug = _normalizeCategorySlug(widget.initialCategorySlug);
    _loadInitial();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(savedCourseIdsProvider.notifier).refresh();
    });
  }

  @override
  void didUpdateWidget(ExploreCoursesScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    final next = _normalizeCategorySlug(widget.initialCategorySlug);
    if (next == _categorySlug) return;
    setState(() => _categorySlug = next);
    _loadInitial();
  }

  String? _normalizeCategorySlug(String? slug) {
    if (slug == null || slug.trim().isEmpty) return null;
    return slug.trim();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInitial() async {
    setState(() {
      _loading = true;
      _error = null;
      _page = 1;
    });
    try {
      final repo = ref.read(courseRepositoryProvider);
      final results = await Future.wait([
        repo.listCategories(),
        repo.listCourses(
          page: 1,
          pageSize: 12,
          categorySlug: _categorySlug,
          search: _search.isEmpty ? null : _search,
          pricingType: _pricingType,
        ),
      ]);
      if (!mounted) return;
      setState(() {
        _categories = results[0] as List<Category>;
        final page = results[1] as PaginatedResult<Course>;
        _courses = IosCoursePolicy.filterCoursesForPlatform(page.items);
        _hasMore = page.meta.hasMore;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = "تعذّر تحميل الكورسات";
        _loading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore) return;
    setState(() => _loadingMore = true);
    try {
      final nextPage = _page + 1;
      final page = await ref
          .read(courseRepositoryProvider)
          .listCourses(
            page: nextPage,
            pageSize: 12,
            categorySlug: _categorySlug,
            search: _search.isEmpty ? null : _search,
            pricingType: _pricingType,
          );
      if (!mounted) return;
      setState(() {
        _page = nextPage;
        _courses = [
          ..._courses,
          ...IosCoursePolicy.filterCoursesForPlatform(page.items),
        ];
        _hasMore = page.meta.hasMore;
        _loadingMore = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingMore = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("تعذّر تحميل المزيد")));
    }
  }

  void _applySearch() {
    _search = _searchController.text.trim();
    _loadInitial();
  }

  String? _resultsLabel() {
    if (_loading || _error != null) return null;
    if (_courses.isEmpty) return "لا توجد نتائج مطابقة";
    return "${_courses.length} دورة${_hasMore ? "+" : ""}";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: _loading
          ? const AppPageLoading()
          : _error != null
          ? Column(
              children: [
                ExploreCoursesPageHeader(
                  searchController: _searchController,
                  onSearch: _applySearch,
                ),
                Expanded(
                  child: ErrorState(message: _error!, onRetry: _loadInitial),
                ),
              ],
            )
          : RefreshIndicator(
              color: AppColors.orange,
              onRefresh: _loadInitial,
              child: ListView.builder(
                padding: EdgeInsets.zero,
                itemCount:
                    _courses.length +
                    1 +
                    (_hasMore ? 1 : 0) +
                    (_courses.isEmpty ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == 0) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        ExploreCoursesPageHeader(
                          searchController: _searchController,
                          onSearch: _applySearch,
                          resultsLabel: _resultsLabel(),
                        ),
                        const SizedBox(height: 16),
                        if (_categories.isNotEmpty) ...[
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16),
                            child: Align(
                              alignment: Alignment.centerRight,
                              child: Text(
                                "استكشف الأصناف",
                                style: TextStyle(
                                  color: AppColors.navy,
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          ExploreCategoryChips(
                            categories: _categories,
                            selectedSlug: _categorySlug,
                            onSelected: (slug) {
                              setState(() => _categorySlug = slug);
                              _loadInitial();
                            },
                          ),
                          const SizedBox(height: 14),
                        ],
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: Align(
                            alignment: Alignment.centerRight,
                            child: Text(
                              "نوع السعر",
                              style: TextStyle(
                                color: AppColors.navy,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                if (!IosCoursePolicy.isIOSPlatform) ...[
                                  AppFilterChip(
                                    label: "الكل",
                                    selected: _pricingType == null,
                                    onTap: () {
                                      setState(() => _pricingType = null);
                                      _loadInitial();
                                    },
                                  ),
                                  const SizedBox(width: 8),
                                  AppFilterChip(
                                    label: "مجاني",
                                    selected: _pricingType == "FREE",
                                    onTap: () {
                                      setState(() => _pricingType = "FREE");
                                      _loadInitial();
                                    },
                                  ),
                                  const SizedBox(width: 8),
                                  AppFilterChip(
                                    label: "مدفوع",
                                    selected: _pricingType == "PAID",
                                    onTap: () {
                                      setState(() => _pricingType = "PAID");
                                      _loadInitial();
                                    },
                                  ),
                                ] else
                                  AppFilterChip(
                                    label: "مجاني",
                                    selected: true,
                                    onTap: () {},
                                  ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                    );
                  }
                  if (_courses.isEmpty && index == 1) {
                    return const _ExploreEmptyBlock();
                  }
                  final courseIndex = index - 1;
                  if (courseIndex < _courses.length) {
                    return Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                      child: CourseCatalogCard(course: _courses[courseIndex]),
                    );
                  }
                  if (_hasMore) {
                    return Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                      child: Center(
                        child: _loadingMore
                            ? const CircularProgressIndicator(
                                color: AppColors.orange,
                              )
                            : OutlinedButton(
                                onPressed: _loadMore,
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.navy,
                                  minimumSize: const Size.fromHeight(44),
                                  side: const BorderSide(
                                    color: AppColors.border,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                ),
                                child: const Text("تحميل المزيد"),
                              ),
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ),
    );
  }
}

class _ExploreEmptyBlock extends StatelessWidget {
  const _ExploreEmptyBlock();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      child: Column(
        children: [
          Icon(
            Icons.search_off_rounded,
            size: 52,
            color: AppColors.navy.withValues(alpha: 0.3),
          ),
          const SizedBox(height: 12),
          const Text(
            "لا توجد دورات",
            style: TextStyle(
              color: AppColors.navy,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            "جرّب تغيير البحث أو التصنيف أو نوع السعر.",
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary, height: 1.4),
          ),
        ],
      ),
    );
  }
}
