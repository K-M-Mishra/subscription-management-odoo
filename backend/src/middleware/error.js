import { ZodError } from 'zod';
export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
// Format wahi jo docs/API_CONTRACT.md mein hai: { error: { code, message, fields? } }
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const fields = Object.fromEntries(
      err.issues.map((i) => [i.path.join('.') || '_', i.message]),
    );
    return res
      .status(422)
      .json({
        error: {
          code: 'validation_failed',
          message: 'Please fix the highlighted fields.',
          fields,
        },
      });
  }
  if (err instanceof HttpError)
    return res
      .status(err.status)
      .json({
        error: { code: err.code, message: err.message, fields: err.fields },
      });
  if (String(err.message).includes('UNIQUE constraint failed'))
    return res
      .status(409)
      .json({
        error: {
          code: 'already_exists',
          message: 'This record already exists.',
        },
      });
  if (err.code === '23514' || err.code === '23503')
    return res
      .status(422)
      .json({
        error: {
          code: 'invalid_data',
          message: err.detail || 'Data is not valid.',
        },
      });
  if (err.type === 'entity.parse.failed')
    return res.status(400).json({ error: { message: 'Invalid JSON body.' } });
  console.error(err);
  res
    .status(500)
    .json({
      error: {
        code: 'server_error',
        message: 'Something went wrong on our side. Try again.',
      },
    });
}
