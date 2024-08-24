import { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { BaseMongoService } from "../../db";
import {
  PropertyCreateInputSchema,
  PropertyCreateSchema,
  PropertySchema,
  PropertyUpdateSchema,
} from "./schemas";

export type PropertyType = z.infer<typeof PropertySchema>;
export type PropertyCreateType = z.infer<typeof PropertyCreateSchema>;
export type PropertyCreateInputType = z.infer<typeof PropertyCreateInputSchema>;
export type PropertyUpdateType = z.infer<typeof PropertyUpdateSchema>;

export class PropertyService extends BaseMongoService<
  PropertyType,
  PropertyCreateInputType,
  PropertyUpdateType
> {
  static collectionName: string = "properties";

  _propertyServiceClass<C extends typeof PropertyService>() {
    return this.constructor as C;
  }

  static beforeCreate = async (
    data: Record<string, any>
  ): Promise<PropertyCreateType> => {
    const validatedData = PropertyCreateInputSchema.parse(data);
    return {
      name: validatedData.name,
      description: validatedData.description,
      logoUrl: validatedData.logoUrl,
      createdBy: validatedData.createdBy,
      isFake: validatedData.isFake,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  static beforeUpdate = async (data: Record<string, any>) => {
    return {
      ...PropertyUpdateSchema.parse(data),
      updatedAt: new Date().toISOString(),
    };
  };

  static indexes: [IndexSpecification, CreateIndexesOptions?][] = [
    [{ name: 1 }],
    [{ createdAt: -1 }],
    [{ updatedAt: -1 }],
  ];

  static validationSchema = {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["name"],
        properties: {
          _id: {
            bsonType: "objectId",
            description: "MongoDB native ID field",
          },
          name: {
            bsonType: "string",
            maxLength: 150,
            description: "must be a string with a maximum length of 150",
          },
          description: {
            bsonType: ["string", "null"],
            description: "must be a string or null",
          },
          logoUrl: {
            bsonType: ["string", "null"],
            pattern: "^https?://.*",
            description: "must be a valid URL or null",
          },
          isFake: {
            bsonType: ["bool"],
            description: "must be a boolean",
          },
          createdBy: {
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
