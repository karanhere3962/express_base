import { booleanArg, extendType, nonNull, objectType, stringArg } from "nexus";
import { hasPropertyPermission } from "../property/permissions";

export const Room = objectType({
  name: "Room",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("propertyId");
    t.nonNull.string("roomId");
    t.nonNull.boolean("checkInState");
    t.string("guestName");
    t.nonNull.boolean("isFake");
    t.nonNull.string("createdAt");
    t.nonNull.string("updatedAt");
  },
});

// Queries ////

export const RoomQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("room", {
      type: "Room",
      args: {
        id: nonNull(stringArg()),
        propertyId: nonNull(stringArg()),
      },
      authorize: (_parent, args, ctx) => {
        return hasPropertyPermission(ctx.user, args.propertyId, false);
      },
      resolve: async (_parent, args, ctx) => {
        return await ctx.roomService.findOne({
          id: args.id,
          propertyId: args.propertyId,
        });
      },
    });

    t.list.field("rooms", {
      type: "Room",
      args: {
        propertyId: nonNull(stringArg()),
      },
      authorize: (_parent, args, ctx) => {
        return hasPropertyPermission(ctx.user, args.propertyId, false);
      },
      resolve: async (_parent, args, ctx) => {
        return await ctx.roomService.find({
          propertyId: args.propertyId,
        });
      },
    });
  },
});

//// Mutation ////

export const Mutations = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createRoom", {
      type: "Room",
      args: {
        propertyId: nonNull(stringArg()),
        roomId: nonNull(stringArg()),
        checkInState: nonNull(booleanArg({ default: false })),
        guestName: stringArg(),
        isFake: nonNull(booleanArg({ default: false })),
      },
      authorize: (_parent, args, ctx) => {
        return hasPropertyPermission(ctx.user, args.propertyId, false);
      },
      resolve: async (_parent, args, ctx) => {
        const room = await ctx.roomService.insertIfNotExists(
          {
            propertyId: args.propertyId,
            roomId: args.roomId,
          },
          {
            checkInState: args.checkInState,
            guestName: args.guestName,
            propertyId: args.propertyId,
            isFake: args.isFake,
            roomId: args.roomId,
          }
        );
        return room;
      },
    });
  },
});
