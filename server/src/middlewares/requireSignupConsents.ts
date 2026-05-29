import type { NextFunction, Request, Response } from 'express';
import { assertProfileHasRequiredConsents } from '../modules/legal/legal.service.js';
import { ApiError } from '../utils/ApiError.js';

/** Block authenticated actions until signup legal consents are satisfied. */
export function requireSignupConsents(req: Request, _res: Response, next: NextFunction): void {
  const profileId = req.user?.id;
  if (!profileId) {
    return next(ApiError.unauthorized('Unauthorized', 'AUTH_REQUIRED'));
  }
  void assertProfileHasRequiredConsents(profileId)
    .then(() => next())
    .catch(next);
}
