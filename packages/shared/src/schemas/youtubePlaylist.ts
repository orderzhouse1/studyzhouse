import { z } from "zod";

export const youtubePlaylistPreviewBodySchema = z.object({
  playlistUrl: z
    .string()
    .trim()
    .min(1, "رابط قائمة التشغيل مطلوب."),
});

export type YoutubePlaylistPreviewBody = z.infer<
  typeof youtubePlaylistPreviewBodySchema
>;

export const youtubePlaylistImportModeSchema = z.enum([
  "CREATE_NEW_SECTION",
  "APPEND_TO_EXISTING_SECTION",
]);

export type YoutubePlaylistImportMode = z.infer<
  typeof youtubePlaylistImportModeSchema
>;

export const youtubePlaylistImportBodySchema = z
  .object({
    playlistUrl: z
      .string()
      .trim()
      .min(1, "رابط قائمة التشغيل مطلوب."),
    sectionTitle: z.string().trim().max(300).optional(),
    mode: youtubePlaylistImportModeSchema,
    sectionId: z.string().cuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "CREATE_NEW_SECTION") {
      const t = data.sectionTitle?.trim() ?? "";
      if (t.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "عنوان القسم مطلوب (حرفان على الأقل).",
          path: ["sectionTitle"],
        });
      }
    }
    if (data.mode === "APPEND_TO_EXISTING_SECTION") {
      if (!data.sectionId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "يجب اختيار القسم الموجود.",
          path: ["sectionId"],
        });
      }
    }
  });

export type YoutubePlaylistImportBody = z.infer<
  typeof youtubePlaylistImportBodySchema
>;
