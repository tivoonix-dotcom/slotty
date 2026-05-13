import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listSubscriptionPlans } from './billing.service.js';

export const billingRouter = Router();

billingRouter.get(
  '/plans',
  asyncHandler(async (_req, res) => {
    const plans = await listSubscriptionPlans();
    res.json({ plans });
  }),
);
