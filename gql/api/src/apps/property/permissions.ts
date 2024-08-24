import { ClientFacingError } from "../../errors";
import { customErrorCodes } from "../../errors/codes";
import { AuthUserType, isAdmin, isAuthenticated } from "../user/permissions";

export const hasPropertyPermission = (
  user: AuthUserType,
  propertyId: string,
  raiseError: boolean = true
) => {
  isAuthenticated(user, raiseError);
  if (isAdmin(user, raiseError)) {
    return true;
  }
  if (user?.propertyId == propertyId) return true;
  if (raiseError)
    throw new ClientFacingError(
      "User doesn't have required permission to access this invitation",
      customErrorCodes.UNAUTHORIZED_401
    );
  return false;
};
