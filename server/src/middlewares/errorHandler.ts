import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { captureApiException } from '../lib/sentry.js';
import { redactBodyForLog } from './requestId.js';
import { ApiError } from '../utils/ApiError.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId ?? 'unknown';
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
        ...(err.reason ? { reason: err.reason } : {}),
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  const logPayload: Record<string, unknown> = {
    requestId,
    method: req.method,
    path: req.originalUrl,
  };
  if (env.NODE_ENV !== 'production' && req.body && typeof req.body === 'object') {
    logPayload.body = redactBodyForLog(req.body);
  }
  console.error('[api-error]', logPayload, err instanceof Error ? err.message : err);
  captureApiException(err, {
    requestId,
    profileId: typeof req.user?.id === 'string' ? req.user.id : undefined,
    path: req.originalUrl,
  });
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL',
    },
  });
}
