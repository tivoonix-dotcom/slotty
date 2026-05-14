import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listActiveServiceCategories } from './catalog.service.js';
import { searchCatalogListings, suggestMasterLocations } from './catalogListings.service.js';
import type { CatalogListingsQuery } from './catalogSearch.types.js';

export const catalogRouter = Router();

catalogRouter.get(
  '/service-categories',
  asyncHandler(async (_req, res) => {
    const categories = await listActiveServiceCategories();
    res.json({ categories });
  }),
);

const listingsQuery = z.object({
  search: z.string().max(200).optional(),
  category: z.string().max(64).optional(),
  locationId: z.string().uuid().optional(),
  address: z.string().max(200).optional(),
  dateRange: z.enum(['any', 'today', 'tomorrow', 'week', 'weekend']).optional().default('any'),
  timeOfDay: z.enum(['any', 'morning', 'afternoon', 'evening']).optional().default('any'),
  minPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  maxPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minReviews: z.coerce.number().int().min(0).max(100_000).optional(),
  visitType: z.enum(['any', 'studio', 'at_home']).optional().default('any'),
  verifiedOnly: z
    .string()
    .optional()
    .transform((s) => s === 'true' || s === '1'),
  promotionOnly: z
    .string()
    .optional()
    .transform((s) => s === 'true' || s === '1'),
  duration: z.enum(['any', 'under30', '30_60', '60_120', 'over120']).optional().default('any'),
  sortBy: z
    .enum(['recommended', 'rating', 'price_asc', 'price_desc', 'reviews', 'soonest'])
    .optional()
    .default('recommended'),
  page: z.coerce.number().int().min(1).max(500).optional().default(1),
  limit: z.coerce.number().int().min(1).max(80).optional().default(24),
});

catalogRouter.get(
  '/listings',
  asyncHandler(async (req, res) => {
    const q = listingsQuery.parse(req.query);
    const body: CatalogListingsQuery = {
      search: q.search,
      categoryCode: q.category,
      locationId: q.locationId,
      addressText: q.address,
      dateRange: q.dateRange,
      timeOfDay: q.timeOfDay,
      minPrice: q.minPrice,
      maxPrice: q.maxPrice,
      minRating: q.minRating,
      minReviews: q.minReviews,
      visitType: q.visitType,
      verifiedOnly: q.verifiedOnly,
      promotionOnly: q.promotionOnly,
      durationPreset: q.duration,
      sortBy: q.sortBy,
      page: q.page,
      limit: q.limit,
    };
    const out = await searchCatalogListings(body);
    res.json(out);
  }),
);

catalogRouter.get(
  '/location-suggestions',
  asyncHandler(async (req, res) => {
    const q = z
      .object({
        query: z.string().max(160).optional().default(''),
        limit: z.coerce.number().int().min(1).max(30).optional().default(12),
      })
      .parse(req.query);
    const suggestions = await suggestMasterLocations(q.query, q.limit);
    res.json({ suggestions });
  }),
);
