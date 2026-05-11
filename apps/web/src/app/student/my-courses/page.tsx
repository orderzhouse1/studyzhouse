import type { Metadata } from "next";

import { MyCoursesPanel } from "@/components/student/my-courses-panel";

export const metadata: Metadata = {
  title: "كورساتي",
};

export default function MyCoursesPage(): React.ReactElement {
  return <MyCoursesPanel />;
}
