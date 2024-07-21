import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().max(150),
  email: z.string().email().max(200),
  displayPicture: z.string().url().optional(),
  userType: z.enum(["user", "admin"]).default("user"),
  passwordHash: z.string(),
});

export const UserCreateSchema = UserSchema.omit({
  id: true,
  userType: true,
  passwordHash: true,
})
  .extend({
    password: z.string().min(4, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const UserUpdateSchema = UserSchema.pick({
  name: true,
  email: true,
  displayPicture: true,
}).partial();
