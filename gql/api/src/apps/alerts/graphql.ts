import {
  objectType,
  extendType,
  enumType,
  stringArg,
  booleanArg,
  list,
  nonNull,
} from "nexus";
import {
  AllowedAlertTargets,
  AllowedAlertStatus,
  AllowedAlertTypes,
} from "./schemas";
import { AlertType } from "./models";
import { Filter } from "mongodb";
import { hasGetAlertPermission } from "./permissions";

export const AlertTargetType = enumType({
  name: "AlertTarget",
  members: AllowedAlertTargets,
  description: "The type of target for the alert.",
});

export const AlertStatusType = enumType({
  name: "AlertStatus",
  members: AllowedAlertStatus,
  description: "Status of alert.",
});

export const AlertTypeEnum = enumType({
  name: "AlertTypeEnum",
  members: AllowedAlertTypes,
  description: "Type of the alert.",
});

export const AlertExtras = objectType({
  name: "AlertExtras",
  definition(t) {
    t.nullable.field("alertType", { type: AlertTypeEnum });
    t.nullable.string("propertyName");
    t.nullable.string("propertyLogo");
    t.nullable.string("invitationId");
    t.nullable.string("roomId");
    t.nullable.string("propertyId");
    t.nullable.string("thingId");
    t.nullable.boolean("isFake");
    t.nullable.string("claimerUserId");
    t.nullable.string("claimerUserName");
  },
});

export const Alert = objectType({
  name: "Alert",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.field("targetType", { type: AlertTargetType });
    t.nonNull.string("targetId");
    t.nonNull.string("title");
    t.nonNull.string("description");
    t.string("landingUrl");
    t.nonNull.field("status", { type: AlertStatusType });
    t.field("extras", { type: AlertExtras });
    t.nonNull.string("createdAt");
    t.nonNull.string("updatedAt");
  },
});

//////////////// Queries ///////////////////

export const Query = extendType({
  type: "Query",
  definition(t) {
    t.field("alerts", {
      type: list("Alert"),
      args: {
        userId: stringArg(),
        thingId: stringArg(),
        excludeRead: booleanArg({ default: true }),
        afterDateTime: stringArg(),
      },
      authorize: (_parent, args, ctx) =>
        hasGetAlertPermission(
          args.userId || args.thingId || "",
          args.thingId ? "tv" : "user",
          ctx.user,
          ctx.tv
        ),
      resolve: async (_parent, args, ctx) => {
        const filters: Filter<AlertType> = {
          targetId: (args.userId ? args.userId : args.thingId) as string,
          targetType: args.userId ? "user" : "tv",
        };
        if (args.excludeRead) filters.status = "unread";
        if (args.afterDateTime) filters.createdAt = { $gt: args.afterDateTime };
        return (
          (await ctx.alertService.find(filters, { sort: { createdAt: -1 } })) ||
          []
        );
      },
    });
  },
});

//////////////// Mutations /////////////////

export const Mutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("markAlertAsRead", {
      type: "Alert",
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_parent, args, ctx) => {
        return await ctx.alertService.findOneAndUpdate(
          { id: args.id },
          {
            $set: { status: "read" },
          }
        );
      },
    });
    t.field("createAlert", {
      type: "Alert",
      args: {
        targetType: nonNull(AlertTargetType),
        targetId: nonNull(stringArg()),
        title: nonNull(stringArg()),
        description: nonNull(stringArg()),
        landingUrl: stringArg(),
        extras: "JSON",
      },
      resolve: async (_parent, args, ctx) =>
        await ctx.alertService.insertOne({ ...args, status: "unread" }),
    });
  },
});
