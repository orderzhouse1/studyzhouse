export type StructureLesson = {
  id: string;
  title: string;
  description: string | null;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  durationSeconds: number | null;
  isPreview: boolean;
  order: number;
};

export type StructureSection = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: StructureLesson[];
};

export type Readiness = {
  hasTitle: boolean;
  hasDescription: boolean;
  hasCategory: boolean;
  hasSection: boolean;
  hasLesson: boolean;
  allLessonsHaveVideos: boolean;
  canPublish: boolean;
};

export type StructureCourse = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  pricingType: "FREE" | "PAID";
  category: null | { id: string; name: string; slug: string };
  sections: StructureSection[];
  readiness: Readiness;
};
