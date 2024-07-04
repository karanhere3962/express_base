import { ZodSchema, z } from "zod";
import { db, knexClient, logger } from "../setup";
import type { Knex } from "knex";

export class BaseModel<T extends Record<string, any>> {
  static validationSchema: ZodSchema<any>;
  static tableName: string;
  static serializerFields: string[];

  data: T;

  constructor(initValues: T) {
    this.data = initValues;
  }

  static getTenantSchema(): string {
    return "public";
  }

  static getTenisedTableName(): string {
    return knexClient == "sqlite3"
      ? this.tableName
      : `${this.getTenantSchema()}.${this.tableName}`;
  }

  static async create<D extends Record<string, any>, C extends BaseModel<D>>(
    this: {
      new (initValues: D): C;
      validationSchema: ZodSchema<D>;
      getTenisedTableName: () => string;
    },
    data: D
  ): Promise<C> {
    const validatedData = this.validationSchema.parse(data);
    const createdData: D = (
      await db(this.getTenisedTableName()).insert(validatedData, "*")
    )[0];
    return new this(createdData);
  }

  static async bulkCreate<
    D extends Record<string, any>,
    C extends BaseModel<D>
  >(
    this: {
      new (initValues: D): C;
      validationSchema: ZodSchema<D>;
      getTenisedTableName: () => string;
    },
    data: D[]
  ): Promise<C[]> {
    const validatedData: D[] = z.array(this.validationSchema).parse(data);
    const insertedData: D[] = await db(this.getTenisedTableName()).insert(
      validatedData,
      "*"
    );
    return insertedData.map((element) => new this(element));
  }

  static kSelect<D extends Record<string, any>, C extends BaseModel<D>>(
    this: {
      new (initValues: D): C;
      validationSchema: ZodSchema<D>;
      getTenisedTableName: () => string;
    },
    condition: Record<string, any> = {},
    selectableFields: any = undefined
  ): Knex.QueryBuilder {
    let query = db
      .select(selectableFields || "*")
      .from(this.getTenisedTableName());
    Object.entries(condition).forEach(([key, value]) => {
      query = query.where(key, value);
    });
    return query;
  }

  static async select<D extends Record<string, any>, C extends BaseModel<D>>(
    this: {
      new (initValues: D): C;
      kSelect: (condition: Record<string, any>) => Knex.QueryBuilder;
    },
    condition: Record<string, any> = {}
  ): Promise<C[]> {
    const data: Record<string, any>[] = await this.kSelect(condition);
    return data.map((element) => new this(element as D));
  }

  static async get<D extends Record<string, any>, C extends BaseModel<D>>(
    this: {
      new (initValues: D): C;
      validationSchema: ZodSchema<D>;
      kSelect: (condition: Record<string, any>) => Knex.QueryBuilder;
    },
    condition: Record<string, any>
  ): Promise<C> {
    const data: D = await this.kSelect(condition).first();
    if (!data) {
      throw new Error("No data found for the specified condition.");
    }
    return new this(data);
  }

  static getSerializationData<
    D extends Record<string, any>,
    C extends BaseModel<D>
  >(
    this: {
      new (initValues: D): C;
      serializerFields: string[];
    },
    data: D
  ): Record<string, any> {
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

  static serialize<D extends Record<string, any>, C extends BaseModel<D>>(
    data: C | C[]
  ): string {
    if (Array.isArray(data)) {
      return JSON.stringify(
        data.map((element) => this.getSerializationData(element.data))
      );
    }
    return data.serialize();
  }

  serialize<D extends Record<string, any>, C extends BaseModel<D>>(
    this: C & {
      data: Record<string, any>;
    }
  ): string {
    return JSON.stringify(
      (this.constructor as typeof BaseModel).getSerializationData(this.data)
    );
  }
}
