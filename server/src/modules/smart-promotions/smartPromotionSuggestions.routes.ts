import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getSmartPromotionSuggestions } from './smartPromotionSuggestions.service.js';

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(14).optional(),
  discountPercent: z.coerce.number().int().min(1).max(90).optional(),
});

export const smartPromotionSuggestionsRouter = Router();

smartPromotionSuggestionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = querySchema.parse(req.query);
    const result = await getSmartPromotionSuggestions(req.user!.id, {
      horizonDays: q.days,
      discountPercent: q.discountPercent,
    });
    res.json(result);
  }),
);
