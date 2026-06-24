import { z } from "zod";

export const homepageHeroMetricKeySchema = z.enum([
  "site_visits",
  "registered_students",
  "available_courses",
]);

export type HomepageHeroMetricKey = z.infer<typeof homepageHeroMetricKeySchema>;

export const homepageHeroStatConfigItemSchema = z.object({
  metricKey: homepageHeroMetricKeySchema,
  label: z.string().trim().min(1, "التسمية مطلوبة.").max(80),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(99),
});

export type HomepageHeroStatConfigItem = z.infer<
  typeof homepageHeroStatConfigItemSchema
>;

export const homepageHeroStatsConfigSchema = z.object({
  items: z.array(homepageHeroStatConfigItemSchema).min(1).max(8),
});

export type HomepageHeroStatsConfig = z.infer<
  typeof homepageHeroStatsConfigSchema
>;

export const homepageHeroStatsPatchBodySchema = homepageHeroStatsConfigSchema;

export type HomepageHeroStatsPatchBody = z.infer<
  typeof homepageHeroStatsPatchBodySchema
>;

export const homepageHeroStatPublicItemSchema = z.object({
  metricKey: homepageHeroMetricKeySchema,
  label: z.string(),
  value: z.number().int().nonnegative(),
});

export type HomepageHeroStatPublicItem = z.infer<
  typeof homepageHeroStatPublicItemSchema
>;

export const homepageHeroStatAdminItemSchema =
  homepageHeroStatConfigItemSchema.extend({
    value: z.number().int().nonnegative(),
  });

export type HomepageHeroStatAdminItem = z.infer<
  typeof homepageHeroStatAdminItemSchema
>;
