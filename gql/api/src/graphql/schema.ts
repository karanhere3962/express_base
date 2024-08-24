import { fieldAuthorizePlugin, makeSchema } from "nexus";
import path from "path";
import importGraphqlTypes from "./scanner";
import { baseDir } from "../config";

export function generateSchema() {
  const allTypes = importGraphqlTypes(path.join(__dirname, "..", "apps"));
  return makeSchema({
    types: allTypes,
    outputs: {
      schema: path.join(__dirname, "..", "generated", "schema.graphql"),
      typegen: path.join(__dirname, "..", "generated", "nexus-typegen.ts"),
    },
    contextType: {
      module: path.join(baseDir, "src", "graphql", "types.ts"),
      export: "ContextType",
    },
    plugins: [
      fieldAuthorizePlugin({
        formatError: ({ error }) => {
          return error ?? new Error("Not authorized");
        },
      }),
    ],
  });
}
