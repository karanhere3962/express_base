import { z } from "zod";
import { BaseMongoService } from "../../db";
import {
  RoomSchema,
  RoomCreateInputSchema,
  RoomCreateSchema,
  RoomUpdateSchema,
} from "./schemas";
import { CreateIndexesOptions, IndexSpecification } from "mongodb";

export type RoomType = z.infer<typeof RoomSchema>;
export type RoomCreateType = z.infer<typeof RoomCreateSchema>;
export type RoomCreateInputType = z.infer<typeof RoomCreateInputSchema>;
export type RoomUpdateType = z.infer<typeof RoomUpdateSchema>;

export class RoomService extends BaseMongoService<
  RoomType,
  RoomCreateInputType,
  RoomUpdateType
> {
  static collectionName: string = "rooms";

  _roomServiceClass<C extends typeof RoomService>() {
    return this.constructor as C;
  }

  static beforeCreate = async (
    data: Record<string, any>
  ): Promise<RoomCreateType> => {
    const validatedData = RoomCreateInputSchema.parse(data);
    return {
      propertyId: validatedData.propertyId,
      roomId: validatedData.roomId,
      guestName: validatedData.guestName,
      isFake: validatedData.isFake,
      checkInState: validatedData.checkInState,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  static beforeUpdate = async (data: Record<string, any>) => {
    return {
      ...RoomUpdateSchema.parse(data),
      updatedAt: new Date().toISOString(),
    };
  };

  static indexes: [IndexSpecification, CreateIndexesOptions?][] = [
    [{ macAddress: 1 }],
    [{ propertyId: 1 }],
    [{ createdAt: -1 }],
    [{ updatedAt: -1 }],
  ];

  static validationSchema = {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["propertyId", "roomId"],
        properties: {
          id: {
            bsonType: "string",
            description: "must be a string",
          },
          propertyId: {
            bsonType: "string",
            description: "must be a string",
          },
          roomId: {
            bsonType: "string",
            description: "must be a string",
          },
          checkInState: {
            bsonType: "bool",
            description: "must be a string",
          },
          guestName: {
            bsonType: "string",
            description: "must be a string",
          },
          isFake: {
            bsonType: "bool",
            description: "must be a boolean",
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
    validationAction: "error",
    validationLevel: "strict",
  };
}
