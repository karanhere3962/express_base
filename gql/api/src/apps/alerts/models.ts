import { z } from "zod";
import { BaseMongoService } from "../../db";
import {
  AlertSchema,
  AlertInputSchema,
  AlertUpdateSchema,
  AllowedAlertTargets,
  AllowedAlertStatus,
  AlertExtrasSchema,
} from "./schemas";
import { IndexSpecification, CreateIndexesOptions } from "mongodb";

export type AlertType = z.infer<typeof AlertSchema>;
export type AlertInputType = z.infer<typeof AlertInputSchema>;
export type AlertUpdateType = z.infer<typeof AlertUpdateSchema>;
export type AllowedAlertTargetsValueType = (typeof AllowedAlertTargets)[number];
export type AlertExtrasType = z.infer<typeof AlertExtrasSchema>;

export class AlertService extends BaseMongoService<
  AlertType,
  AlertInputType,
  AlertUpdateType
> {
  static collectionName: string = "alerts";

  _alertServiceClass<C extends typeof AlertService>() {
    return this.constructor as C;
  }

  static async beforeCreate(data: Record<string, any>) {
    return {
      ...AlertInputSchema.parse(data),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  static async beforeUpdate(data: Record<string, any>) {
    return {
      ...AlertUpdateSchema.parse(data),
      updatedAt: new Date().toISOString(),
    };
  }

  static validationSchema = {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["targetId", "title", "description", "status", "targetType"],
        properties: {
          _id: {
            bsonType: "objectId",
            description: "MongoDB native ID field",
          },
          targetType: {
            enum: AllowedAlertTargets,
            description: `can only be one of ${JSON.stringify(
              AllowedAlertTargets
            )}`,
          },
          targetId: {
            bsonType: "string",
            maxLength: 50,
            description: "must be a string with a maximum length of 50",
          },
          title: {
            bsonType: "string",
            maxLength: 500,
            description: "must be a string with a maximum length of 500",
          },
          description: {
            bsonType: "string",
            maxLength: 1000,
            description: "must be a string with a maximum length of 1000",
          },
          status: {
            enum: AllowedAlertStatus,
            description: `can only be one of ${JSON.stringify(
              AllowedAlertStatus
            )}`,
          },
          landingUrl: {
            bsonType: "string",
            maxLength: 1000,
            description: "must be a string with a maximum length of 1000",
          },
          extras: {
            bsonType: ["object", "null"],
            additionalProperties: {
              anyOf: [
                {
                  bsonType: "string",
                },
                {
                  bsonType: "object",
                  additionalProperties: true,
                },
                {
                  bsonType: "null",
                },
                {
                  bsonType: "bool",
                },
              ],
            },
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
    [{ targetType: 1 }],
    [{ targetId: 1 }],
    [{ createdAt: -1 }],
    [{ updatedAt: -1 }],
  ];
}
