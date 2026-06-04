import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireMasterDbAccess } from '../../middlewares/requireMasterAccess.js';
import { requireMasterPlatformWrite } from '../../middlewares/profileAccountAccess.js';
import {
  getMasterNotificationPreferences,
  upsertMasterNotificationPreferences,
} from './masterNotificationPreferences.service.js';

export const masterNotificationPreferencesRouter = Router();

const masterAuth = [
  authMiddleware,
  requireMasterDbAccess,
  requireMasterPlatformWrite,
] as const;

const prefsBody = z.object({
  channels: z
    .object({
      telegram: z.boolean(),
      email: z.boolean(),
      in_app: z.boolean(),
    })
    .optional(),
  events: z.record(
    z.string(),
    z.object({
      telegram: z.boolean(),
      email: z.boolean(),
      inApp: z.boolean().optional(),
      in_app: z.boolean().optional(),
    }),
  ).optional(),
});

masterNotificationPreferencesRouter.get(
  '/',
  ...masterAuth,
  asyncHandler(async (req, res) => {
    const preferences = await getMasterNotificationPreferences(req.user!.id);
    res.json({ preferences });
  }),
);

masterNotificationPreferencesRouter.put(
  '/',
  ...masterAuth,
  asyncHandler(async (req, res) => {
    const body = prefsBody.parse(req.body);
    const preferences = await upsertMasterNotificationPreferences(req.user!.id, body);
    res.json({ preferences });
  }),
);
