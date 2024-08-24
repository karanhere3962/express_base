import { z } from "zod";

export const AllowedClaimState = ["claimed", "unclaimed"] as const;

export const TVSchema = z.object({
  id: z.string(),
  thingId: z.string().max(100),
  model: z.string().max(100),
  roomId: z.string().max(50).optional().nullable(),
  propertyId: z.string().max(50).optional().nullable(),
  claimQRCode: z.string().optional().nullable(),
  claimState: z
    .enum(AllowedClaimState)
    .default("unclaimed")
    .optional()
    .nullable(),
  cloneState: z.string().optional().nullable(),
  cloneProgress: z
    .number()
    .positive("Only positive numbers allowed.")
    .max(100, "Maximum value can be 100.")
    .default(0)
    .optional()
    .nullable(),
  isFake: z.boolean().default(true),
  createdAt: z.string().default(new Date().toISOString()),
  updatedAt: z.string().default(new Date().toISOString),
});

export const TVInputSchema = TVSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const TVUpdateSchema = TVSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
