import { z } from "zod";

export const PropertySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  isFake: z.boolean().default(false),
  createdBy: z.string(),
  createdAt: z.string().default(new Date().toISOString()),
  updatedAt: z.string().default(new Date().toISOString()),
});

export const PropertyCreateSchema = PropertySchema.omit({
  id: true,
});

export const PropertyCreateInputSchema = PropertySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const PropertyUpdateSchema = PropertySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
}).partial({
  name: true,
});
