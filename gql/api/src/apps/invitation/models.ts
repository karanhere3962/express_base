import { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { BaseMongoService } from "../../db";
import {
  InvitationCreateInputSchema,
  InvitationCreateSchema,
  InvitationSchema,
  InvitationUpdateSchema,
} from "./schemas";
import { invitationTTLExpiryInDays } from "../../config";

export type InvitationType = z.infer<typeof InvitationSchema>;
export type InvitationCreateType = z.infer<typeof InvitationCreateSchema>;
export type InvitationCreateInputType = z.infer<
  typeof InvitationCreateInputSchema
>;
export type InvitationUpdateType = z.infer<typeof InvitationUpdateSchema>;

export class InvitationService extends BaseMongoService<
  InvitationType,
  InvitationCreateInputType,
  InvitationUpdateType
> {
  static collectionName: string = "invitations";

  _invitationServiceClass<C extends typeof InvitationService>() {
    return this.constructor as C;
  }

  static beforeCreate = async (
    data: Record<string, any>
  ): Promise<InvitationCreateType> => {
    const validatedData = InvitationCreateInputSchema.parse(data);
    return {
      propertyId: validatedData.propertyId,
      senderEmail: validatedData.senderEmail,
      recipientEmail: validatedData.recipientEmail,
      invitationRole: validatedData.invitationRole,
      isAccepted: validatedData.isAccepted,
      ttl: new Date(
        new Date().setDate(new Date().getDate() + invitationTTLExpiryInDays)
      ).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  static beforeUpdate = async (data: Record<string, any>) => {
    return {
      ...InvitationUpdateSchema.parse(data),
      updatedAt: new Date().toISOString(),
    };
  };

  static indexes: [IndexSpecification, CreateIndexesOptions?][] = [
    [{ senderEmail: 1 }],
    [{ recipientEmail: 1 }],
    [{ propertyId: 1 }],
    [{ createdAt: -1 }],
    [{ updatedAt: -1 }],
  ];

  static validationSchema = {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: [
          "senderEmail",
          "recipientEmail",
          "invitationRole",
          "propertyId",
          "ttl",
        ],
        properties: {
          _id: {
            bsonType: "objectId",
            description: "MongoDB native ID field",
          },
          senderEmail: {
            bsonType: "string",
            pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
            description: "must be a string and match the email pattern",
          },
          recipientEmail: {
            bsonType: "string",
            pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
            description: "must be a string and match the email pattern",
          },
          invitationRole: {
            bsonType: "string",
            description: "must be a string",
          },
          propertyId: {
            bsonType: "string",
            description: "must be a string",
          },
          isAccepted: {
            bsonType: "bool",
            description: "must be a boolean",
          },
          ttl: {
            bsonType: "string",
            description: "must be an ISO 8601 date string",
          },
          createdAt: {
            bsonType: "string",
            description: "must be an ISO 8601 date string",
          },
          updatedAt: {
            bsonType: "string",
            description: "must be an ISO 8601 date string",
          },
        },
      },
    },
    validationAction: "error", // Options are "error" or "warn"
    validationLevel: "strict", // Options are "strict" or "moderate"
  };
}
