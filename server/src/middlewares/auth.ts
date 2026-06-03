import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { isProfileEmptyDuplicate } from '../modules/auth/profileDuplicatePolicy.js';
import { resolveCanonicalProfileId } from '../modules/auth/authIdentities.service.js';
import { loadProfileAuthContext } from '../modules/profiles/profileAccount.service.js';
import type { ProfileAccountStatus } from '../modules/profiles/profileAccount.service.js';
import {
  assertAuthSessionActive,
  touchAuthSession,
} from '../modules/auth/authSessions.service.js';
import { ApiError } from '../utils/ApiError.js';

export type JwtUserRole = 'client' | 'master' | 'platform_admin';

export interface AuthUserPayload {
  id: string;
  role: JwtUserRole;
  accountStatus: ProfileAccountStatus;
  restrictionReason: string | null;
  blockedReason: string | null;
  accessRestrictedUntil: string | null;
}

interface JwtClaims {
  sub: string;
  role: JwtUserRole;
  sid?: string;
  iat?: number;
  exp?: number;
}

function applyBlockedDeleted(ctx: Awaited<ReturnType<typeof loadProfileAuthContext>>): ApiError | null {
  if (ctx.accountStatus === 'blocked') {
    const reason = ctx.blockedReason?.trim() || 'Аккаунт заблокирован';
    const err = ApiError.forbidden(`Аккаунт заблокирован. Причина: ${reason}`, 'ACCOUNT_BLOCKED');
    err.reason = ctx.blockedReason?.trim() || undefined;
    return err;
  }
  if (ctx.accountStatus === 'deleted') {
    return ApiError.forbidden('Аккаунт удалён', 'ACCOUNT_DELETED');
  }
  return null;
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
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
    if (!decoded.sub) {
      return next(ApiError.unauthorized('Invalid token payload', 'BAD_PAYLOAD'));
    }
    let profileId = decoded.sub;
    if (await isProfileEmptyDuplicate(profileId)) {
      profileId = await resolveCanonicalProfileId(profileId);
    }
    const ctx = await loadProfileAuthContext(profileId);
    const blockedErr = applyBlockedDeleted(ctx);
    if (blockedErr) {
      return next(blockedErr);
    }
    const authSessionId = typeof decoded.sid === 'string' ? decoded.sid : null;
    if (authSessionId) {
      await assertAuthSessionActive(authSessionId, profileId);
      void touchAuthSession(authSessionId);
    }
    req.user = {
      id: ctx.id,
      role: ctx.role,
      authSessionId,
      accountStatus: ctx.accountStatus,
      restrictionReason: ctx.restrictionReason,
      blockedReason: ctx.blockedReason,
      accessRestrictedUntil: ctx.accessRestrictedUntil,
    };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized('Invalid or expired token', 'INVALID_TOKEN'));
  }
}

/** Если Bearer валиден — заполняет req.user; иначе продолжает без пользователя. */
export async function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtClaims;
    if (!decoded.sub) return next();
    let profileId = decoded.sub;
    if (await isProfileEmptyDuplicate(profileId)) {
      profileId = await resolveCanonicalProfileId(profileId);
    }
    const ctx = await loadProfileAuthContext(profileId);
    if (ctx.accountStatus === 'blocked' || ctx.accountStatus === 'deleted') {
      return next();
    }
    const authSessionId = typeof decoded.sid === 'string' ? decoded.sid : null;
    if (authSessionId) {
      try {
        await assertAuthSessionActive(authSessionId, profileId);
      } catch {
        return next();
      }
    }
    req.user = {
      id: ctx.id,
      role: ctx.role,
      authSessionId,
      accountStatus: ctx.accountStatus,
      restrictionReason: ctx.restrictionReason,
      blockedReason: ctx.blockedReason,
      accessRestrictedUntil: ctx.accessRestrictedUntil,
    };
  } catch {
    /* ignore invalid optional token */
  }
  next();
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
