import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const zodErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    // Handle Zod validation errors
    return res.status(400).json({
      message: "Validation error",
      details: err.errors.map((e) => ({
        message: e.message,
        path: e.path.join("."),
      })),
    });
  } else if (err.type === "entity.parse.failed") {
    // Handle errors where the JSON is not parsable
    return res.status(422).json({
      message: "Invalid JSON payload",
    });
  } else {
    // Pass other types of errors to the next error handler
    next(err);
  }
};
