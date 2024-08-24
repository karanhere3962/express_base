import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify";
import { ClientFacingError } from "../errors";
import { customErrorCodes } from "../errors/codes";
import { services } from "../services";

export async function userAuthenticationHook(
  request: FastifyRequest,
  _: FastifyReply
) {
  const authHeader: string | undefined = request.headers.authorization;

  if (!authHeader) return;
  else {
    if (!authHeader.startsWith("Bearer "))
      throw new ClientFacingError(
        "Authorization should be a bearer token that starts with 'Bearer'. Eg: 'Bearer <token here>'.",
        customErrorCodes.UNAUTHORIZED_401
      );
    const accessToken = authHeader.substring(7);
    const payload = services.userService.verifyAccessToken(accessToken);
    request.user = await services.userService.findOne({ id: payload.id });
    if (!request.user)
      throw new ClientFacingError(
        "User might be deleted.",
        customErrorCodes.UNAUTHORIZED_401
      );
  }
}

export async function tvAuthenticationHook(
  request: FastifyRequest,
  _: FastifyReply
) {
  const authHeader: string | undefined = request.headers["x-authorization"] as
    | string
    | undefined;
  if (!authHeader) return;
  else {
    if (!authHeader.startsWith("Bearer "))
      throw new ClientFacingError(
        "Authorization should be a bearer token that starts with 'Bearer'. Eg: 'Bearer <token here>'.",
        customErrorCodes.UNAUTHORIZED_401
      );
    const accessToken = authHeader.substring(7);
    const payload = services.tvService.verifyAccessToken(accessToken);
    request.tv = await services.tvService.findOne({
      thingId: payload.thingId,
    });
    if (!request.tv)
      throw new ClientFacingError(
        "Invalid access token provided.",
        customErrorCodes.UNAUTHORIZED_401
      );
  }
}
