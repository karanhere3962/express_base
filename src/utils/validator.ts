import { z, ZodSchema } from "zod";
import xss from "xss";

// Function to recursively sanitize input
export const sanitizeInput = (value: any): any => {
  if (typeof value === "string") {
    return xss(value);
  } else if (Array.isArray(value)) {
    return value.map((item) => sanitizeInput(item));
  } else if (typeof value === "object" && value !== null) {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = sanitizeInput(value[key]);
      return acc;
    }, {} as any);
  }
  return value;
};

// Function to validate then sanitize data
export const validateAndSanitize = <T>(
  data: any,
  schema: ZodSchema<T>,
  sanitizeForXSS: boolean = false
): T => {
  // First validate the data using Zod
  const validatedData = schema.parse(data);

  // Then sanitize the validated data to prevent XSS
  if (sanitizeForXSS) {
    return sanitizeInput(validatedData);
  }

  // Return the sanitized data
  return validatedData;
};
