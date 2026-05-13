import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export type JwtUserRole = 'client' | 'master' | 'platform_admin';

export interface AuthUserPayload {
  id: string;
  role: JwtUserRole;
}

interface JwtClaims {
  sub: string;
  role: JwtUserRole;
  iat?: number;
  exp?: number;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing bearer token', 'NO_TOKEN'));
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return next(ApiError.unauthorized('Empty bearer token', 'EMPTY_TOKEN'));
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtClaims;
    if (!decoded.sub || !decoded.role) {
      return next(ApiError.unauthorized('Invalid token payload', 'BAD_PAYLOAD'));
    }
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token', 'INVALID_TOKEN'));
  }
}

export function requireRole(...roles: JwtUserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient role', 'FORBIDDEN_ROLE'));
    }
    next();
  };
}
