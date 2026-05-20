"use client";

import { useCallback, useEffect, useState } from "react";

import { CatalogCourseCard } from "@/components/courses/catalog-course-card";
import type { CourseCardCourse } from "@/components/courses/course-card";
import {
  fetchStudentSavedCourseIds,
  saveStudentCourse,
  unsaveStudentCourse,
} from "@/lib/student-saved-courses-api";

export function StudentCoursesCatalogGrid({
  items,
  detailBasePath,
  compact,
}: {
  items: CourseCardCourse[];
  detailBasePath: string;
  compact?: boolean;
}): React.ReactElement {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const ids = await fetchStudentSavedCourseIds();
        if (!cancelled) setSavedIds(new Set(ids));
      } catch {
        if (!cancelled) setSavedIds(new Set());
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onToggleSave = useCallback(
    async (courseId: string, currentlySaved: boolean): Promise<void> => {
      setBusyId(courseId);
      try {
        if (currentlySaved) {
          await unsaveStudentCourse(courseId);
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(courseId);
            return next;
          });
        } else {
          await saveStudentCourse(courseId);
          setSavedIds((prev) => new Set(prev).add(courseId));
        }
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 @min-[36rem]:grid-cols-4">
      {items.map((course) => (
        <CatalogCourseCard
          key={course.id}
          course={course}
          detailBasePath={detailBasePath}
          compact={compact}
          saved={loaded && savedIds.has(course.id)}
          saveLoading={busyId === course.id}
          onToggleSave={
            loaded
              ? () =>
                  void onToggleSave(course.id, savedIds.has(course.id))
              : undefined
          }
        />
      ))}
    </div>
  );
}
