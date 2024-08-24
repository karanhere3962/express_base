import { FastifyBaseLogger, FastifyRequest } from "fastify";
import { UserType } from "../apps/user/models";
import { services } from "../services";
import { TVType } from "../apps/tv/models";
import { FastifyReply } from "fastify/types/reply";

export type ContextType = typeof services & {
  user: UserType | null;
  tv: TVType | null;
  log: FastifyBaseLogger;
  res: FastifyReply;
  req: FastifyRequest;
};

export type PermissionArgType = {
  ctx?: ContextType;
  args?: Record<string, any>;
  info?: Record<string, any>;
  root?: Record<string, any>;
};

export type PermissionType = (
  args: PermissionArgType
) => boolean | Promise<boolean>;
