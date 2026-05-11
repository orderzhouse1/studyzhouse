import { Router } from "express";

import * as courseController from "../controllers/course.controller.js";
import * as courseStructureController from "../controllers/courseStructure.controller.js";
import * as youtubePlaylistController from "../controllers/youtubePlaylist.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validators/validate.js";
import {
  adminCourseLessonParamsSchema,
  adminCourseParamsSchema,
  adminCourseSectionParamsSchema,
  adminCoursesQuerySchema,
  courseCreateBodySchema,
  courseIdParamsSchema,
  courseUpdateBodySchema,
  lessonCreateBodySchema,
  lessonUpdateBodySchema,
  lessonsReorderBodySchema,
  sectionCreateBodySchema,
  sectionUpdateBodySchema,
  sectionsReorderBodySchema,
  youtubePlaylistImportBodySchema,
  youtubePlaylistPreviewBodySchema,
} from "@studyhouse/shared";

export const coursesAdminRouter = Router();

coursesAdminRouter.get(
  "/",
  validateQuery(adminCoursesQuerySchema),
  asyncHandler(courseController.listCoursesAdmin),
);

coursesAdminRouter.post(
  "/",
  validateBody(courseCreateBodySchema),
  asyncHandler(courseController.createCourseAdmin),
);

coursesAdminRouter.get(
  "/:courseId/structure",
  validateParams(adminCourseParamsSchema),
  asyncHandler(courseStructureController.getCourseStructureAdmin),
);

coursesAdminRouter.post(
  "/:courseId/youtube-playlist/preview",
  validateParams(adminCourseParamsSchema),
  validateBody(youtubePlaylistPreviewBodySchema),
  asyncHandler(youtubePlaylistController.previewYoutubePlaylistAdmin),
);

coursesAdminRouter.post(
  "/:courseId/youtube-playlist/import",
  validateParams(adminCourseParamsSchema),
  validateBody(youtubePlaylistImportBodySchema),
  asyncHandler(youtubePlaylistController.importYoutubePlaylistAdmin),
);

coursesAdminRouter.post(
  "/:courseId/sections/reorder",
  validateParams(adminCourseParamsSchema),
  validateBody(sectionsReorderBodySchema),
  asyncHandler(courseStructureController.reorderSectionsAdmin),
);

coursesAdminRouter.post(
  "/:courseId/sections/:sectionId/lessons",
  validateParams(adminCourseSectionParamsSchema),
  validateBody(lessonCreateBodySchema),
  asyncHandler(courseStructureController.createLessonAdmin),
);

coursesAdminRouter.patch(
  "/:courseId/sections/:sectionId",
  validateParams(adminCourseSectionParamsSchema),
  validateBody(sectionUpdateBodySchema),
  asyncHandler(courseStructureController.updateSectionAdmin),
);

coursesAdminRouter.delete(
  "/:courseId/sections/:sectionId",
  validateParams(adminCourseSectionParamsSchema),
  asyncHandler(courseStructureController.deleteSectionAdmin),
);

coursesAdminRouter.post(
  "/:courseId/sections",
  validateParams(adminCourseParamsSchema),
  validateBody(sectionCreateBodySchema),
  asyncHandler(courseStructureController.createSectionAdmin),
);

coursesAdminRouter.post(
  "/:courseId/lessons/reorder",
  validateParams(adminCourseParamsSchema),
  validateBody(lessonsReorderBodySchema),
  asyncHandler(courseStructureController.reorderLessonsAdmin),
);

coursesAdminRouter.patch(
  "/:courseId/lessons/:lessonId",
  validateParams(adminCourseLessonParamsSchema),
  validateBody(lessonUpdateBodySchema),
  asyncHandler(courseStructureController.updateLessonAdmin),
);

coursesAdminRouter.delete(
  "/:courseId/lessons/:lessonId",
  validateParams(adminCourseLessonParamsSchema),
  asyncHandler(courseStructureController.deleteLessonAdmin),
);

coursesAdminRouter.get(
  "/:id",
  validateParams(courseIdParamsSchema),
  asyncHandler(courseController.getCourseAdmin),
);

coursesAdminRouter.patch(
  "/:id",
  validateParams(courseIdParamsSchema),
  validateBody(courseUpdateBodySchema),
  asyncHandler(courseController.updateCourseAdmin),
);

coursesAdminRouter.post(
  "/:id/publish",
  validateParams(courseIdParamsSchema),
  asyncHandler(courseController.publishCourseAdmin),
);

coursesAdminRouter.post(
  "/:id/archive",
  validateParams(courseIdParamsSchema),
  asyncHandler(courseController.archiveCourseAdmin),
);
