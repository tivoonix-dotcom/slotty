import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireMasterDbAccess } from '../../middlewares/requireMasterAccess.js';
import {
  getMasterOverviewBundle,
  getMasterOverviewClients,
  getMasterOverviewReputation,
  getMasterOverviewRevenue,
  getMasterOverviewSummary,
  postMasterReviewReply,
} from './masterOverview.service.js';

export const masterOverviewRouter = Router();

masterOverviewRouter.use(authMiddleware, requireMasterDbAccess);

const periodQuery = z.object({
  period: z.enum(['today', 'week', 'month', 'all']).default('month'),
});

const replyBody = z.object({
  text: z.string().max(4000),
});

masterOverviewRouter.get(
  '/bundle',
  asyncHandler(async (req, res) => {
    const q = periodQuery.parse(req.query);
    const data = await getMasterOverviewBundle(req.user!.id, q.period);
    res.json(data);
  }),
);

masterOverviewRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const q = periodQuery.parse(req.query);
    const data = await getMasterOverviewSummary(req.user!.id, q.period);
    res.json(data);
  }),
);

masterOverviewRouter.get(
  '/revenue',
  asyncHandler(async (req, res) => {
    const q = periodQuery.parse(req.query);
    const data = await getMasterOverviewRevenue(req.user!.id, q.period);
    res.json(data);
  }),
);

masterOverviewRouter.get(
  '/clients',
  asyncHandler(async (req, res) => {
    const q = periodQuery.parse(req.query);
    const data = await getMasterOverviewClients(req.user!.id, q.period);
    res.json(data);
  }),
);

masterOverviewRouter.get(
  '/reputation',
  asyncHandler(async (req, res) => {
    const q = periodQuery.parse(req.query);
    const data = await getMasterOverviewReputation(req.user!.id, q.period);
    res.json(data);
  }),
);

masterOverviewRouter.post(
  '/reviews/:reviewId/reply',
  asyncHandler(async (req, res) => {
    const reviewId = z.string().uuid().parse(req.params.reviewId);
    const body = replyBody.parse(req.body);
    await postMasterReviewReply(req.user!.id, reviewId, body.text);
    res.status(204).send();
  }),
);
