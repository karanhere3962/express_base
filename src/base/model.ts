import { ZodSchema, z } from "zod";
import { getKnex, knexClient, logger, asyncLocalStorage } from "../setup";
import type { Knex } from "knex";
import { validateAndSanitize } from "../utils/validator";

// To Add: static validate method which will make the validation package agnostic

export interface BaseModelConstructor<D extends Record<string, any>> {
  data: D;
}

export type PKType = number | string;

export class BaseModel<T extends Record<string, any>>
  implements BaseModelConstructor<T>
{
  static validationSchema: ZodSchema<any>;
  static updateValidationSchema: ZodSchema<any>;
  static tableName: string;
  static schemaName: string | undefined = undefined;
  static serializerFields: string[];
  static pkKey: string;

  data: T;

  constructor(initValues: T) {
    this.data = initValues;
  }

  static getTenantSchema(): string {
    logger.debug(this);
    return this.schemaName || "public";
  }

  static getTenisedTableName(): string {
    return knexClient == "sqlite3"
      ? this.tableName
      : `${this.getTenantSchema()}.${this.tableName}`;
  }

  static getUpdateValidationSchema(): ZodSchema<Record<string, any>> {
    return (
      this.updateValidationSchema ||
      (
        this.validationSchema as z.ZodObject<Record<string, z.ZodType>>
      ).partial()
    );
  }

  static async create<D extends Record<string, any>>(data: D) {
    const validatedData = validateAndSanitize(data, this.validationSchema);
    const createdData: D = (
      await getKnex()(this.getTenisedTableName()).insert(validatedData, "*")
    )[0];
    return new this(createdData);
  }

  static async bulkCreate<T extends Record<string, any>>(data: T[]) {
    const validatedData: T[] = validateAndSanitize(
      data,
      z.array(this.validationSchema)
    );
    const insertedData: T[] = await getKnex()(
      this.getTenisedTableName()
    ).insert(validatedData, "*");
    return insertedData.map((element) => new this(element));
  }

  static kSelect(
    condition: Record<string, any> = {},
    selectableFields: any = undefined
  ): Knex.QueryBuilder {
    let query = getKnex()
      .select(selectableFields || "*")
      .from(this.getTenisedTableName());
    Object.entries(condition).forEach(([key, value]) => {
      query = query.where(key, value);
    });
    return query;
  }

  static async select<D extends Record<string, any>>(
    condition: Record<string, any> = {}
  ) {
    const data: Record<string, any>[] = await this.kSelect(condition);
    return data.map((element) => new this(element as D));
  }

  static async get<D extends Record<string, any>>(
    condition: Record<string, any> | PKType
  ) {
    if (typeof condition === "number" || typeof condition === "string") {
      condition = { [this.pkKey]: condition };
    }
    const data: D = await this.kSelect(condition).first();
    if (!data) {
      throw new Error("No data found for the specified condition.");
    }
    return new this(data);
  }

  async update<D extends Record<string, any>>(data: D) {
    const instanceClass = this.constructor as typeof BaseModel;
    if (instanceClass.pkKey in data) {
      throw new Error("Primary key cannot be updated.");
    }
    const updateValidationSchema = instanceClass.getUpdateValidationSchema();
    const validatedData = validateAndSanitize(data, updateValidationSchema);
    const updatedData: D = (
      await getKnex()(instanceClass.getTenisedTableName())
        .where({ [instanceClass.pkKey]: this.data[instanceClass.pkKey] })
        .update(validatedData, "*")
    )[0];
    Object.assign(this.data, updatedData);
    return this;
  }

  static async bulkUpdate<D extends Record<string, any>>(
    condition: Record<string, any> | PKType,
    updateData: Record<string, any>
  ) {
    if (typeof condition === "number" || typeof condition === "string") {
      condition = { [this.pkKey]: condition };
    }
    const updateValidationSchema = this.getUpdateValidationSchema();
    const validatedData = validateAndSanitize(
      updateData,
      updateValidationSchema
    );
    const data: D[] = await getKnex()(this.getTenisedTableName())
      .where(condition)
      .update(validatedData, "*");
    if (!data) {
      throw new Error("No data found for the specified condition.");
    }
    return data.map((element) => new this(element));
  }

  static getSerializationData(data: Record<string, any>): Record<string, any> {
    return this.serializerFields.reduce((acc: Record<string, any>, key) => {
      acc[key] = data[key];
      return acc;
    }, {});
  }

  static serializeData(
    data: Record<string, any> | Record<string, any>[]
  ): string {
    if (Array.isArray(data)) {
      return JSON.stringify(
        data.map((element) => this.getSerializationData(element))
      );
    }
    return JSON.stringify(this.getSerializationData(data));
  }

  static serialize<C extends BaseModel<Record<string, any>>>(
    data: C | C[]
  ): string {
    if (Array.isArray(data)) {
      return JSON.stringify(
        data.map((element) => this.getSerializationData(element.data))
      );
    }
    return data.serialize();
  }

  serialize(): string {
    return JSON.stringify(
      (this.constructor as typeof BaseModel).getSerializationData(this.data)
    );
  }
}

export class TenantBaseModel<
  D extends Record<string, any>
> extends BaseModel<D> {
  static asyncLocalStorage = asyncLocalStorage;
  static tableName: string;
  static storeSchemaKey: string = "tenantSchema";
  static get store(): Map<string, any> {
    const store = this.asyncLocalStorage.getStore();
    if (!store) {
      throw new Error("Store not found.");
    }
    return store;
  }

  static getTenantSchema(): string {
    // Not adding default value to the tenantSchema key to avoid accidental data leakage. Using TenantModelMixin and setting tenantSchema is mandatory.
    const schema = this.store.get(this.storeSchemaKey);
    if (!schema) {
      throw new Error(
        "Tenant schema not found. Set 'tenantSchema' in the store."
      );
    }
    return schema;
  }

  static getTenisedTableName(): string {
    return knexClient == "sqlite3"
      ? this.tableName
      : `${this.getTenantSchema()}.${this.tableName}`;
  }
}

// export type Constructor<T> = new (...args: any[]) => T;

// export function tenantClassMixin<T extends Constructor<{}>>(baseClass: T) {
//   return class extends baseClass {
//     static asyncLocalStorage = asyncLocalStorage;
//     static tableName: string;
//     static storeSchemaKey: string = "tenantSchema";
//     static get store(): Map<string, any> {
//       const store = this.asyncLocalStorage.getStore();
//       if (!store) {
//         throw new Error("Store not found.");
//       }
//       return store;
//     }

//     static getTenantSchema(): string {
//       // Not adding default value to the tenantSchema key to avoid accidental data leakage. Using TenantModelMixin and setting tenantSchema is mandatory.
//       const schema = this.store.get(this.storeSchemaKey);
//       if (!schema) {
//         throw new Error(
//           "Tenant schema not found. Set 'tenantSchema' in the store."
//         );
//       }
//       return schema;
//     }

//     static getTenisedTableName(): string {
//       return knexClient == "sqlite3"
//         ? this.tableName
//         : `${this.getTenantSchema()}.${this.tableName}`;
//     }
//   };
// }
