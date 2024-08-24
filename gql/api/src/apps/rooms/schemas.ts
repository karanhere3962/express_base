import { z } from "zod";

export const RoomSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  roomId: z.string(),
  checkInState: z.boolean().default(false),
  guestName: z.string().optional().nullable(),
  isFake: z.boolean().default(false),
  createdAt: z.string().default(new Date().toISOString()),
  updatedAt: z.string().default(new Date().toISOString()),
});

export const RoomCreateSchema = RoomSchema.omit({
  id: true,
});

export const RoomCreateInputSchema = RoomSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const RoomUpdateSchema = RoomSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({});
