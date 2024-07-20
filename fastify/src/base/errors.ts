export class TPVError extends Error {
  constructor(
    message: string = "Internal server error.",
    public errorCode: string = "SERVER_ERROR",
    public statusCode: number = 500,
    public errorType: string = "TPVError"
  ) {
    super(message);
  }
}

export class InternalError extends TPVError {}

export class ClientFacingError extends TPVError {}
