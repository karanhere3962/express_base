import { z } from "zod";
import { BaseMongoService } from "../../db";
import {
  TVSchema,
  TVInputSchema,
  TVUpdateSchema,
  AllowedClaimState,
} from "./schemas";
import { IndexSpecification, CreateIndexesOptions } from "mongodb";
import { ClientFacingError } from "../../errors";
import { customErrorCodes } from "../../errors/codes";

export type TVType = z.infer<typeof TVSchema>;
export type TVInputType = z.infer<typeof TVInputSchema>;
export type TVUpdateType = z.infer<typeof TVUpdateSchema>;

export class TVService extends BaseMongoService<
  TVType,
  TVInputType,
  TVUpdateType
> {
  static collectionName: string = "TVs";

  _TVServiceClass<C extends typeof TVService>() {
    return this.constructor as C;
  }

  static async beforeCreate(
    data: Record<string, any>
  ): Promise<Omit<TVType, "id">> {
    return {
      ...TVInputSchema.parse(data),
      claimState: "unclaimed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  static async beforeUpdate(data: Record<string, any>) {
    return {
      ...TVUpdateSchema.parse(data),
      updatedAt: new Date().toISOString(),
    };
  }

  static validationSchema = {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["thingId", "model"],
        properties: {
          _id: {
            bsonType: "objectId",
            description: "MongoDB native ID field",
          },
          thingId: {
            bsonType: "string",
            maxLength: 50,
            description: "must be a string with a maximum length of 50",
          },
          model: {
            bsonType: "string",
            maxLength: 100,
            description: "must be a string with a maximum length of 100",
          },
          roomId: {
            bsonType: "string",
            maxLength: 50,
            description: "must be a string with a maximum length of 50",
          },
          propertyId: {
            bsonType: "string",
            maxLength: 50,
            description: "must be a string with a maximum length of 50",
          },
          claimQRCode: {
            bsonType: "string",
            description: "must be a string",
          },
          claimState: {
            enum: AllowedClaimState,
            description: `can only be one of ${JSON.stringify(
              AllowedClaimState
            )}`,
          },
          cloneState: {
            bsonType: "string",
            description: "must be a string",
          },
          cloneProgress: {
            bsonType: "number",
            minimum: 0,
            maximum: 100,
            description: "must be a number in between 0 and 100",
          },
          createdAt: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          updatedAt: {
            bsonType: "string",
            description: "must be a string and is required",
          },
        },
      },
    },
    validationAction: "error",
    validationLevel: "strict",
  };

  static indexes: [IndexSpecification, CreateIndexesOptions?][] = [
    [{ thingId: 1 }, { unique: true }],
    [{ model: 1 }],
    [{ roomId: 1 }],
    [{ claimState: 1 }],
    [{ cloneState: 1 }],
    [{ createdAt: -1 }],
    [{ updatedAt: -1 }],
  ];

  verifyAccessToken(accessToken: string): { thingId: string } {
    try {
      const decodedToken = atob(accessToken);
      return JSON.parse(decodedToken);
    } catch {
      throw new ClientFacingError(
        "Error while parsing access token.",
        customErrorCodes.UNAUTHORIZED_401
      );
    }
  }

  generateTokens(payload: { thingId: string }) {
    return {
      accessToken: Buffer.from(JSON.stringify(payload)).toString("base64"),
    };
  }

  async login(thingId: string, model: string) {
    let tv = await this.findOne({ thingId });
    if (!tv) tv = await this.insertOne({ thingId, model, isFake: false });
    return { tv, tokens: this.generateTokens({ thingId }) };
  }
}
