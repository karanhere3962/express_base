import { ZodSchema } from "zod";
import { db } from "../setup";

export class BaseModel<T extends Record<string, any>> {
  static validationSchema: ZodSchema<any>;
  static tableName: string;

  data: T;

  constructor(initValues: T) {
    this.data = initValues;
  }

  static getTenantSchema(): string {
    return "public";
  }

  static getTenisedTableName(): string {
    return `${this.getTenantSchema()}.${this.tableName}`;
  }

  static async create<D extends Record<string, any>, C extends BaseModel<D>>(
    this: {
      new (initValues: D): C;
      validationSchema: ZodSchema<D>;
      tableName: string;
    } & typeof BaseModel,
    data: D
  ): Promise<C> {
    const validatedData = this.validationSchema.parse(data);
    await db(this.getTenisedTableName()).insert(validatedData);
    // This correctly creates an instance of the calling subclass
    return new this(validatedData);
  }
}
