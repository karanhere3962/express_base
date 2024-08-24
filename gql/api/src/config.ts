import path from "path";
import dotenv from "dotenv";
import { generateKeyPair } from "./helpers";
import fs from "fs";
import { InternalError } from "./errors";

dotenv.config();

// Constants
export const baseDir = path.resolve(__dirname, "..");
export const stage = process.env.NODE_ENV || "development";
export const isProduction = stage === "production";
export const port = parseInt(
  process.env.DOCKER_PORT || process.env.PORT || "8080"
);

// Environment
dotenv.config({
  path: path.resolve(baseDir, "src", "env", `.env.${stage}`),
});

// Logging

export const loggingFolder = path.join(baseDir, "src", "logs");

// Database
export const mongoUri =
  process.env.DOCKER_MONGO_URI || process.env.MONGO_URI || "";
export const mongoDbName = process.env.MONGO_DB_NAME || "";
export const mongoClientOptions = {
  minPoolSize: parseInt(process.env.MONGO_MIN_POOLSIZE || "1"),
  maxPoolSize: parseInt(process.env.MONGO_MAX_POOLSIZE || "10"),
};

// Security
export const passwordHashRounds = parseInt(
  process.env.PASSWORD_HASH_ROUNDS || "10"
);

export const keysFolder = path.join(baseDir, "src", "keys");
export const publicKeyPath = path.join(keysFolder, "public.key");
export const privateKeyPath = path.join(keysFolder, "private.key");

if (!fs.existsSync(publicKeyPath) || !fs.existsSync(privateKeyPath)) {
  if (isProduction)
    throw new InternalError("ERROR: Keys not found in 'src/keys/' directory.");
  generateKeyPair(keysFolder);
}

export const publicKey = fs.readFileSync(publicKeyPath);
export const privateKey = fs.readFileSync(privateKeyPath);
export const passPhrase = process.env.PRIVATE_KEY_PASSPHRASE || "";
export const accessTokenExpiryInSecs = parseInt(
  process.env.ACCESS_TOKEN_EXPIRY_IN_SECS || String(7 * 24 * 60 * 60) // 7 days default
);
export const JWTAlgorithm = "RS512";
export const invitationTTLExpiryInDays = 7;
