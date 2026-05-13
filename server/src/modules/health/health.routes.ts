import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, service: 'slotty-backend' });
  }),
);
