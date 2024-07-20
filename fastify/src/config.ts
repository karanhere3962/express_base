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
export const DB_HOST = process.env.DB_HOST as string;
export const DB_NAME = process.env.DB_NAME as string;
export const DB_USER = process.env.DB_USER as string;
export const DB_PASSWORD = process.env.DB_PASSWORD as string;
export const DB_PORT = parseInt(process.env.DB_PORT || "5432");
