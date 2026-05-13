import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listActiveServiceCategories } from './catalog.service.js';

export const catalogRouter = Router();

catalogRouter.get(
  '/service-categories',
  asyncHandler(async (_req, res) => {
    const categories = await listActiveServiceCategories();
    res.json({ categories });
  }),
);
