import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { createReviewForCompletedAppointment } from './reviews.service.js';

export const reviewsRouter = Router();
reviewsRouter.use(authMiddleware);

reviewsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        appointmentId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        body: z.string().min(10).max(1000),
      })
      .parse(req.body);
    const created = await createReviewForCompletedAppointment(req.user!.id, body);
    res.status(201).json({ review: created });
  }),
);
