import { z } from "zod";

export const mobilePushPlatformSchema = z.enum(["android", "ios"]);

export type MobilePushPlatform = z.infer<typeof mobilePushPlatformSchema>;

export const mobilePushTokenRegisterBodySchema = z.object({
  token: z.string().min(10).max(4096),
  platform: mobilePushPlatformSchema,
  deviceInfo: z.string().max(512).optional().nullable(),
});

export type MobilePushTokenRegisterBody = z.infer<
  typeof mobilePushTokenRegisterBodySchema
>;

export const mobilePushTokenRegisterResponseSchema = z.object({
  registered: z.boolean(),
  tokenId: z.string(),
});

export type MobilePushTokenRegisterResponse = z.infer<
  typeof mobilePushTokenRegisterResponseSchema
>;

export const mobilePushTokenDeleteResponseSchema = z.object({
  deleted: z.boolean(),
});

export type MobilePushTokenDeleteResponse = z.infer<
  typeof mobilePushTokenDeleteResponseSchema
>;

export const mobilePushTestResponseSchema = z.object({
  sent: z.boolean(),
  configured: z.boolean(),
  messageId: z.string().nullable(),
  reason: z.string().nullable(),
});

export type MobilePushTestResponse = z.infer<
  typeof mobilePushTestResponseSchema
>;
