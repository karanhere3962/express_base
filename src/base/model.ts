import { ZodSchema, z } from "zod";
import knex from "knex";

export class BaseModel<T extends Record<string, any>> {
  static validationSchema: ZodSchema<any>;
  static tableName: string;

  data: T;

  constructor(initValues: T) {
    this.data = initValues;
  }

  static getTenantSchema() {
    return "public";
  }

  static getTenisedTableName() {
    return `${this.getTenantSchema()}.${this.tableName}`;
  }

  static async create<D extends Record<string, any>, T extends BaseModel<D>>(
    this: { new (initValues: D): T; validationSchema: ZodSchema<D> },
    data: D
  ): Promise<T> {
    const validatedData = this.validationSchema.parse(data);
    return new this(validatedData);
  }

  printData() {
    console.log(this.data);
  }
}
