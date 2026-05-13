import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { listNotifications, markNotificationRead } from './notifications.service.js';

export const notificationsRouter = Router();
notificationsRouter.use(authMiddleware);

notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await listNotifications(req.user!.id);
    res.json({ notifications: rows });
  }),
);

notificationsRouter.patch(
  '/:notificationId/read',
  asyncHandler(async (req, res) => {
    const notificationId = z.string().uuid().parse(req.params.notificationId);
    await markNotificationRead(req.user!.id, notificationId);
    res.status(204).send();
  }),
);
