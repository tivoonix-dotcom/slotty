import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import {
  addFavorite,
  isFavorite,
  listFavoriteMasterIds,
  listFavorites,
  removeFavorite,
  syncFavorites,
} from './favorites.service.js';

const masterIdParam = z.string().uuid();

const syncBodySchema = z.object({
  masterIds: z.array(z.string().uuid()).max(200),
});

export const favoritesRouter = Router();
favoritesRouter.use(authMiddleware);

favoritesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await listFavorites(req.user!.id);
    res.json({ favorites: rows });
  }),
);

favoritesRouter.get(
  '/ids',
  asyncHandler(async (req, res) => {
    const masterIds = await listFavoriteMasterIds(req.user!.id);
    res.json({ masterIds });
  }),
);

favoritesRouter.put(
  '/sync',
  asyncHandler(async (req, res) => {
    const { masterIds } = syncBodySchema.parse(req.body ?? {});
    const result = await syncFavorites(req.user!.id, masterIds);
    res.json(result);
  }),
);

favoritesRouter.get(
  '/:masterId/status',
  asyncHandler(async (req, res) => {
    const masterId = masterIdParam.parse(req.params.masterId);
    const favored = await isFavorite(req.user!.id, masterId);
    res.json({ favored });
  }),
);

favoritesRouter.post(
  '/:masterId',
  asyncHandler(async (req, res) => {
    const masterId = masterIdParam.parse(req.params.masterId);
    await addFavorite(req.user!.id, masterId);
    res.status(204).send();
  }),
);

favoritesRouter.delete(
  '/:masterId',
  asyncHandler(async (req, res) => {
    const masterId = masterIdParam.parse(req.params.masterId);
    await removeFavorite(req.user!.id, masterId);
    res.status(204).send();
  }),
);
