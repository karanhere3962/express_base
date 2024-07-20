import fs from "fs";
import path from "path";

// Define a recursive function to find all graphql.ts files and import them
export default function importGraphqlTypes(directory: string): any[] {
  const types: any[] = [];

  // Helper function to check if the directory should be skipped
  function shouldSkip(dir: string): boolean {
    try {
      const indexPath = path.join(dir, "index.ts");
      const indexFile = require(indexPath);
      return indexFile.SKIP_GRAPHQL_SCAN === true;
    } catch (error) {
      // If the index.ts doesn't exist or doesn't have SKIP_GRAPHQL_SCAN, don't skip
      return false;
    }
  }

  // Helper function to recursively scan directories
  function scanDir(dir: string) {
    // Check if the directory should be skipped
    if (shouldSkip(dir)) {
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    // Process each entry in the directory
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recurse into subdirectories
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name === "graphql.ts") {
        // Dynamically import graphql.ts files
        const imported = require(fullPath);
        types.push(imported);
      }
    }
  }

  // Start scanning from the initial directory
  scanDir(directory);

  return types;
}
