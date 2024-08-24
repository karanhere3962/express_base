import { z } from "zod";
import { BaseMongoService } from "../../db";
import {
  UserCreateSchema,
  UserSchema,
  UserUpdateSchema,
  UserCreateInputSchema,
  AllowedUserTypes,
} from "./schemas";
import {
  accessTokenExpiryInSecs,
  JWTAlgorithm,
  passwordHashRounds,
  privateKey,
  publicKey,
} from "../../config";
import { CreateIndexesOptions, IndexSpecification } from "mongodb";
import bcrypt from "bcrypt";
import njwt from "njwt";
import { ClientFacingError } from "../../errors";
import { customErrorCodes } from "../../errors/codes";
import { UserType } from "./graphql";

export type UserType = z.infer<typeof UserSchema>;
export type UserCreateType = z.infer<typeof UserCreateSchema>;
export type UserCreateInputType = z.infer<typeof UserCreateInputSchema>;
export type UserUpdateType = z.infer<typeof UserUpdateSchema>;
export type JWTPayloadType = {
  id: string;
  email: string;
  userType: string;
};
export type TokensType = {
  accessToken: string;
};

export class UserService extends BaseMongoService<
  UserType,
  UserCreateInputType,
  UserUpdateType
> {
  static collectionName: string = "users";

  _userServiceClass<C extends typeof UserService>() {
    return this.constructor as C;
  }

  static hashPassword(password: string): string {
    return bcrypt.hashSync(password, passwordHashRounds);
  }

  static comparePassword(password: string, passwordHash: string) {
    return bcrypt.compareSync(password, passwordHash);
  }

  static beforeCreate = async (
    data: Record<string, any>
  ): Promise<UserCreateType> => {
    const validatedData = UserCreateInputSchema.parse(data);
    return {
      name: validatedData.name,
      email: validatedData.email,
      displayPicture: validatedData.displayPicture,
      userType: validatedData.userType,
      passwordHash: this.hashPassword(validatedData.password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };
  static beforeUpdate = async (data: Record<string, any>) => {
    return {
      ...UserUpdateSchema.parse(data),
      updatedAt: new Date().toISOString(),
    };
  };

  static validationSchema = {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["name", "email", "passwordHash"],
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
          email: {
            bsonType: "string",
            maxLength: 200,
            pattern: "^.+@.+$",
            description:
              "must be a string in email format with a maximum length of 200",
          },
          displayPicture: {
            bsonType: ["string", "null"],
            pattern: "^http(s)?://.+",
            description: "must be a valid URL or null",
          },
          userType: {
            enum: AllowedUserTypes,
            description: `can only be one of ${JSON.stringify(
              AllowedUserTypes
            )}`,
          },
          passwordHash: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          propertyId: {
            bsonType: ["string", "null"],
            description: "must be a valid id or null",
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
    validationAction: "error", // Options are "error" or "warn"
    validationLevel: "strict", // Options are "strict" or "moderate"
  };

  static indexes: [IndexSpecification, CreateIndexesOptions?][] = [
    [{ email: 1 }, { unique: true }],
    [{ userType: 1 }],
    [{ createdAt: -1 }],
    [{ updatedAt: -1 }],
  ];

  generateTokens(payload: JWTPayloadType): TokensType {
    const claims = {
      id: payload.id,
      email: payload.email,
      UserType: payload.userType,
    };
    return {
      accessToken: njwt
        .create(claims, privateKey, JWTAlgorithm)
        .setExpiration(Date.now() + accessTokenExpiryInSecs * 1000)
        .compact(),
    };
  }

  verifyAccessToken(accessToken: string): JWTPayloadType {
    try {
      const verifiedJwt = njwt.verify(accessToken, publicKey, JWTAlgorithm);
      return verifiedJwt?.body as unknown as JWTPayloadType;
    } catch (error: any) {
      console.error("Error while validating accessToken: ", error);
      throw new ClientFacingError(
        "Invalid access token provided.",
        customErrorCodes.UNAUTHORIZED_401
      );
    }
  }

  async login(email: string, password: string) {
    const user = await this.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.passwordHash))
      throw new ClientFacingError(
        "Invalid credentials provided. Please try again.",
        customErrorCodes.UNAUTHORIZED_401
      );

    return { user, tokens: this.generateTokens(user) };
  }
}
