export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  reason?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }

  static badRequest(message: string, code?: string) {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = 'Unauthorized', code?: string) {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Forbidden', code?: string) {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Not found', code?: string) {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code?: string) {
    return new ApiError(409, message, code);
  }

  static internal(message = 'Internal server error', code?: string) {
    return new ApiError(500, message, code);
  }

  static notImplemented(message = 'Not implemented', code = 'NOT_IMPLEMENTED') {
    return new ApiError(501, message, code);
  }

  static serviceUnavailable(message = 'Service unavailable', code = 'SERVICE_UNAVAILABLE') {
    return new ApiError(503, message, code);
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMITED') {
    return new ApiError(429, message, code);
  }
}
