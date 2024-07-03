import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import Joi from "joi";

export const joiErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err && err.isJoi) {
    // Handle Joi errors
    return res.status(400).json({
      message: "Validation error",
      details: err.details.map((e: Joi.ValidationErrorItem) => ({
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
