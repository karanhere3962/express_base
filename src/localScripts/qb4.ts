import { ZodSchema, z } from "zod";

class BaseModel<T extends Record<string, any>> {
  static validationSchema: ZodSchema<any>;
  data: T;

  constructor(initValues: T) {
    this.data = initValues;
  }

  static create<D extends Record<string, any>, T extends BaseModel<D>>(
    this: { new (initValues: D): T; validationSchema: ZodSchema<D> },
    data: D
  ): T {
    const validatedData = this.validationSchema.parse(data);
    return new this(validatedData);
  }

  printData() {
    console.log(this.data);
  }
}

const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
});

type IUser = z.infer<typeof UserSchema>;

class User extends BaseModel<IUser> {
  static validationSchema = UserSchema;
}

const user = User.create({ id: 1, username: "user", password: "password" });
user.data.id;
user.printData();
