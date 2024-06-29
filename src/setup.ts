import path from "path";
import dotenv from "dotenv";

dotenv.config()

// Constants

export const base_dir = path.resolve(__dirname, "..");
export const stage = process.env.NODE_ENV || "development";
export const is_production = process.env.NODE_ENV === "production";
export const port = parseInt(process.env.PORT || "8000");

// Environment
dotenv.config({ path: path.resolve(base_dir, "src", "env", `.env.${stage}`), override: true });