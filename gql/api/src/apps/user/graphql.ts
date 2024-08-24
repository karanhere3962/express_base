import {
  objectType,
  enumType,
  inputObjectType,
  nonNull,
  stringArg,
  extendType,
} from "nexus";
import { isAdmin, isAdminOrSelf, isAuthenticated } from "./permissions";
import { ClientFacingError } from "../../errors";
import { customErrorCodes } from "../../errors/codes";
import { AllowedUserTypes } from "./schemas";
import { accessTokenExpiryInSecs } from "../../config";

export const UserType = enumType({
  name: "UserType",
  members: AllowedUserTypes,
  description: "The type of user.",
});

export const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("name");
    t.nonNull.string("email");
    t.string("displayPicture");
    t.string("propertyId");
    t.nonNull.field("userType", { type: UserType });
    t.nonNull.string("createdAt");
    t.nonNull.string("updatedAt");
  },
});

export const UserTokens = objectType({
  name: "UserTokens",
  definition(t) {
    t.nonNull.string("accessToken");
  },
});

export const UserWithTokens = objectType({
  name: "UserWithTokens",
  definition(t) {
    t.nonNull.field("user", { type: User });
    t.nonNull.field("tokens", { type: UserTokens });
  },
});

export const UserUpdateInput = inputObjectType({
  name: "UserUpdateInput",
  definition(t) {
    t.string("name");
    t.string("email");
    t.string("displayPicture");
  },
});

export const LoginInput = inputObjectType({
  name: "LoginInput",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("password");
  },
});

//////////////// Queries ///////////////////

export const Query = extendType({
  type: "Query",
  definition(t) {
    t.field("user", {
      type: "User",
      authorize: (_root, args, ctx) => {
        if (args.id) return isAdminOrSelf(args.id, ctx.user);
        return isAuthenticated(ctx.user);
      },
      args: {
        id: stringArg(),
      },
      resolve: async (_parent, args, ctx) => {
        const id = args.id || ctx.user?.id; // if id not sent, send back details of the one requesting
        return await ctx.userService.findOne({ id: id });
      },
    });
    t.list.field("users", {
      type: "User",
      authorize: (_root, _args, ctx) => isAdmin(ctx.user),
      resolve: async (_parent, args, ctx) => {
        ctx.log.debug(`User: ${JSON.stringify(ctx.user)}`);
        return await ctx.userService.find();
      },
    });
  },
});

//////////////// Mutations /////////////////

export const Mutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createUser", {
      type: "UserWithTokens",
      args: {
        name: nonNull(stringArg()),
        email: nonNull(stringArg()),
        displayPicture: stringArg(),
        userType: nonNull(UserType), // Directly using the UserType enum here
        password: nonNull(stringArg()),
        confirmPassword: nonNull(stringArg()),
      },
      resolve: async (_parent, args, ctx) => {
        const requestUser = ctx.user;
        if (args.userType != "user") {
          if (!requestUser || requestUser.userType !== "admin")
            throw new ClientFacingError(
              `Forbidden! Only admin can create usertype ${args.userType}.`,
              customErrorCodes.FORBIDDEN_403
            );
        }
        const user = await ctx.userService.insertOne(args);
        return {
          user: user,
          tokens: ctx.userService.generateTokens(user),
        };
      },
    });
    t.field("login", {
      type: "UserWithTokens",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      resolve: async (_parent, args, ctx) => {
        return await ctx.userService.login(args.email, args.password);
      },
    });
    t.field("deleteUser", {
      type: "Boolean",
      authorize: (root, args, ctx) => isAdminOrSelf(args.id, ctx.user),
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_parent, args, ctx) => {
        const deletedResult = await ctx.userService.deleteOne({ id: args.id });
        if (deletedResult.deletedCount === 0)
          throw new ClientFacingError(
            `No user found with id: ${args.id}.`,
            customErrorCodes.NOT_FOUND_404
          );
        return true;
      },
    });
  },
});
