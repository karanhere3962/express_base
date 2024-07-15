export const TenantUserTypes = ["admin", "user"] as const;
export const UserTypes = [...TenantUserTypes, "super_admin"] as const;
export const UserPermissions = [
  "*", // all
  "w", // write
  "r", // read
  "e", // edit
  "p", // give permission to other users
  "b", // booking
] as const;
