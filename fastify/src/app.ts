import Fastify from "fastify";
import mercurius from "mercurius";
import { generateSchema } from "./graphql/schema";

const app = Fastify();
const schema = generateSchema();
app.register(mercurius, {
  schema,
  graphiql: true,
});

app.listen({
  port: 8000,
});
