import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
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

export function createApp() {
  const app = express();
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  const api = express.Router();
  api.use('/health', healthRouter);
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
  api.use('/telegram/webhook', telegramWebhookRouter);

  app.use('/api', api);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
