import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireMasterDbAccess } from '../../middlewares/requireMasterAccess.js';
import { requireMasterPlatformWrite } from '../../middlewares/profileAccountAccess.js';
import { listSubscriptionPlans } from './billing.service.js';
import {
  cancelSubscriptionAtPeriodEnd,
  createBillingCheckout,
  createManualTopupCheckout,
  createUpdatePaymentMethodCheckout,
  deletePaymentMethod,
  getBillingSubscription,
  listBillingPayments,
  resumeSubscriptionAutoRenew,
  retryFailedSubscriptionPayment,
} from './subscriptionBilling.service.js';

export const billingRouter = Router();

billingRouter.get(
  '/plans',
  asyncHandler(async (_req, res) => {
    const plans = await listSubscriptionPlans();
    res.json({ plans });
  }),
);

const billingMaster = [
  authMiddleware,
  requireMasterDbAccess,
  requireMasterPlatformWrite,
] as const;

billingRouter.get(
  '/subscription',
  ...billingMaster,
  asyncHandler(async (req, res) => {
    const billing = await getBillingSubscription(req.user!.id);
    res.json({ billing });
  }),
);

billingRouter.get(
  '/payments',
  ...billingMaster,
  asyncHandler(async (req, res) => {
    const limit = z.coerce.number().int().min(1).max(50).optional().parse(req.query.limit);
    const payments = await listBillingPayments(req.user!.id, { limit });
    res.json({ payments });
  }),
);

const packageMonthsSchema = z.union([z.literal(1), z.literal(3), z.literal(12)]);

function resolveCheckoutPackageMonths(body: {
  billingPackageMonths?: 1 | 3 | 12;
  billingPeriod?: 'month' | 'year';
}): 1 | 3 | 12 {
  if (body.billingPackageMonths != null) return body.billingPackageMonths;
  if (body.billingPeriod === 'year') return 12;
  return 1;
}

const checkoutBody = z
  .object({
    plan: z.literal('MASTER_PRO'),
    billingPackageMonths: packageMonthsSchema.optional(),
    billingPeriod: z.enum(['month', 'year']).optional(),
    returnUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
    consentAccepted: z.literal(true),
  })
  .refine((b) => b.billingPackageMonths != null || b.billingPeriod != null, {
    message: 'Укажите billingPackageMonths или billingPeriod',
  });

billingRouter.post(
  '/checkout',
  ...billingMaster,
  asyncHandler(async (req, res) => {
    const body = checkoutBody.parse(req.body);
    const result = await createBillingCheckout({
      masterId: req.user!.id,
      profileId: req.user!.id,
      billingPackageMonths: resolveCheckoutPackageMonths(body),
      returnUrl: body.returnUrl,
      consentAccepted: body.consentAccepted,
    });
    res.status(201).json({
      paymentUrl: result.paymentUrl,
      paymentId: result.paymentId,
    });
  }),
);

const topupBody = z.object({
  billingPackageMonths: packageMonthsSchema,
  returnUrl: z.string().url().optional(),
});

billingRouter.post(
  '/topup',
  ...billingMaster,
  asyncHandler(async (req, res) => {
    const body = topupBody.parse(req.body);
    const result = await createManualTopupCheckout({
      masterId: req.user!.id,
      profileId: req.user!.id,
      billingPackageMonths: body.billingPackageMonths,
      returnUrl: body.returnUrl,
    });
    res.status(201).json(result);
  }),
);

billingRouter.delete(
  '/payment-method',
  ...billingMaster,
  asyncHandler(async (req, res) => {
    const billing = await deletePaymentMethod(req.user!.id);
    res.json({ billing });
  }),
);

const cancelBody = z.object({
  reason: z.string().max(500).optional(),
});

billingRouter.post(
  '/cancel-subscription',
  ...billingMaster,
  asyncHandler(async (req, res) => {
    const body = cancelBody.parse(req.body ?? {});
    const billing = await cancelSubscriptionAtPeriodEnd(req.user!.id, body.reason);
    res.json({ billing });
  }),
);

billingRouter.post(
  '/resume-subscription',
  ...billingMaster,
  asyncHandler(async (req, res) => {
    const billing = await resumeSubscriptionAutoRenew(req.user!.id);
    res.json({ billing });
  }),
);

const paymentMethodBody = z.object({
  returnUrl: z.string().url().optional(),
});

billingRouter.post(
  '/update-payment-method',
  ...billingMaster,
  asyncHandler(async (req, res) => {
    const body = paymentMethodBody.parse(req.body ?? {});
    const result = await createUpdatePaymentMethodCheckout({
      masterId: req.user!.id,
      profileId: req.user!.id,
      returnUrl: body.returnUrl,
    });
    res.status(201).json(result);
  }),
);

billingRouter.post(
  '/retry-payment',
  ...billingMaster,
  asyncHandler(async (req, res) => {
    const body = paymentMethodBody.parse(req.body ?? {});
    const result = await retryFailedSubscriptionPayment({
      masterId: req.user!.id,
      profileId: req.user!.id,
      returnUrl: body.returnUrl,
    });
    res.status(201).json(result);
  }),
);
