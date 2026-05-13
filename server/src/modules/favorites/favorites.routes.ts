import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { addFavorite, listFavorites, removeFavorite } from './favorites.service.js';

export const favoritesRouter = Router();
favoritesRouter.use(authMiddleware);

favoritesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await listFavorites(req.user!.id);
    res.json({ favorites: rows });
  }),
);

favoritesRouter.post(
  '/:masterId',
  asyncHandler(async (req, res) => {
    const masterId = z.string().uuid().parse(req.params.masterId);
    await addFavorite(req.user!.id, masterId);
    res.status(204).send();
  }),
);

favoritesRouter.delete(
  '/:masterId',
  asyncHandler(async (req, res) => {
    const masterId = z.string().uuid().parse(req.params.masterId);
    await removeFavorite(req.user!.id, masterId);
    res.status(204).send();
  }),
);
