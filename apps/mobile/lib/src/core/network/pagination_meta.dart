class PaginationMeta {
  const PaginationMeta({
    required this.page,
    required this.pageSize,
    required this.total,
    required this.totalPages,
  });

  final int page;
  final int pageSize;
  final int total;
  final int totalPages;

  bool get hasMore => page < totalPages;

  factory PaginationMeta.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const PaginationMeta(
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 1,
      );
    }
    return PaginationMeta(
      page: (json["page"] as num?)?.toInt() ?? 1,
      pageSize: (json["pageSize"] as num?)?.toInt() ?? 20,
      total: (json["total"] as num?)?.toInt() ?? 0,
      totalPages: (json["totalPages"] as num?)?.toInt() ?? 1,
    );
  }
}

class PaginatedResult<T> {
  const PaginatedResult({required this.items, required this.meta});

  final List<T> items;
  final PaginationMeta meta;
}
