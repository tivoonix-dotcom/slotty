import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { loginWithTelegram } from './auth.service.js';

export const authRouter = Router();

const telegramBody = z.object({
  initDataRaw: z.string().min(1, 'initDataRaw is required'),
});

authRouter.post(
  '/telegram',
  asyncHandler(async (req, res) => {
    const body = telegramBody.parse(req.body);
    const out = await loginWithTelegram(body.initDataRaw);
    res.json(out);
  }),
);
