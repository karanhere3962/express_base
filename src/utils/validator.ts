import JoiBase, { ObjectSchema } from "joi";
import xss from "xss";

export const Joi = JoiBase.extend((joi) => ({
  type: "string",
  base: joi.string(),
  rules: {
    sanitize: {
      validate(value, helpers) {
        // Sanitize the value
        const clean = xss(value);
        return clean; // Return the sanitized string
      },
    },
  },
}));

export const validate = (input: any, schema: ObjectSchema) => {
  const { error, value } = schema.validate(input, { abortEarly: false });
  if (error) {
    throw error; // Throws the error forward if validation fails
  }
  return value; // Returns the validated value if no errors
};
