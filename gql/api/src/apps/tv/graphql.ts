import {
  objectType,
  extendType,
  enumType,
  stringArg,
  booleanArg,
  list,
  nonNull,
} from "nexus";
import { AllowedClaimState } from "./schemas";
import { isAdmin } from "../user/permissions";
import { hasClaimPermission, hasTVAccessForPropertyId } from "./permissions";
import { TVType } from "./models";
import { ClientFacingError } from "../../errors";
import { customErrorCodes } from "../../errors/codes";
import { AlertExtrasType } from "../alerts/models";
export const ClaimStateType = enumType({
  name: "ClaimState",
  members: AllowedClaimState,
  description: "Claim state for TV.",
});

export const TV = objectType({
  name: "TV",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("thingId");
    t.nonNull.string("model");
    t.string("roomId");
    t.string("propertyId");
    t.string("claimQRCode");
    t.field("claimState", { type: ClaimStateType });
    t.string("cloneState");
    t.int("cloneProgress");
    t.nonNull.boolean("isFake");
    t.nonNull.string("createdAt");
    t.nonNull.string("updatedAt");
  },
});

export const TVTokens = objectType({
  name: "TVTokens",
  definition(t) {
    t.nonNull.string("accessToken");
  },
});

export const TVWithTokens = objectType({
  name: "TVWithTokens",
  definition(t) {
    t.nonNull.field("tv", { type: TV });
    t.nonNull.field("tokens", { type: TVTokens });
  },
});

//////////////// Queries ///////////////////

export const Query = extendType({
  type: "Query",
  definition(t) {
    t.field("TVInfo", {
      type: "TV",
      args: {
        thingId: nonNull(stringArg()),
      },
      resolve: async (_parent, args, ctx) => {
        const tv = (await ctx.tvService.getOr404(args)) as TVType;
        const requestUser = ctx.user;
        const requestTV = ctx.tv;
        if (
          requestUser &&
          (isAdmin(requestUser, false) ||
            hasTVAccessForPropertyId(requestUser, tv.propertyId, false))
        )
          return tv;
        if (requestTV && requestTV.thingId === args.thingId) return tv;
        throw new ClientFacingError(
          "Not enough permission to access tv details.",
          customErrorCodes.FORBIDDEN_403
        );
      },
    });
    t.field("TVsByPropertyId", {
      type: list("TV"),
      args: {
        propertyId: nonNull(stringArg()),
      },
      authorize: async (_parent, args, ctx) => {
        return hasTVAccessForPropertyId(ctx.user, args.propertyId);
      },
      resolve: async (_parent, args, ctx) => {
        return (await ctx.tvService.find(args)) || [];
      },
    });
  },
});

//////////////// Mutation ///////////////////

export const Mutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("claimTV", {
      type: "TV",
      args: {
        thingId: nonNull(stringArg()),
        roomId: stringArg(),
        propertyId: nonNull(stringArg()),
        isFake: nonNull(booleanArg({ default: false })),
      },
      authorize: (_parent, args, ctx) => hasClaimPermission(ctx.user),
      resolve: async (_parent, args, ctx) => {
        const tv = await ctx.tvService.getOr404({ thingId: args.thingId });
        const property = await ctx.propertyService.getOr404({
          id: args.propertyId,
        });
        if (tv.claimState === "claimed")
          throw new ClientFacingError(
            "TV already claimed.",
            customErrorCodes.FORBIDDEN_403
          );

        const updatedTvData = await ctx.tvService.findOneAndUpdate(
          { thingId: args.thingId },
          { $set: { ...args, claimState: "claimed" } }
        );
        const promises = [];
        const extras: AlertExtrasType = {
          alertType: "claimed",
          propertyName: property.name,
          propertyLogo: property.logoUrl,
          roomId: args.roomId,
          propertyId: args.propertyId,
          thingId: args.thingId,
          isFake: args.isFake,
          claimerUserId: ctx.user?.id,
          claimerUserName: ctx.user?.name,
        };

        promises.push(
          ctx.alertService.insertOne({
            targetType: "tv",
            title: "claimed",
            description: `Device claimed by ${ctx.user?.name}.`,
            status: "unread",
            targetId: tv.thingId,
            extras,
          })
        );
        const usersToBeAlerted = await ctx.userService.find({
          userType: {
            $in: [
              "admin",
              "claimer",
              "property_owner",
              "receptionist",
              "brand_manager",
            ],
          },
        });

        for (const user of usersToBeAlerted || []) {
          promises.push(
            ctx.alertService.insertOne({
              targetType: "user",
              title: "TV claimed.",
              description: `TV claimed by ${ctx.user?.name}.`,
              status: "unread",
              targetId: user.id,
              extras,
            })
          );
        }
        await Promise.all(promises);
        if (args.roomId)
          await ctx.roomService.insertIfNotExists(
            {
              roomId: args.roomId,
              propertyId: args.propertyId,
            },
            {
              propertyId: args.propertyId,
              isFake: false,
              checkInState: false,
              roomId: args.roomId,
            }
          );
        return updatedTvData;
      },
    });
    t.field("TVLogin", {
      type: "TVWithTokens",
      args: {
        thingId: nonNull(stringArg()),
        model: nonNull(stringArg()),
      },
      resolve: async (_parent, args, ctx) => {
        return await ctx.tvService.login(args.thingId, args.model);
      },
    });
  },
});
