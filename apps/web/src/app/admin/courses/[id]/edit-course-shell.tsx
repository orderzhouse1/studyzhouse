"use client";

import { useState } from "react";

import { CourseActions } from "./course-actions";
import { CourseEditClient } from "./course-edit-client";

export function EditCourseShell({
  courseId,
}: {
  courseId: string;
}): React.ReactElement {
  const [refetchKey, setRefetchKey] = useState(0);

  return (
    <>
      <CourseActions
        courseId={courseId}
        onDone={() => setRefetchKey((k) => k + 1)}
      />
      <CourseEditClient courseId={courseId} refetchKey={refetchKey} />
    </>
  );
}
