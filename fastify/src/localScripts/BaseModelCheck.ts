import { BaseMongoModel } from "../db";

const url = "mongodb://localhost:27017";

type UserType = {
  name: string;
  email: string;
  age: number;
};

class UserService extends BaseMongoModel<UserType> {
  static collectionName: string = "testUser";
}

UserService.connect({
  uri: url,
  dbName: "htv_demo",
}).then(async () => {
  const userService = new UserService();
  const user = await userService.getOr404({
    id: "669b89a4ca0f3a6c56e1e1ec",
  });
  const users = await userService.find();
  // if (!user || !users) {
  //   console.log("User: ", user);
  //   console.log("Users: ", users);

  //   UserService.disconnect();
  //   return;
  // }
  console.log(user);
  // console.log(users);
  // await userService.insertOne({
  //   name: "Krishna",
  //   email: "k.c@c.com",
  //   age: 19,
  // });
  // const newUser = await userService.insertMany([
  //   {
  //     name: "Krishna",
  //     email: "k.c@c.com",
  //     age: 19,
  //   },
  //   {
  //     name: "Krishna1",
  //     email: "k.c1@c.com",
  //     age: 19,
  //   },
  //   {
  //     name: "Krishna1",
  //     email: "k.c1@c.com",
  //     age: 19,
  //   },
  //   {
  //     name: "Krishna1",
  //     email: "k.c1@c.com",
  //     age: 19,
  //   },
  // ]);
  // await userService.collection.deleteOne();
  // console.log(newUser);
  UserService.disconnect();
});
