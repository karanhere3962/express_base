import {
  MongoClient,
  MongoClientOptions,
  Db,
  Collection,
  WithId,
  ObjectId,
  Document as MongoDocument,
  OptionalId,
} from "mongodb";
import { InternalError, TPVError } from "./base/errors";

type MongoInputData<T extends Record<string, any>> = T & {
  id?: string;
};

type MongoParsedInputData<T extends Record<string, any>> = T & {
  _id?: ObjectId;
};

type MongoOutputData<T extends Record<string, any>> = {
  _id: ObjectId;
} & T;

type MongoParsedOutputData<T extends Record<string, any>> = T & {
  id: string;
};

class BaseMongoModel<T extends Record<string, any>> {
  static collectionName: string = "default";
  static _client: MongoClient | null = null;
  static _db: Db | null = null;

  static async connect(
    uri: string,
    dbName: string,
    clientOptions: MongoClientOptions = {}
  ): Promise<Db> {
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

  static async disconnect(): Promise<void> {
    if (this._client) {
      await this._client.close();
      this._client = null;
      this._db = null;
    }
  }

  _class<C extends typeof BaseMongoModel>(): C {
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
    return this.db.collection<MongoOutputData<T>>(this._class().collectionName);
  }

  parseSingleInput(
    inputData: Partial<MongoInputData<T>>
  ): MongoParsedInputData<T> {
    let parsedInput = inputData as Record<string, any>;
    if ("id" in inputData) {
      parsedInput._id = new ObjectId(inputData.id);
      delete parsedInput.id;
    }
    return parsedInput as MongoParsedInputData<T>;
  }

  parseInput(inputData: Partial<MongoInputData<T>>[]) {
    return inputData.map((data) => this.parseSingleInput(data));
  }

  parseSingleOutput(outputData: MongoOutputData<T> | null) {
    if (!outputData) return null;
    const parsedOutput = outputData as Record<string, any>;
    parsedOutput.id = String(outputData._id);
    delete parsedOutput._id;

    return parsedOutput as MongoParsedOutputData<T>;
  }

  parseOutput(outputData: MongoOutputData<T>[] | null) {
    if (!outputData) return null;
    return outputData.map(
      (data) => this.parseSingleOutput(data) as MongoParsedOutputData<T>
    );
  }

  async findOne(conditions: Partial<MongoInputData<T>> = Object()) {
    const parsedInput = this.parseSingleInput(conditions);
    return this.parseSingleOutput(
      await this.collection.findOne<MongoOutputData<T>>(parsedInput)
    );
  }

  async find(conditions: Partial<MongoInputData<T>> = Object()) {
    const parsedInput = this.parseSingleInput(conditions);
    return this.parseOutput(
      await this.collection.find<MongoOutputData<T>>(parsedInput).toArray()
    );
  }
}

const url = "mongodb://localhost:27017";

type UserType = {
  name: string;
  email: string;
  age: number;
};

class UserService extends BaseMongoModel<UserType> {}

UserService.connect(url, "htv_demo").then(async () => {
  const userService = new UserService();
  const user = await userService.findOne({
    id: "669b89a4ca0f3a6c56e1e1ec",
  });
  const users = await userService.find();
  if (!user || !users) {
    console.log("User: ", user);
    console.log("Users: ", users);

    UserService.disconnect();
    return;
  }
  console.log(user);
  console.log(user.age);
  console.log(users);
  UserService.disconnect();
});
