import { BaseModel, tenantClassMixin } from "../base/model";
import { z } from "zod";
import { asyncLocalStorage, db, logger } from "../setup";

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
  static pkKey = "id";
  static serializerFields: string[] = [
    "id",
    "username",
    "email",
    "created_at",
    "updated_at",
  ];

  printData() {
    logger.debug(this.data);
  }
}

class TenantUser extends tenantClassMixin(User) {}

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
  // const user = new User({
  //   username: "Karan5",
  //   email: "karan.chettri5@tpv-tech.com",
  //   password: "new_password",
  // });
  // logger.debug(user.serialize());
  // // logger.debug(new User(await User.kSelect().where("id", 3).first()));
  // logger.debug(await User.select());
  // logger.debug(await User.select({ id: 3 }));
  // logger.debug(await User.get({ id: 3 }));
  // const user = await User.get(3);
  // user.printData();
  // await user.update({ username: "Karan6" });
  // user.printData();
  // await user.update({ id: 2, username: "Karan7" });
  // user.printData();
  logger.debug(TenantUser.getTenisedTableName());
  // const tenantUser = await TenantUser.create({
  //   username: "Karan9",
  //   email: "karan.chettri5@tpv-tech.com",
  //   password: "new_password",
  // });
  // tenantUser.printData();
  const tenantUser = new TenantUser({
    username: "Karan10",
    email: "karan.chettri5@tpv-tech.com",
    password: "new_password",
  });
  const tenantUser2 = await TenantUser.create({
    username: "Karan11",
    email: "karan.chettri5@tpv-tech.com",
    password: "new_password",
  });
  tenantUser2.printData();
  tenantUser.printData();
}
asyncLocalStorage.run(new Map(), async () => {
  const store = asyncLocalStorage.getStore();
  store?.set("tenantSchema", "public");
  main().then(() => db.destroy());
});
