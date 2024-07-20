import { z } from "zod";
import { UserTypes, TenantUserTypes, UserPermissions } from "./constants";

export const PermissionTypes = z.enum(UserPermissions);

export const PermissionObjects = z.record(
  z.object({
    permissions: z.array(PermissionTypes),
  })
);

export const PermissionSchema = z.record(
  z.object({
    buildings: PermissionObjects,
    rooms: PermissionObjects,
  })
);

export const TenantPermissionsSchema = z.object({
  buildings: PermissionObjects,
  rooms: PermissionObjects,
});

export const BaseUserSchema = {
  id: z.string().uuid(),
  name: z.string().max(100),
  email: z.string().email().max(100),
  password_hash: z.string().max(128),
  display_picture: z.string().max(255).optional(),
  refresh_token: z.string().max(256).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
};

export const UserSchema = z.object({
  ...BaseUserSchema,
  permissions: PermissionSchema,
  user_type: z.enum(UserTypes).default("user"),
});

export const TenantUserSchema = z.object({
  ...BaseUserSchema,
  permissions: TenantPermissionsSchema,
  user_type: z.enum(TenantUserTypes).default("user"),
});

export const UserCreateSchema = z
  .object({
    password: z.string().min(4),
    confirmPassword: z.string(),
  })
  .merge(
    z
      .object(BaseUserSchema)
      .pick({ name: true, email: true, display_picture: true })
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
