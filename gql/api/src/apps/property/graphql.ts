import {
  booleanArg,
  extendType,
  list,
  nonNull,
  objectType,
  stringArg,
} from "nexus";
import { ClientFacingError } from "../../errors";
import { customErrorCodes } from "../../errors/codes";
import { UserType } from "../user/models";
import { isAuthenticated } from "../user/permissions";
import { hasPropertyPermission } from "./permissions";

export const Property = objectType({
  name: "Property",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("name");
    t.string("description");
    t.string("logoUrl");
    t.nonNull.boolean("isFake");
    t.nonNull.string("createdBy");
    t.nonNull.string("createdAt");
    t.nonNull.string("updatedAt");
  },
});

export const PropertyWithTVs = objectType({
  name: "PropertyWithTVs",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("name");
    t.string("description");
    t.string("logoUrl");
    t.field("tvs", {
      type: list("TV"),
      resolve: async (parent, _args, ctx) => {
        const tvs = await ctx.tvService.find({
          propertyId: parent.id,
        });
        return tvs;
      },
    });
    t.nonNull.boolean("isFake");
    t.nonNull.string("createdBy");
    t.nonNull.string("createdAt");
    t.nonNull.string("updatedAt");
  },
});

//// Queries ////
export const Query = extendType({
  type: "Query",
  definition(t) {
    t.field("property", {
      type: "PropertyWithTVs",
      args: {
        id: nonNull(stringArg()),
      },
      authorize: async (_parent, args, ctx) => {
        return hasPropertyPermission(ctx.user, args.id, false);
      },
      resolve: async (_parent, args, ctx) => {
        const property = await ctx.propertyService.findOne({
          id: args.id,
        });
        return property;
      },
    });

    t.field("properties", {
      type: list("PropertyWithTVs"),
      args: {},
      authorize: async (_parent, args, ctx) => {
        return isAuthenticated(ctx.user);
      },
      resolve: async (_parent, args, ctx) => {
        return await ctx.propertyService.find({
          id: ctx.user?.propertyId || "", // will add dummy data to it later. If user has access to the main property, we will send all the data back
        });
      },
    });
  },
});

///// Mutations ////

export const Mutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createProperty", {
      type: "Property",
      args: {
        name: nonNull(stringArg()),
        description: stringArg(),
        logoUrl: stringArg(),
        isFake: nonNull(booleanArg({ default: false })),
      },
      authorize: async (_parent, args, ctx) => {
        return isAuthenticated(ctx.user);
      },
      resolve: async (_parent, args, ctx) => {
        const property = await ctx.propertyService.insertOne({
          ...args,
          createdBy: (ctx.user as UserType)?.email,
        });
        await ctx.userService.findOneAndUpdate(
          { id: ctx.user?.id },
          {
            $set: {
              userType: "device_manager",
              propertyId: property.id,
            },
          }
        );
        return property;
      },
    });

    t.field("updateProperty", {
      type: "Property",
      args: {
        id: nonNull(stringArg()),
        name: stringArg(),
        description: stringArg(),
        logoUrl: stringArg(),
      },
      authorize: async (_parent, args, ctx) => {
        return hasPropertyPermission(ctx.user, args.id, false);
      },
      resolve: async (_parent, args, ctx) => {
        const updateFields: Record<string, any> = {};
        if (args.name !== null && args.name !== undefined) {
          updateFields.name = args.name;
        }
        if (args.description !== null && args.description !== undefined) {
          updateFields.description = args.description;
        }
        if (args.logoUrl !== null && args.logoUrl !== undefined) {
          updateFields.logoUrl = args.logoUrl;
        }
        const property = await ctx.propertyService.findOneAndUpdate(
          { id: args.id },
          {
            $set: updateFields,
          }
        );
        return property;
      },
    });

    t.field("deleteProperty", {
      type: "Boolean",
      args: {
        id: nonNull(stringArg()),
      },
      authorize: async (_parent, args, ctx) => {
        return hasPropertyPermission(ctx.user, args.id, false);
      },
      resolve: async (_parent, args, ctx) => {
        const deletedResult = await ctx.propertyService.deleteOne(args);
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
