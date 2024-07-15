import { BaseModel, TenantBaseModel } from "../../base/model";
import { z } from "zod";
import { UserSchema, TenantUserSchema } from "./schemas";
import { applyMixins } from "../../utils";

export type UserType = z.infer<typeof UserSchema>;
export type TenantUserType = z.infer<typeof TenantUserSchema>;

// export function userClassMixin<
//   D extends Record<string, any>,
//   T extends Constructor<BaseModel<D>>
// >(baseClass: T) {
//   return class extends baseClass {
//     static tableName = "users";
//     static pkKey = "id";
//     static serializerFields: string[] = [
//       "id",
//       "name",
//       "email",
//       "display_picture",
//       "user_type",
//       "permissions",
//       "created_at",
//       "updated_at",
//     ];

//     static async authenticateUser(email: string, password: string) {
//       const user = await this.get({ email });
//       if (!user) {
//         throw new Error("User not found.");
//       }
//       if (user.data.password !== password) {
//         throw new Error("Invalid password.");
//       }
//       return user;
//     }
//   };
// }

export class User extends BaseModel<UserType> {
  static validationSchema = UserSchema;
}

export class TenantUser extends TenantBaseModel<TenantUserType> {
  static validationSchema = TenantUserSchema;
}

applyMixins(TenantUser, [User]);
