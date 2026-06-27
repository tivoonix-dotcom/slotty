import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  verifyBePaidWebhookBasicAuth,
  verifyBePaidWebhookSecret,
} from './bepaid.client.js';
import { isBePaidEnabled, isWebhookSecretConfigured } from './bepaid.config.js';
import { assertWebhookAuthorized } from './bepaidWebhookValidation.js';
import { sanitizePayloadForLog } from './paymentLogSanitizer.js';
import {
  createBePaidPayment,
  getPaymentById,
  getPaymentForUser,
  processBePaidWebhook,
} from './payments.service.js';

export const paymentsRouter = Router();

const createBody = z.object({
  type: z.enum(['MASTER_PRO_PLAN', 'APPOINTMENT_PREPAYMENT']),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  appointmentId: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
  billingPeriod: z.enum(['month', 'year']).optional(),
  returnUrl: z.string().url().optional(),
});

paymentsRouter.post(
  '/bepaid/create',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const body = createBody.parse(req.body);
    const user = req.user!;

    if (body.type === 'MASTER_PRO_PLAN') {
      if (user.role !== 'master' && user.role !== 'platform_admin') {
        throw ApiError.forbidden('Только мастер может оплатить тариф Pro', 'MASTER_ONLY');
      }
      const masterId = user.role === 'platform_admin' && req.body.masterId
        ? String(req.body.masterId)
        : user.id;
      const result = await createBePaidPayment({
        profileId: user.id,
        masterId,
        type: 'master_pro_plan',
        amountMinor: body.amount ? Math.round(body.amount * 100) : undefined,
        currency: body.currency,
        planId: body.planId,
        billingPeriod: body.billingPeriod,
        returnUrl: body.returnUrl,
        customerEmail: null,
      });
      res.status(201).json({
        paymentId: result.paymentId,
        provider: result.provider,
        status: result.status,
        checkout: result.checkout,
      });
      return;
    }

    const result = await createBePaidPayment({
      profileId: user.id,
      masterId: user.id,
      type: 'appointment_prepayment',
      amountMinor: body.amount ? Math.round(body.amount * 100) : undefined,
      currency: body.currency,
      appointmentId: body.appointmentId,
      planId: body.planId,
      billingPeriod: body.billingPeriod,
      returnUrl: body.returnUrl,
    });
    res.status(201).json({
      paymentId: result.paymentId,
      provider: result.provider,
      status: result.status,
      checkout: result.checkout,
    });
  }),
);

paymentsRouter.post(
  '/bepaid/webhook',
  asyncHandler(async (req, res) => {
    const authOk = verifyBePaidWebhookBasicAuth(req.headers.authorization);
    const secretOk = verifyBePaidWebhookSecret(
      typeof req.headers['x-webhook-secret'] === 'string'
        ? req.headers['x-webhook-secret']
        : undefined,
    );

    const authCheck = assertWebhookAuthorized({
      basicAuthOk: authOk,
      secretHeaderOk: secretOk,
      webhookSecretConfigured: isWebhookSecretConfigured(),
      bePaidEnabled: isBePaidEnabled(),
      isProduction: env.NODE_ENV === 'production' || env.BEPAID_ENV === 'production',
    });
    if (!authCheck.ok) {
      console.warn('[bepaid] webhook auth rejected', { code: authCheck.code });
      throw ApiError.unauthorized(authCheck.message, authCheck.code);
    }

    const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
    console.info('[bepaid] webhook received', sanitizePayloadForLog(body));

    const result = await processBePaidWebhook(body);
    res.status(result.rejected ? 422 : 200).json({
      ok: result.ok,
      paymentId: result.paymentId ?? null,
      rejected: result.rejected ?? false,
      rejectCode: result.rejectCode ?? null,
    });
  }),
);

paymentsRouter.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const user = req.user!;
    const payment =
      user.role === 'platform_admin'
        ? await getPaymentById(id)
        : await getPaymentForUser(id, user.id);
    if (!payment) {
      throw ApiError.notFound('Платёж не найден', 'PAYMENT_NOT_FOUND');
    }
    res.json({ payment });
  }),
);
