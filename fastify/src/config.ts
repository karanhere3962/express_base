import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Constants
export const baseDir = path.resolve(__dirname, "..");
export const stage = process.env.NODE_ENV || "development";
export const isProduction = process.env.NODE_ENV === "production";
export const port = parseInt(process.env.PORT || "8000");

// Environment
dotenv.config({
  path: path.resolve(baseDir, "src", "env", `.env.${stage}`),
});

// Database

export const should_init_mongo_connection =
  (process.env.SHOULD_INIT_MONGO_CONNECTION || "TRUE") == "TRUE";
export const mongo_uri = process.env.MONGO_URI || "";
export const mongo_db_name = process.env.MONGO_DB_NAME || "";
export const mongo_client_options = {
  minPoolSize: parseInt(process.env.MONGO_MIN_POOLSIZE || "1"),
  maxPoolSize: parseInt(process.env.MONGO_MAX_POOLSIZE || "10"),
};
