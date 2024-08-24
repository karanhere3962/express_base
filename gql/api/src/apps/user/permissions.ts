import { ClientFacingError } from "../../errors";
import { customErrorCodes } from "../../errors/codes";
import { UserType } from "./models";

export type AuthUserType = UserType | null;

export const isAuthenticated = (user: AuthUserType, raiseError = true) => {
  if (user) return true;
  if (raiseError)
    throw new ClientFacingError(
      "User needs to be authenticated.",
      customErrorCodes.UNAUTHORIZED_401
    );
  return false;
};

export const isAdmin = (user: AuthUserType, raiseError = true) => {
  if (!isAuthenticated(user, raiseError)) return false;
  const isAuthorized = user?.userType === "admin";
  if (!isAuthorized)
    if (raiseError)
      throw new ClientFacingError(
        "Need admin permissions to execute this request.",
        customErrorCodes.FORBIDDEN_403
      );
  return isAuthorized;
};

export const isAdminOrSelf = (
  id: string,
  user: AuthUserType,
  raiseError = true
) => {
  if (!isAuthenticated(user, raiseError)) return false;
  if (isAdmin(user, (raiseError = false))) return true;

  const isAuthorized = user?.id === id;

  if (!isAuthorized)
    if (raiseError)
      throw new ClientFacingError(
        "Not sufficient permission to execute this request.",
        customErrorCodes.FORBIDDEN_403
      );
  return isAuthorized;
};
