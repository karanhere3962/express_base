import { BaseModel } from "../base/model";
import { z } from "zod";
import { db } from "../setup";

const userValidationSchema = z.object({
  id: z.number().optional(),
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
});

type UserDataType = z.infer<typeof userValidationSchema>;

class User extends BaseModel<UserDataType> {
  static validationSchema = userValidationSchema;
  static tableName = "users";
  static serializerFields: string[] = [
    "id",
    "username",
    "email",
    "created_at",
    "updated_at",
  ];
}

async function main() {
  const user = await User.create({
    username: "Karan4",
    email: "karan.chettri4@tpv-tech.com",
    password: "new_password",
  });
  console.log(user.serialize());
}
db.initialize();
main().then(() => db.destroy());
