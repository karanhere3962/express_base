import { ClientFacingError } from "../../errors";
import { customErrorCodes } from "../../errors/codes";
import { AuthUserType, isAdmin, isAuthenticated } from "../user/permissions";
import { TVType } from "./models";

export type AuthTvType = TVType | null;

export const hasTVAccessForPropertyId = (
  user: AuthUserType,
  propertyId: string | null | undefined,
  raiseError: boolean = true
) => {
  isAuthenticated(user, raiseError);
  if (isAdmin(user, raiseError)) {
    return true;
  }
  if (user?.propertyId && user?.propertyId === propertyId) return true;
  if (raiseError)
    throw new ClientFacingError(
      "User doesn't have required permission to access TVs in given property.",
      customErrorCodes.FORBIDDEN_403
    );
  return false;
};

export const hasClaimPermission = (
  user: AuthUserType,
  raiseError: boolean = true
) => {
  if (isAdmin(user, false)) return true;
  if (user?.userType === "claimer") return true;
  if (raiseError)
    throw new ClientFacingError(
      "User doesn't have required permission to claim the TV.",
      customErrorCodes.FORBIDDEN_403
    );
  return false;
};

export const isTVAuthenticated = (tv: AuthTvType, raiseError = true) => {
  if (tv) return true;
  if (raiseError)
    throw new ClientFacingError(
      "TV needs to be authenticated.",
      customErrorCodes.UNAUTHORIZED_401
    );
  return false;
};
