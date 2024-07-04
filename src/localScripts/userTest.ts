import { BaseModel } from "../base/model";
import { z } from "zod";
import { db, logger } from "../setup";
import type { QueryBuilder } from "knex";

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
  // const user = await User.create({
  //   username: "Karan5",
  //   email: "karan.chettri5@tpv-tech.com",
  //   password: "new_password",
  // });
  //   logger.debug(`User: ${user}`);
  //   logger.debug(`User data: ${user.data}`);
  //   logger.debug(user);
  //   logger.debug(user.serialize());
  const user = new User({
    username: "Karan5",
    email: "karan.chettri5@tpv-tech.com",
    password: "new_password",
  });
  logger.debug(user.serialize());
  logger.debug(await User.select().where("id", 3));
}
main().then(() => db.destroy());
