import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/features/learn/models/learn_course.dart";
import "package:studyzhouse_mobile/src/features/learn/widgets/youtube_lesson_player.dart";

void main() {
  test("LearnCourseResponse.fromEnvelope parses payload", () {
    final response = LearnCourseResponse.fromEnvelope({
      "success": true,
      "data": {
        "course": {
          "id": "c1",
          "title": "كورس",
          "slug": "kors",
          "pricingType": "FREE",
          "progressPercent": 50,
        },
        "sections": [
          {
            "id": "s1",
            "title": "القسم 1",
            "sortOrder": 0,
            "lessons": [
              {
                "id": "l1",
                "title": "درس 1",
                "sortOrder": 0,
                "isPreview": false,
                "youtubeVideoId": "dQw4w9WgXcQ",
                "progress": {"watchedSeconds": 0, "isCompleted": false},
              },
              {
                "id": "l2",
                "title": "درس 2",
                "sortOrder": 1,
                "isPreview": false,
                "progress": {
                  "watchedSeconds": 10,
                  "isCompleted": true,
                  "completedAt": "2026-01-01T00:00:00.000Z",
                },
              },
            ],
          },
        ],
        "navigation": {
          "currentLessonId": "l1",
          "previousLessonId": null,
          "nextLessonId": "l2",
        },
        "currentLesson": {
          "id": "l1",
          "title": "درس 1",
          "sectionTitle": "القسم 1",
          "progress": {"watchedSeconds": 0, "isCompleted": false},
        },
        "stats": {
          "completedLessons": 1,
          "totalLessons": 2,
          "progressPercent": 50,
        },
      },
    });

    expect(response.course.slug, "kors");
    expect(response.stats.totalLessons, 2);
    expect(response.navigation.nextLessonId, "l2");
  });

  test("flattenLearnLessons orders by section and sortOrder", () {
    final sections = [
      LearnSection(
        id: "s1",
        title: "A",
        sortOrder: 0,
        lessons: [
          LearnLesson(
            id: "l1",
            title: "1",
            sortOrder: 0,
            isPreview: false,
            progress: const LessonProgress(
              watchedSeconds: 0,
              isCompleted: false,
            ),
          ),
        ],
      ),
      LearnSection(
        id: "s2",
        title: "B",
        sortOrder: 1,
        lessons: [
          LearnLesson(
            id: "l2",
            title: "2",
            sortOrder: 0,
            isPreview: false,
            progress: const LessonProgress(
              watchedSeconds: 0,
              isCompleted: false,
            ),
          ),
        ],
      ),
    ];
    final flat = flattenLearnLessons(sections);
    expect(flat.map((l) => l.id).toList(), ["l1", "l2"]);
  });

  test("lessonNeighbors returns previous and next", () {
    final flat = [
      LearnLesson(
        id: "a",
        title: "a",
        sortOrder: 0,
        isPreview: false,
        progress: const LessonProgress(watchedSeconds: 0, isCompleted: false),
      ),
      LearnLesson(
        id: "b",
        title: "b",
        sortOrder: 1,
        isPreview: false,
        progress: const LessonProgress(watchedSeconds: 0, isCompleted: false),
      ),
      LearnLesson(
        id: "c",
        title: "c",
        sortOrder: 2,
        isPreview: false,
        progress: const LessonProgress(watchedSeconds: 0, isCompleted: false),
      ),
    ];
    final n = lessonNeighbors(flat, "b");
    expect(n.previous?.id, "a");
    expect(n.next?.id, "c");
  });

  test("extractYoutubeId from watch URL", () {
    expect(
      LearnLesson.extractYoutubeId(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      ),
      "dQw4w9WgXcQ",
    );
  });

  test("isValidYoutubeVideoId", () {
    expect(isValidYoutubeVideoId("dQw4w9WgXcQ"), isTrue);
    expect(isValidYoutubeVideoId("invalid"), isFalse);
    expect(isValidYoutubeVideoId(null), isFalse);
  });
}
