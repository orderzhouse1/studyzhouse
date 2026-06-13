import { z } from "zod";

export const webPushSubscribeBodySchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export type WebPushSubscribeBody = z.infer<typeof webPushSubscribeBodySchema>;

export const webPushUnsubscribeBodySchema = z.object({
  endpoint: z.string().url(),
});

export type WebPushUnsubscribeBody = z.infer<
  typeof webPushUnsubscribeBodySchema
>;

export const webPushPublicKeyResponseSchema = z.object({
  configured: z.boolean(),
  publicKey: z.string().nullable(),
});

export type WebPushPublicKeyResponse = z.infer<
  typeof webPushPublicKeyResponseSchema
>;

export const webPushSubscribeResponseSchema = z.object({
  subscribed: z.boolean(),
  subscriptionId: z.string(),
});

export type WebPushSubscribeResponse = z.infer<
  typeof webPushSubscribeResponseSchema
>;

export const webPushUnsubscribeResponseSchema = z.object({
  unsubscribed: z.boolean(),
});

export type WebPushUnsubscribeResponse = z.infer<
  typeof webPushUnsubscribeResponseSchema
>;
