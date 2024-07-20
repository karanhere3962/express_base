import {
  objectType,
  inputObjectType,
  stringArg,
  nonNull,
  mutationType,
  queryType,
  makeSchema,
} from "nexus";

//////////////// Types ////////////////////

export const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("name");
    t.nonNull.string("email");
    t.nonNull.string("userType");
  },
});

export const UserCreateInput = inputObjectType({
  name: "UserCreateInput",
  definition(t) {
    t.nonNull.string("name");
    t.nonNull.string("email");
    t.nonNull.string("password");
    t.nonNull.string("confirmPassword");
  },
});

//////////////// Queries ///////////////////

export const Query = queryType({
  definition(t) {
    t.field("user", {
      type: "User",
      args: {
        id: nonNull(stringArg()),
      },
      resolve: (_parent, args, _ctx) => {
        return users.find((user) => user.id === args.id);
      },
    });
    t.list.field("users", {
      type: "User",
      resolve: () => users,
    });
  },
});

//////////////// Mutations /////////////////
