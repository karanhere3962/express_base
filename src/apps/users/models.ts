import { BaseModel, TenantBaseModel } from "../../base/model";
import { z } from "zod";
import { UserSchema, TenantUserSchema } from "./schemas";
import { ClientFacingError, applyMixins } from "../../utils";
import bcrypt from "bcrypt";

export type UserType = z.infer<typeof UserSchema>;
export type TenantUserType = z.infer<typeof TenantUserSchema>;

export class UserBase<
  T extends UserType | TenantUserType
> extends BaseModel<T> {
  public isAuthenticated: boolean;

  constructor(initValues: T) {
    super(initValues);
    this.isAuthenticated = false;
  }

  static async authenticateUser(email: string, password: string) {
    const user = await this.get({ email });
    const authError = new ClientFacingError(
      "Email or password is incorrect.",
      "AUTH:INVALID_CREDENTIALS",
      401
    );
    if (!user) {
      throw authError;
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.data.password_hash
    );
    if (!passwordMatch) {
      throw authError;
    }
    user.isAuthenticated = true;
    return user;
  }
}

export class User extends UserBase<UserType> {
  static validationSchema = UserSchema;
}
export class TenantUser extends UserBase<TenantUserType> {
  static validationSchema = TenantUserSchema;
}

applyMixins(TenantUser, [TenantBaseModel<TenantUserType>]);

let user;
User.authenticateUser("email", "password").then((user) => {
  user = user;
  user.isAuthenticated = true;
});
