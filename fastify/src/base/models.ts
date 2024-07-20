import {
  MongoClient,
  MongoClientOptions,
  Db,
  Collection,
  Document,
  ObjectId,
} from "mongodb";

export class MongoDBConnector {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(
    uri: string,
    dbName: string,
    clientOptions: MongoClientOptions = {}
  ): Promise<Db> {
    if (!this.client) {
      // Updated MongoClient options
      this.client = new MongoClient(uri, {
        minPoolSize: 4,
        maxPoolSize: 10,
        ...clientOptions,
      });
      await this.client.connect();
      console.log("Connected successfully to MongoDB");
      this.db = this.client.db(dbName);
    }
    if (!this.db) {
      throw new Error("Database handle not created");
    }
    return this.db;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log("Disconnected from MongoDB");
      this.client = null;
      this.db = null;
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error(
        "Database connection is not established. Call connect first."
      );
    }
    return this.db;
  }
}

const id = new ObjectId("507f1f77bcf86cd799439011");

console.log(String(id));
