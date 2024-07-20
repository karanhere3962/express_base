import { makeSchema } from "nexus";
import path from "path";
import importGraphqlTypes from "./scanner";

export function generateSchema() {
  const allTypes = importGraphqlTypes(path.join(__dirname, "..", "apps"));
  return makeSchema({
    types: allTypes,
    outputs: {
      schema: path.join(__dirname, "..", "generated", "schema.graphql"),
      typegen: path.join(__dirname, "..", "generated", "nexus-typegen.ts"),
    },
  });
}
