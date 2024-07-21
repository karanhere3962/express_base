import {
  MongoClient,
  MongoClientOptions,
  Db,
  WithId,
  ObjectId,
  OptionalId,
  OptionalUnlessRequiredId,
} from "mongodb";
import {
  should_init_mongo_connection,
  mongo_uri,
  mongo_db_name,
  mongo_client_options,
} from "../config";
import { ClientFacingError, InternalError } from "../errors";
import errorCodes from "../errors/codes";

export type InputType<T extends Record<string, any>> = T & {
  id?: string;
};

export type OutputType<T extends Record<string, any>> = T & {
  id: string;
};

export class BaseMongoModel<T extends Record<string, any>> {
  static collectionName: string;
  static _client: MongoClient | null = null;
  static _db: Db | null = null;
  static collectionIndexes: Record<string, any>;
  static indexes = [];
  static validationSchema = {};

  constructor() {
    // For testing child classes, set process.env.SHOULD_INIT_MONGO_CONNECTION to "FALSE" (default is "TRUE"), then import BaseMongoModel, set mock values for static attributes '_client' and '_db' in BaseMongoModel. Once done, import child classes and proceed with tests.
    if (!this._class()._client || !this._class()._db)
      throw new InternalError("Connection not initialized.");

    this.ensureValidationSchema().then(async () => await this.ensureIndexes());
  }

  static async connect({
    uri,
    dbName,
    clientOptions = {},
  }: {
    uri: string;
    dbName: string;
    clientOptions?: MongoClientOptions;
  }): Promise<Db> {
    if (!this._client) {
      this._client = new MongoClient(uri, {
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

  _class<C extends typeof BaseMongoModel>() {
    return this.constructor as C;
  }

  get db(): Db {
    if (!this._class()._db) {
      throw new InternalError(
        "DB connection not initialized. Use 'connect' method first to initliaize connection."
      );
    }
    return this._class()._db as Db;
  }

  get collection() {
    if (!this._class().collectionName) {
      throw new InternalError(
        `Static attribute 'collectionName' not set for class ${
          this._class().name
        }`
      );
    }
    return this.db.collection<T>(this._class().collectionName);
  }

  async ensureIndexes() {
    if (this._class().indexes)
      await this.collection.createIndexes(this._class().indexes);
  }

  async ensureValidationSchema() {
    if (this._class().validationSchema) {
      this.collection;
      await this._class()._db?.command(this._class().validationSchema);
    }
  }

  parseSingleInput(inputData: Partial<InputType<T>>) {
    let parsedInput = { ...inputData } as Record<string, any>;
    if ("id" in inputData) {
      if (!ObjectId.isValid(String(inputData.id))) {
        throw new ClientFacingError(
          `Got invalid 'id' : ${inputData.id}.`,
          errorCodes.BAD_REQUEST_400
        );
      }
      parsedInput._id = new ObjectId(inputData.id);
      delete parsedInput.id;
    }
    return parsedInput as OptionalId<T>;
  }

  parseInput(inputData: Partial<InputType<T>>[]) {
    return inputData.map((data) => this.parseSingleInput(data));
  }

  parseSingleOutput(outputData: WithId<T> | null) {
    if (!outputData) return null;
    const parsedOutput = { ...outputData } as Record<string, any>;
    parsedOutput.id = String(outputData._id);
    delete parsedOutput._id;

    return parsedOutput as OutputType<T>;
  }

  parseOutput(outputData: WithId<T>[] | null) {
    if (!outputData) return null;
    return outputData.map(
      (data) => this.parseSingleOutput(data) as OutputType<T>
    );
  }

  async findOne(conditions: Partial<InputType<T>> = Object()) {
    const parsedInput = this.parseSingleInput(conditions);
    return this.parseSingleOutput(
      await this.collection.findOne<WithId<T>>(parsedInput)
    );
  }

  async getOr404(conditions: Partial<InputType<T>>) {
    const obj = await this.findOne(conditions);
    if (!obj) {
      throw new ClientFacingError(
        `No match for filter ${JSON.stringify(conditions)}.`,
        errorCodes.NOT_FOUND_404
      );
    }
    return obj;
  }

  async find(conditions: Partial<InputType<T>> = Object()) {
    const parsedInput = this.parseSingleInput(conditions);
    return this.parseOutput(
      await this.collection.find<WithId<T>>(parsedInput).toArray()
    );
  }

  async insertOne(data: T) {
    const insertedData = await this.collection.insertOne(
      data as OptionalUnlessRequiredId<T>
    );
    return this.parseSingleOutput(data as WithId<T>);
  }

  async insertMany(data: T[]) {
    const insertedData = await this.collection.insertMany(
      data as OptionalUnlessRequiredId<T>[]
    );
    return this.parseOutput(data as WithId<T>[]);
  }
}

if (should_init_mongo_connection)
  BaseMongoModel.connect({
    uri: mongo_uri,
    dbName: mongo_db_name,
    clientOptions: mongo_client_options,
  });
