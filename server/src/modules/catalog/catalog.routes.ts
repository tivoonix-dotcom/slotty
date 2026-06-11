import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listActiveServiceCategories } from './catalog.service.js';
import {
  recordCatalogSearchQuery,
  recordCatalogListingView,
  searchCatalogListings,
  suggestCatalogSearch,
  suggestMasterLocations,
} from './catalogListings.service.js';
import type { CatalogListingsQuery } from './catalogSearch.types.js';
import { publicCatalogRateLimit } from '../../middlewares/rateLimit.js';

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
    .enum([
      'recommended',
      'popular',
      'rating',
      'price_asc',
      'price_desc',
      'reviews',
      'soonest',
      'distance_asc',
    ])
    .optional()
    .default('recommended'),
  onlyWithSlots: z
    .string()
    .optional()
    .transform((s) => s === 'true' || s === '1'),
  popularOnly: z
    .string()
    .optional()
    .transform((s) => s === 'true' || s === '1'),
  newOnly: z
    .string()
    .optional()
    .transform((s) => s === 'true' || s === '1'),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  slotDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  timeFrom: z.coerce.number().int().min(0).max(23).optional(),
  timeTo: z.coerce.number().int().min(1).max(24).optional(),
  page: z.coerce.number().int().min(1).max(500).optional().default(1),
  limit: z.coerce.number().int().min(1).max(80).optional().default(24),
});

catalogRouter.get(
  '/listings',
  publicCatalogRateLimit,
  asyncHandler(async (req, res) => {
    const q = listingsQuery.parse(req.query);
    const body: CatalogListingsQuery = {
      search: q.search,
      categoryCode: q.category,
      locationId: q.locationId,
      addressText: q.address,
      dateRange: q.dateRange,
      timeOfDay: q.timeOfDay,
      slotDate: q.slotDate,
      timeFromHour: q.timeFrom,
      timeToHour: q.timeTo,
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
      onlyWithSlots: q.onlyWithSlots,
      popularOnly: q.popularOnly,
      newOnly: q.newOnly,
      userLat: q.lat,
      userLng: q.lng,
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

catalogRouter.get(
  '/search-suggestions',
  publicCatalogRateLimit,
  asyncHandler(async (req, res) => {
    const q = z
      .object({
        query: z.string().max(160).optional().default(''),
        limit: z.coerce.number().int().min(1).max(20).optional().default(12),
      })
      .parse(req.query);
    const out = await suggestCatalogSearch(q.query, q.limit);
    res.json(out);
  }),
);

catalogRouter.post(
  '/listings/view',
  publicCatalogRateLimit,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        masterId: z.string().uuid(),
        serviceId: z.string().uuid().optional().nullable(),
      })
      .parse(req.body);
    await recordCatalogListingView(body.masterId, body.serviceId);
    res.status(204).end();
  }),
);

catalogRouter.post(
  '/search-log',
  publicCatalogRateLimit,
  asyncHandler(async (req, res) => {
    const body = z.object({ query: z.string().max(160) }).parse(req.body);
    await recordCatalogSearchQuery(body.query);
    res.status(204).end();
  }),
);
