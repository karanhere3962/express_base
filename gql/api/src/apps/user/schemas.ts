import { z } from "zod";

export const AllowedUserTypes = [
  "user",
  "admin",
  "device_manager",
  "claimer",
  "property_owner",
  "brand_manager",
  "receptionist",
] as const;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().max(150),
  email: z.string().email().max(200),
  displayPicture: z.string().url().optional().nullable(),
  userType: z.enum(AllowedUserTypes).default("user"),
  passwordHash: z.string(),
  propertyId: z.string().optional().nullable(),
  createdAt: z.string().default(new Date().toISOString()),
  updatedAt: z.string().default(new Date().toISOString),
});

export const UserCreateSchema = UserSchema.omit({
  id: true,
});

export const UserCreateInputSchema = UserSchema.omit({
  id: true,
  propertyId: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
})
  .extend({
    password: z.string().min(4, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const UserUpdateSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();
