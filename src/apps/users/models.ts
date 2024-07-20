import { BaseModel, BaseModelType, TenantBaseModel } from "../../base/model";
import { z, ZodSchema } from "zod";
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

  static async create<D extends Record<string, any>>(
    data: D & (UserType | TenantUserType)
  ) {
    data.password_hash = await bcrypt.hash(data.password_hash, 10);
    return super.create(data);
  }

  static async login<
    U extends UserType | TenantUserType,
    T extends UserBase<U>
  >(email: string, password: string) {
    const user = await super.get<T>({ email });
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

async function main() {
  const user = await User.create({
    email: "karan.c@cumulations.com",
    name: "karan",
    pass,
  });
}
