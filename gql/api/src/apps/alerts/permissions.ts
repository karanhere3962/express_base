import { ClientFacingError } from "../../errors";
import { customErrorCodes } from "../../errors/codes";
import { AuthUserType, isAdmin, isAdminOrSelf } from "../user/permissions";
import { AuthTvType, isTVAuthenticated } from "../tv/permissions";
import { AllowedAlertTargetsValueType } from "./models";

export const hasGetAlertPermission = (
  id: string,
  targetType: AllowedAlertTargetsValueType,
  user: AuthUserType,
  tv: AuthTvType,
  raiseError: boolean = true
) => {
  if (!id)
    throw new ClientFacingError(
      `One of two, 'thingId' or 'userId' is required.`,
      customErrorCodes.BAD_REQUEST_400
    );
  if (targetType == "user") return isAdminOrSelf(id, user, false);
  if (isAdmin(user, false)) return true;
  isTVAuthenticated(tv);
  if (tv?.thingId === id) return true;
  if (raiseError)
    throw new ClientFacingError(
      "Need admin permissions to execute this request.",
      customErrorCodes.FORBIDDEN_403
    );
  return false;
};
