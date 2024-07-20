import {
  MongoClient,
  MongoClientOptions,
  Db,
  WithId,
  ObjectId,
  OptionalId,
  OptionalUnlessRequiredId,
} from "mongodb";
import { InternalError } from "../base/errors";

type InputType<T extends Record<string, any>> = T & {
  id?: string;
};

type OutputType<T extends Record<string, any>> = T & {
  id: string;
};

class BaseMongoModel<T extends Record<string, any>> {
  static collectionName: string;
  static _client: MongoClient | null = null;
  static _db: Db | null = null;

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
    console.log("This is it: ", this._class().collectionName);
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

  parseSingleInput(inputData: Partial<InputType<T>>) {
    let parsedInput = inputData as Record<string, any>;
    if ("id" in inputData) {
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
    const parsedOutput = outputData as Record<string, any>;
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
    console.log("InsertedData: ", insertedData);
    return this.parseSingleOutput(data as WithId<T>);
  }

  async insertMany(data: T[]) {
    const insertedData = await this.collection.insertMany(
      data as OptionalUnlessRequiredId<T>[]
    );
    console.log("InsertedData: ", insertedData);
    return this.parseOutput(data as WithId<T>[]);
  }
}

const url = "mongodb://localhost:27017";

type UserType = {
  name: string;
  email: string;
  age: number;
};

class UserService extends BaseMongoModel<UserType> {
  static collectionName: string = "testUser";
}

UserService.connect({
  uri: url,
  dbName: "htv_demo",
}).then(async () => {
  const userService = new UserService();
  const user = await userService.findOne({
    id: "669b89a4ca0f3a6c56e1e1ec",
  });
  const users = await userService.find();
  // if (!user || !users) {
  //   console.log("User: ", user);
  //   console.log("Users: ", users);

  //   UserService.disconnect();
  //   return;
  // }
  console.log(user);
  console.log(users);
  await userService.insertOne({
    name: "Krishna",
    email: "k.c@c.com",
    age: 19,
  });
  const newUser = await userService.insertMany([
    {
      name: "Krishna",
      email: "k.c@c.com",
      age: 19,
    },
    {
      name: "Krishna1",
      email: "k.c1@c.com",
      age: 19,
    },
    {
      name: "Krishna1",
      email: "k.c1@c.com",
      age: 19,
    },
    {
      name: "Krishna1",
      email: "k.c1@c.com",
      age: 19,
    },
  ]);
  await userService.collection.deleteOne();
  console.log(newUser);
  UserService.disconnect();
});
