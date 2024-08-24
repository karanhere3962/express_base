import {
  arg,
  enumType,
  extendType,
  nonNull,
  objectType,
  stringArg,
} from "nexus";
import { ClientFacingError } from "../../errors";
import { customErrorCodes } from "../../errors/codes";
import { isAuthenticated } from "../user/permissions";
import { UserType } from "../user/models";
import { AllowedInvitationRoles } from "./schemas";
import {
  hasSendInvitationPermission,
  hasViewInvitationPermission,
} from "./permissions";

/////// Types /////

export const AllowedInvitationRolesEnum = enumType({
  name: "InvitationRoles",
  members: AllowedInvitationRoles,
  description: "The type of user, either regular user or others",
});

export const Invitation = objectType({
  name: "Invitation",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("senderEmail");
    t.nonNull.string("recipientEmail");
    t.nonNull.field("invitationRole", { type: AllowedInvitationRolesEnum });
    t.nonNull.string("propertyId");
    t.nonNull.string("ttl");
    t.nonNull.boolean("isAccepted");
    t.nonNull.string("createdAt");
    t.nonNull.string("updatedAt");
  },
});

///// Queries /////

export const Query = extendType({
  type: "Query",
  definition(t) {
    t.field("invitation", {
      type: "Invitation",
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_parent, args, ctx) => {
        const invitation = await ctx.invitationService.findOne({
          id: args.id,
        });
        if (
          hasViewInvitationPermission(
            ctx.user,
            invitation?.senderEmail,
            invitation?.recipientEmail,
            false
          )
        )
          return invitation;
        throw new ClientFacingError(
          "Not enough permission to access invitation details.",
          customErrorCodes.UNAUTHORIZED_401
        );
      },
    });

    t.list.field("getSentinvitations", {
      type: "Invitation",
      args: {},
      authorize: async (_parent, args, ctx) => {
        return isAuthenticated(ctx.user);
      },
      resolve: async (_parent, args, ctx) => {
        const invitations = await ctx.invitationService.find({
          senderEmail: ctx.user?.email,
        });
        return invitations;
      },
    });

    t.list.field("getReceivedinvitations", {
      type: "Invitation",
      args: {},
      authorize: async (_parent, args, ctx) => {
        return isAuthenticated(ctx.user);
      },
      resolve: async (_parent, args, ctx) => {
        const invitations = await ctx.invitationService.find({
          recipientEmail: ctx.user?.email,
        });
        return invitations;
      },
    });
  },
});

////// Mutations ///

export const Mutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createInvitation", {
      type: "Invitation",
      args: {
        recipientEmail: nonNull(stringArg()),
        invitationRole: nonNull(AllowedInvitationRolesEnum),
        propertyId: nonNull(stringArg()),
      },
      authorize: async (_parent, args, ctx) => {
        return isAuthenticated(ctx.user);
      },
      resolve: async (_parent, args, ctx) => {
        const property = await ctx.propertyService.getOr404({
          id: args.propertyId,
        });
        const recipientUser = await ctx.userService.getOr404({
          email: args.recipientEmail,
        });
        if (!hasSendInvitationPermission(ctx.user, property.id, false))
          throw new ClientFacingError(
            "Not enough permission to send invitation for this property.",
            customErrorCodes.UNAUTHORIZED_401
          );
        const existingInvitations = await ctx.invitationService.find({
          ...args,
        });
        if (existingInvitations?.length) {
          throw new ClientFacingError(
            "An invitation already exists. Cannot proceed with a new invitation.",
            customErrorCodes.CONFLICT_409
          );
        }
        const invitation = await ctx.invitationService.insertOne({
          ...args,
          isAccepted: false,
          senderEmail: (ctx.user as UserType)?.email,
        });
        await ctx.alertService.insertOne({
          targetType: "user",
          title: "Invitation to join a Property",
          description: `Site request sent by ${ctx.user?.name}`,
          status: "unread",
          targetId: recipientUser.id,
          extras: {
            alertType: "invitation",
            propertyName: property.name,
            propertyLogo: property.logoUrl,
            invitationId: invitation.id,
          },
        });
        return invitation;
      },
    });

    t.field("deleteInvitation", {
      type: "Boolean",
      args: {
        id: nonNull(stringArg()),
      },
      authorize: async (_parent, args, ctx) => {
        return isAuthenticated(ctx.user);
      },
      resolve: async (_parent, args, ctx) => {
        const invitation = await ctx.invitationService.getOr404({
          id: args.id,
        });
        if (invitation?.senderEmail != ctx.user?.email)
          throw new ClientFacingError(
            `User doesn't have access to delete invitation: ${args.id}.`,
            customErrorCodes.UNAUTHORIZED_401
          );
        const deletedResult = await ctx.invitationService.deleteOne({
          id: args.id,
        });
        if (deletedResult.deletedCount === 0)
          throw new ClientFacingError(
            `No property found with id: ${args.id}.`,
            customErrorCodes.NOT_FOUND_404
          );
        return true;
      },
    });

    t.field("acceptInvitation", {
      type: "Boolean",
      args: {
        id: nonNull(stringArg()),
      },
      authorize: async (_parent, args, ctx) => {
        return isAuthenticated(ctx.user);
      },
      resolve: async (_parent, args, ctx) => {
        const invitation = await ctx.invitationService.getOr404({
          id: args.id,
        });
        if (ctx.user?.email != invitation?.recipientEmail)
          throw new ClientFacingError(
            "User not allowed to be accept this invitation.",
            customErrorCodes.FORBIDDEN_403
          );
        const now = new Date();
        if (now > new Date(invitation.ttl))
          throw new ClientFacingError(
            "Invitation expired!",
            customErrorCodes.GONE_410
          );
        await ctx.invitationService.findOneAndUpdate(
          { id: args.id },
          { $set: { isAccepted: true } }
        );
        await ctx.userService.findOneAndUpdate(
          { email: invitation?.recipientEmail },
          {
            $set: {
              userType: invitation.invitationRole,
              propertyId: invitation.propertyId,
            },
          }
        );
        const senderUser = await ctx.userService.findOne({
          email: invitation.senderEmail,
        });
        const propertyDetails = await ctx.propertyService.findOne({
          id: invitation.propertyId,
        });
        await ctx.alertService.insertOne({
          targetType: "user",
          title: "Accepted Invitation to join a Property",
          description: `${ctx.user.email} has accepted your invitation for ${propertyDetails?.name}`,
          status: "unread",
          targetId: (senderUser as UserType)?.id,
        });
        return true;
      },
    });
  },
});
