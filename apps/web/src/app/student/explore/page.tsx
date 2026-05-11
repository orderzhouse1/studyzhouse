import type { Metadata } from "next";

import { ExploreCoursesPanel } from "@/components/student/explore-courses-panel";

export const metadata: Metadata = {
  title: "استكشف الكورسات",
};

export default function ExplorePage(): React.ReactElement {
  return <ExploreCoursesPanel />;
}
