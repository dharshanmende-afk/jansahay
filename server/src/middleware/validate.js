import { ZodError } from 'zod';

/**
 * Universal Zod validation middleware for Express
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} [target='body']
 */
export const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[target] || {};
      const parsed = schema.parse(dataToValidate);
      req[target] = parsed; // assign sanitized data
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const formattedErrors = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: formattedErrors[0]?.message || 'Invalid input data provided',
          details: formattedErrors
        });
      }
      next(err);
    }
  };
};

export default validate;
