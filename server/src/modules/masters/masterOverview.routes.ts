import { Router } from 'express';
import { z } from 'zod';
import { requireMasterProPlan } from '../../middlewares/requireMasterProPlan.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getMasterOverviewBundle,
  getMasterOverviewClients,
  getMasterOverviewFreeBundle,
  getMasterOverviewReputation,
  getMasterOverviewRevenue,
  getMasterOverviewSummary,
  getMasterReviewNotificationDetail,
  postMasterReviewReply,
} from './masterOverview.service.js';

export const masterOverviewRouter = Router();

const periodQuery = z.object({
  period: z.enum(['today', 'week', 'month', 'all']).default('month'),
});

const replyBody = z.object({
  text: z.string().max(4000),
});

masterOverviewRouter.get(
  '/bundle',
  requireMasterProPlan,
  asyncHandler(async (req, res) => {
    const q = periodQuery.parse(req.query);
    const data = await getMasterOverviewBundle(req.user!.id, q.period);
    res.json(data);
  }),
);

masterOverviewRouter.get(
  '/summary',
  requireMasterProPlan,
  asyncHandler(async (req, res) => {
    const q = periodQuery.parse(req.query);
    const data = await getMasterOverviewSummary(req.user!.id, q.period);
    res.json(data);
  }),
);

masterOverviewRouter.get(
  '/revenue',
  requireMasterProPlan,
  asyncHandler(async (req, res) => {
    const q = periodQuery.parse(req.query);
    const data = await getMasterOverviewRevenue(req.user!.id, q.period);
    res.json(data);
  }),
);

masterOverviewRouter.get(
  '/free-bundle',
  asyncHandler(async (req, res) => {
    const q = periodQuery.parse(req.query);
    const data = await getMasterOverviewFreeBundle(req.user!.id, q.period);
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

masterOverviewRouter.get(
  '/reviews/:reviewId',
  asyncHandler(async (req, res) => {
    const reviewId = z.string().uuid().parse(req.params.reviewId);
    const detail = await getMasterReviewNotificationDetail(req.user!.id, reviewId);
    res.json({ review: detail });
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
