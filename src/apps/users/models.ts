import {
  BaseModel,
  tenantClassMixin,
  Constructor,
  BaseModelConstructor,
} from "../../base/model";
import { z } from "zod";
import { UserSchema, TenantUserSchema } from "./schemas";

export type UserType = z.infer<typeof UserSchema>;
export type TenantUserType = z.infer<typeof TenantUserSchema>;

export function userClassMixin<
  U extends Record<string, any>,
  T extends Constructor<BaseModel<any>>
>(baseClass: T) {
  return class extends baseClass {
    static tableName = "users";
    static pkKey = "id";
    static serializerFields: string[] = [
      "id",
      "name",
      "email",
      "display_picture",
      "user_type",
      "permissions",
      "created_at",
      "updated_at",
    ];
    static async authenticateUser<
      T extends BaseModel<U> & BaseModelConstructor<U>
    >(this: T, email: string, password: string): Promise<T | null> {
      const user = await this.get({ email });
      if (user) {
        return user;
      }
      return null;
    }
  };
}

export class User extends userClassMixin(BaseModel<UserType>) {
  static validationSchema = UserSchema;
}

export class TenantUser extends userClassMixin(
  tenantClassMixin(BaseModel<TenantUserType>)
) {
  static validationSchema = TenantUserSchema;
}
