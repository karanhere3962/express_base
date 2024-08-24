import fs from "fs";
import path from "path";
import * as crypto from "crypto";

export interface RSAKeyPair {
  publicKeyPath: string;
  privateKeyPath: string;
}

export function generateKeyPair(folderPath: string): RSAKeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const publicKeyPath = path.join(folderPath, "public.key");
  const privateKeyPath = path.join(folderPath, "private.key");

  fs.writeFileSync(publicKeyPath, publicKey);
  fs.writeFileSync(privateKeyPath, privateKey);

  return { publicKeyPath, privateKeyPath };
}

export function loadKey(
  keyFolderPath: string,
  fileName: string,
  isProduction: boolean = false
): string {
  const keyPath = path.join(keyFolderPath, fileName);
  const exampleKeyPath = path.join(
    keyFolderPath,
    fileName.replace(".", ".example.")
  );

  try {
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, "utf8");
    } else {
      console.warn(
        `WARNING: Using example key for ${fileName}. This should not happen in production environments.`
      );
      // Fall back to the example key if the actual key doesn't exist
      return fs.readFileSync(exampleKeyPath, "utf8");
    }
  } catch (error) {
    console.error(`Failed to load key: ${fileName}`, error);
    throw new Error(`Failed to load key: ${fileName}`);
  }
}
