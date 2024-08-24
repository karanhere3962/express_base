import {
  MongoClient,
  MongoClientOptions,
  Db,
  WithId,
  ObjectId,
  OptionalId,
  OptionalUnlessRequiredId,
  Filter,
  MongoError,
  IndexSpecification,
  CreateIndexesOptions,
  CreateCollectionOptions,
  CollectionInfo,
  FindOptions,
  UpdateFilter,
  FindOneAndUpdateOptions,
} from "mongodb";
import { ClientFacingError, InternalError } from "../errors";
import { customErrorCodes } from "../errors/codes";

export type InputType<T extends Record<string, any>> = T & {
  id?: string;
};

export type OutputType<T extends Record<string, any>> = T & {
  id: string;
};

export class BaseMongoService<
  T extends Record<string, any>,
  I extends Record<string, any>,
  U extends Record<string, any>,
> {
  static collectionName: string;
  static _client: MongoClient | null = null;
  static _db: Db | null = null;
  static indexes: [IndexSpecification, CreateIndexesOptions?][];
  static validationSchema: CreateCollectionOptions;
  static existingCollections: CollectionInfo[] = [];

  static beforeCreate: (
    data: Record<string, any>
  ) => Promise<Record<string, any>>;
  static beforeUpdate: (
    data: Record<string, any>
  ) => Promise<Record<string, any>>;

  static async fetchExistingCollections() {
    this.existingCollections =
      (await this._db?.listCollections().toArray()) || [];
  }

  connectionExists(): boolean {
    return this._baseClass().existingCollections.some(
      (collection) => collection.name === this._baseClass().collectionName
    );
  }

  async init() {
    if (!this._baseClass()._client || !this._baseClass()._db)
      throw new InternalError("Connection not initialized.");
    await this.ensureValidationSchema();
    await this.ensureIndexes();
  }

  static async connect({
    uri,
    dbName,
    clientOptions = {},
    MongoClientCreator = MongoClient,
  }: {
    uri: string;
    dbName: string;
    clientOptions?: MongoClientOptions;
    MongoClientCreator?: new (...args: any[]) => MongoClient;
  }): Promise<Db> {
    if (!this._client) {
      this._client = new MongoClientCreator(uri, {
        minPoolSize: 1,
        maxPoolSize: 10,
        ...clientOptions,
      });
      await this._client.connect();
      this._db = this._client.db(dbName);
    }
    if (!this._db) {
      throw new InternalError("Database handle not created.");
    }
    return this._db;
  }

  static async disconnect() {
    if (this._client) {
      await this._client.close();
      this._client = null;
      this._db = null;
    }
  }

  _baseClass<C extends typeof BaseMongoService>() {
    return this.constructor as C;
  }

  get db(): Db {
    if (!this._baseClass()._db) {
      throw new InternalError(
        "DB connection not initialized. Use 'connect' method first to initliaize connection."
      );
    }
    return this._baseClass()._db as Db;
  }

  get collection() {
    if (!this._baseClass().collectionName) {
      throw new InternalError(
        `Static attribute 'collectionName' not set for class ${
          this._baseClass().name
        }`
      );
    }
    return this.db.collection<T>(this._baseClass().collectionName);
  }

  async ensureIndexes() {
    if (this._baseClass().indexes)
      for (const index of this._baseClass().indexes) {
        await this.collection.createIndex(...index);
      }
  }

  async ensureValidationSchema() {
    if (this._baseClass().validationSchema && !this.connectionExists()) {
      await this._baseClass()._db?.createCollection(
        this._baseClass().collectionName,
        this._baseClass().validationSchema
      );
    } else {
      await this._baseClass()._db?.command({
        collMod: this._baseClass().collectionName,
        ...this._baseClass().validationSchema,
      });
    }
  }

  parseInput(inputData: InputType<Partial<T>> | Filter<T>) {
    let parsedInput = { ...inputData } as Record<string, any>;
    if ("id" in inputData) {
      if (!ObjectId.isValid(String(inputData.id))) {
        throw new ClientFacingError(
          `Got invalid 'id' : ${inputData.id}.`,
          customErrorCodes.BAD_REQUEST_400
        );
      }
      parsedInput._id = new ObjectId(inputData.id as string);
      delete parsedInput.id;
    }
    return parsedInput as OptionalId<T>;
  }

  parseInputArr(inputData: Partial<InputType<T>>[] | Filter<T>[]) {
    return inputData.map((data) => this.parseInput(data));
  }

  parseOutput(outputData: WithId<T> | null) {
    if (!outputData) return null;
    const parsedOutput = { ...outputData } as Record<string, any>;
    parsedOutput.id = String(outputData._id);
    delete parsedOutput._id;

    return parsedOutput as OutputType<T>;
  }

  parseOutputArr(outputData: WithId<T>[] | null) {
    if (!outputData) return null;
    return outputData.map((data) => this.parseOutput(data) as OutputType<T>);
  }

  async findOne(filter: Filter<T> = Object()) {
    const parsedInput = this.parseInput(filter);
    return this.parseOutput(
      await this.collection.findOne<WithId<T>>(parsedInput)
    );
  }

  async getOr404(filter: Filter<T>) {
    const obj = await this.findOne(filter);
    if (!obj) {
      throw new ClientFacingError(
        `No match for filter ${JSON.stringify(filter)}.`,
        customErrorCodes.NOT_FOUND_404
      );
    }
    return obj;
  }

  async find(filter: Filter<T> = Object(), options: FindOptions = Object()) {
    const parsedInput = this.parseInput(filter);
    return this.parseOutputArr(
      await this.collection.find<WithId<T>>(parsedInput, options).toArray()
    );
  }

  parseDuplicateFields(errorMessage: string): string[] {
    const fieldPattern = /index: (.+?) dup key/;
    const match = errorMessage.match(fieldPattern);
    if (match && match[1]) {
      // Extract field names from the index name assuming a naming convention where fields are joined with underscores
      return match[1].split("_").filter((part, index, array) => {
        // This assumes index naming could end with _1 or could be composite like field1_field2_1
        // We remove number suffixes and presume fields do not have numeric names
        return !part.match(/^\d+$/) && index !== array.length - 1;
      });
    }
    return ["unspecified fields"]; // Fallback generic message
  }

  async insertOne(data: I) {
    try {
      const validatedData = await this._baseClass().beforeCreate(data);
      await this.collection.insertOne(
        validatedData as OptionalUnlessRequiredId<T>
      );
      return this.parseOutput(validatedData as WithId<T>) as T;
    } catch (error) {
      if (error instanceof MongoError && error.code === 11000) {
        const fields = this.parseDuplicateFields(error.message);
        if (fields.length === 1) {
          throw new ClientFacingError(
            `Duplicate value received for unique field ${fields[0]}.`,
            customErrorCodes.BAD_REQUEST_400
          );
        }
        if (fields.length >= 1) {
          throw new ClientFacingError(
            `Duplicate value received for unique fields ${fields.join(", ")}.`,
            customErrorCodes.BAD_REQUEST_400
          );
        }

        throw new ClientFacingError(
          "Duplicate value received for unique field. Check your request again.",
          customErrorCodes.BAD_REQUEST_400
        );
      } else {
        throw error;
      }
    }
  }

  async insertIfNotExists(filter: Filter<T> = Object(), insertData: I) {
    const obj = await this.findOne(filter);
    if (obj) return obj;
    return await this.insertOne(insertData);
  }

  async insertMany(data: I[]) {
    const validatedData = await Promise.all(
      data.map((element) => this._baseClass().beforeCreate(element))
    );
    await this.collection.insertMany(
      validatedData as OptionalUnlessRequiredId<T>[]
    );
    return this.parseOutputArr(validatedData as WithId<T>[]) as T[];
  }

  validateUpdateData(updateData: UpdateFilter<U>) {
    let validatedData: Record<string, any> = {};
    Object.keys(updateData).map((key) => {
      if (key in ["$set", "$min", "$max"])
        validatedData[key] = this._baseClass().beforeUpdate(updateData[key]);
      else {
        validatedData[key] = updateData[key];
      }
    });
    return validatedData;
  }

  async findOneAndUpdate(
    filter: Filter<T>,
    updateData: UpdateFilter<U>,
    updateOptions: FindOneAndUpdateOptions = Object()
  ) {
    const parsedFilter = this.parseInput(filter);
    const validatedData = this.validateUpdateData(updateData);
    return this.parseOutput(
      await this.collection.findOneAndUpdate(parsedFilter, validatedData, {
        returnDocument: "after",
        ...updateOptions,
      })
    );
  }

  async deleteOne(filter: Filter<T>) {
    const parsedInput = this.parseInput(filter);
    return await this.collection.deleteOne(parsedInput);
  }

  async deleteMany(filter: Filter<T>) {
    const parsedInput = this.parseInput(filter);
    return await this.collection.deleteMany(parsedInput);
  }
}
