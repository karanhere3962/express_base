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

  static select<D extends Record<string, any>, C extends BaseModel<D>>(
    this: {
      new (initValues: D): C;
      validationSchema: ZodSchema<D>;
      getTenisedTableName: () => string;
    },
    selectableFields: any = undefined
  ): Knex.QueryBuilder {
    return db.select(selectableFields || "*").from(this.getTenisedTableName());
  }

  getSerializationData<
    D extends Record<string, any>,
    C extends BaseModel<D>
  >(this: {
    new (initValues: D): C;
    data: Record<string, any>;
    serializerFields: string[];
  }): Record<string, any> {
    logger.debug(this);
    return (this.constructor as typeof BaseModel).serializerFields.reduce(
      (acc: Record<string, any>, key) => {
        acc[key] = this.data[key];
        return acc;
      },
      {}
    );
  }

  serialize(this: { getSerializationData: () => Record<string, any> }): string {
    return JSON.stringify(this.getSerializationData());
  }
}
