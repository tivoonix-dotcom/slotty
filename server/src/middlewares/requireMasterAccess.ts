import type { NextFunction, Request, Response } from 'express';
import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Доступ к кабинету мастера: JWT с ролью master/admin или уже созданная строка master_profiles
 * (после POST /api/masters/me токен может ещё содержать role=client).
 */
export const requireMasterDbAccess = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (req.user.role === 'master' || req.user.role === 'platform_admin') {
      next();
      return;
    }
    const r = await query(`select 1 from public.master_profiles where master_id = $1 limit 1`, [req.user.id]);
    if (r.rowCount) {
      next();
      return;
    }
    throw ApiError.forbidden('Сначала завершите анкету мастера.', 'NO_MASTER_PROFILE');
  },
);
