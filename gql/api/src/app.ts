import Fastify from "fastify";
import mercurius, { defaultErrorFormatter } from "mercurius";
import { generateSchema } from "./graphql/schema";

import { readFileSync } from "fs";
import path from "path";
import { port } from "./config";
import { initServices, terminateServices } from "./services";
import cors from "@fastify/cors";
import { tvAuthenticationHook, userAuthenticationHook } from "./hooks/auth";
import { TPVError } from "./errors";
import { GraphQLFormattedError } from "graphql";

async function createApp() {
  const app = Fastify({
    logger: {
      level: "debug",
    },
  });
  app.decorateRequest("user", null);
  app.decorateRequest("tv", null);
  app.addHook("preHandler", userAuthenticationHook);
  app.addHook("preHandler", tvAuthenticationHook);

  app.register(cors, {
    origin: (_, cb) => cb(null, true),
    credentials: true,
  });
  app.get("/", async (_req, _rep) => "Healthy!");
  app.get("/gql-schema", async (_, reply) => {
    reply.type("text/plain");
    return readFileSync(path.join(__dirname, "generated", "schema.graphql"));
  });

  ////////////////// GraphQL //////////////////

  const schema = generateSchema();
  const services = await initServices();
  app.register(mercurius, {
    schema,
    graphiql: true,
    context: (req, res) => ({
      ...services,
      log: req.log,
      user: req.user,
      tv: req.tv,
      res: res,
      req: req,
    }),
    errorFormatter(execution, context) {
      const formatter = defaultErrorFormatter(execution, context);
      let statusCode = formatter.statusCode || 500;

      let errors = formatter.response.errors || null;
      let updatedErrors: GraphQLFormattedError[] = [];

      if (errors) {
        execution.errors.map((err, index) => {
          const tpvError = err.originalError as TPVError;
          const formattedError = {
            ...errors[index],
            errorCode: tpvError.errorCode || "SERVER_ERROR",
          };
          statusCode = tpvError.statusCode || statusCode;
          updatedErrors.push(formattedError);
        });
      }
      return {
        statusCode: statusCode,
        response: {
          data: formatter.response.data,
          errors: updatedErrors,
        },
      };
    },
  });

  app.addHook("onClose", async () => await terminateServices());
  return app;
}

createApp().then((app) =>
  app.listen({
    host: "0.0.0.0",
    port: port,
  })
);
