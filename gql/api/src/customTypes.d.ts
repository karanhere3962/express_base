import "fastify";
import { UserType } from "./apps/user/models";
import { TVType } from "./apps/tv/models";
declare module "fastify" {
  interface FastifyRequest {
    user?: UserType | null;
    tv?: TVType | null;
  }
}
