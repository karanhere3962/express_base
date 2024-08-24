import { z } from "zod";

export const AllowedInvitationRoles = [
  "user",
  "claimer",
  "device_manager",
  "property_owner",
  "brand_manager",
  "receptionist",
] as const;

export const InvitationSchema = z.object({
  id: z.string(),
  senderEmail: z.string().email(),
  recipientEmail: z.string().email(),
  invitationRole: z.enum(AllowedInvitationRoles),
  propertyId: z.string(),
  ttl: z.string().datetime(),
  isAccepted: z.boolean().default(false),
  createdAt: z.string().default(new Date().toISOString()),
  updatedAt: z.string().default(new Date().toISOString()),
});

export const InvitationCreateSchema = InvitationSchema.omit({
  id: true,
});

export const InvitationCreateInputSchema = InvitationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ttl: true,
});

export const InvitationUpdateSchema = InvitationSchema.pick({}).partial();
