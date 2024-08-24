import { ClientFacingError } from "../../errors";
import { customErrorCodes } from "../../errors/codes";
import { UserType } from "../user/models";
import { AuthUserType, isAdmin, isAuthenticated } from "../user/permissions";

export const hasViewInvitationPermission = (
  user: AuthUserType,
  senderEmail: string | undefined,
  recipientEmail: string | undefined,
  raiseError: boolean = true
) => {
  isAuthenticated(user, raiseError);
  if (isAdmin(user, raiseError)) {
    return true;
  }
  if (user?.email == senderEmail || user?.email == recipientEmail) return true;
  if (raiseError)
    throw new ClientFacingError(
      "User doesn't have required permission to access this invitation",
      customErrorCodes.UNAUTHORIZED_401
    );
  return false;
};

export const hasSendInvitationPermission = (
  user: AuthUserType,
  propertyId: string,
  raiseError: boolean = true
) => {
  isAuthenticated(user, raiseError);
  if (isAdmin(user, raiseError)) {
    return true;
  }
  if (
    (user as UserType).userType in ["property_owner", "device_manager"] &&
    user?.propertyId == propertyId
  )
    return true;

  if (raiseError)
    throw new ClientFacingError(
      "User doesn't have required permission to send invitation for this property.",
      customErrorCodes.UNAUTHORIZED_401
    );
  return false;
};
