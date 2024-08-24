import { z } from "zod";

export const AllowedAlertTargets = ["user", "tv"] as const;
export const AllowedAlertStatus = ["read", "unread"] as const;
export const AllowedAlertTypes = ["invitation", "claimed", "claiming"] as const;

export const AlertExtrasSchema = z.object({
  alertType: z.enum(AllowedAlertTypes).nullable().optional(),
  propertyName: z.string().nullable().optional(),
  propertyLogo: z.string().url().nullable().optional(),
  invitationId: z.string().nullable().optional(),
  roomId: z.string().nullable().optional(),
  propertyId: z.string().nullable().optional(),
  thingId: z.string().nullable().optional(),
  isFake: z.boolean().nullable().optional(),
  claimerUserId: z.string().nullable().optional(),
  claimerUserName: z.string().nullable().optional(),
});

export const AlertSchema = z.object({
  id: z.string(),
  targetType: z.enum(AllowedAlertTargets),
  targetId: z.string().max(50),
  title: z.string().max(500),
  description: z.string().max(1000),
  status: z.enum(AllowedAlertStatus).default("unread"),
  landingUrl: z.string().max(1000).optional().nullable(),
  extras: AlertExtrasSchema.default({}).optional().nullable(),
  createdAt: z.string().default(new Date().toISOString()),
  updatedAt: z.string().default(new Date().toISOString),
});

export const AlertInputSchema = AlertSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(AllowedAlertStatus).default("unread").optional().nullable(),
});

export const AlertUpdateSchema = AlertSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();
