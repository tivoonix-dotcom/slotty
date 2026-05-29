import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { requestIdMiddleware } from './middlewares/requestId.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { profilesRouter } from './modules/profiles/profiles.routes.js';
import { mastersRouter } from './modules/masters/masters.routes.js';
import { slotsPublicRouter } from './modules/slots/slots.routes.js';
import { appointmentCreateRouter, clientAppointmentsRouter } from './modules/appointments/appointments.routes.js';
import { favoritesRouter } from './modules/favorites/favorites.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { billingRouter } from './modules/billing/billing.routes.js';
import { reviewsRouter } from './modules/reviews/reviews.routes.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { telegramWebhookRouter } from './modules/telegram/telegram.webhook.routes.js';
import { publicRouter } from './modules/public/public.routes.js';
import { geoRouter } from './modules/geo/geo.routes.js';
import { legalRouter } from './modules/legal/legal.routes.js';
import { platformAdminRouter } from './modules/platform-admin/platformAdmin.routes.js';
import { resolveTrustProxySetting } from './lib/clientIp.js';

export function createApp() {
  const app = express();
  const trustProxy = resolveTrustProxySetting();
  app.set('trust proxy', trustProxy);
  app.use(requestIdMiddleware);
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '1mb' }));

  const api = express.Router();
  api.use('/health', healthRouter);
  api.use('/geo', geoRouter);
  api.use('/legal', legalRouter);
  api.use('/public', publicRouter);
  api.use('/auth', authRouter);
  api.use('/me', profilesRouter);
  api.use('/me/appointments', clientAppointmentsRouter);
  api.use('/me/favorites', favoritesRouter);
  api.use('/me/notifications', notificationsRouter);
  api.use('/reviews', reviewsRouter);
  api.use('/appointments', appointmentCreateRouter);
  api.use('/catalog', catalogRouter);
  api.use('/masters', mastersRouter);
  api.use('/slots', slotsPublicRouter);
  api.use('/billing', billingRouter);
  api.use('/platform-admin', platformAdminRouter);
  api.use('/telegram/webhook', telegramWebhookRouter);

  app.use('/api', api);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
