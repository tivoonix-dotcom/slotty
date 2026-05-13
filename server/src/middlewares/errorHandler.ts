import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const msg = err.issues.map((e) => e.message).join('; ') || 'Validation failed';
    return res.status(400).json({
      error: {
        message: msg,
        code: 'VALIDATION',
      },
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(err.code ? { code: err.code } : {}),
      },
    });
  }

  console.error(err);
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL',
    },
  });
}
