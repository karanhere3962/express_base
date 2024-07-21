export class TPVError extends Error {
  errorCode: string;
  statusCode: number;
  errorType: string;
  constructor(
    message: string = "Internal server error.",
    {
      errorCode = "SERVER_ERROR",
      statusCode = 500,
      errorType = "TPVError",
    } = {}
  ) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.errorType = errorType;
  }
}

export class InternalError extends TPVError {}

export class ClientFacingError extends TPVError {}
