import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createMyBundle,
  createMyPromotion,
  deleteMyBundle,
  deleteMyPromotion,
  listMyBundles,
  listMyPromotions,
  patchMyBundle,
  patchMyPromotion,
} from './serviceExtras.service.js';

const bundleStatus = z.enum(['visible', 'hidden', 'draft']);
const promoStatus = z.enum(['active', 'scheduled', 'finished', 'draft']);
const discountType = z.enum(['percent', 'money', 'gift']);

const bundleBody = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().max(20_000).optional(),
  serviceIds: z.array(z.string().uuid()),
  originalPrice: z.coerce.number().finite().min(0),
  bundlePrice: z.coerce.number().finite().min(0),
  discountPercent: z.coerce.number().int().min(0).max(100),
  discountAmount: z.coerce.number().finite().min(0),
  durationMinutes: z.coerce.number().int().min(0).max(24 * 60),
  imageUrl: z.string().max(2000).optional().nullable(),
  imageSource: z.string().max(40).optional(),
  status: bundleStatus,
});

const bundlePatch = bundleBody.partial();

const promoBodyBase = z.object({
  template: z.string().min(1).max(40),
  title: z.string().trim().min(1).max(300),
  description: z.string().max(20_000).optional(),
  serviceId: z.string().uuid(),
  discountType,
  discountValue: z.coerce.number().finite().min(0),
  discountLabel: z.string().max(120),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: promoStatus.optional(),
  backgroundImage: z.string().max(2000).optional(),
  publish: z.boolean().optional(),
  slotIds: z.array(z.string().uuid()).max(48).optional(),
});

function refinePromotionSlotIds(
  body: { template: string; slotIds?: string[] },
  ctx: z.RefinementCtx,
): void {
  const slotCount = body.slotIds?.length ?? 0;
  if (body.template === 'free_slots' && slotCount === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'slotIds required for free_slots promotions',
      path: ['slotIds'],
    });
  }
  if (body.template !== 'free_slots' && slotCount > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'slotIds only allowed for free_slots template',
      path: ['slotIds'],
    });
  }
}

const promoBody = promoBodyBase.superRefine(refinePromotionSlotIds);

const promoPatch = promoBodyBase.partial();

export const masterBundlesRouter = Router();

masterBundlesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const list = await listMyBundles(req.user!.id);
    res.json({ bundles: list });
  }),
);

masterBundlesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = bundleBody.parse(req.body);
    const created = await createMyBundle(req.user!.id, {
      title: body.title,
      description: body.description,
      serviceIds: body.serviceIds,
      originalPrice: body.originalPrice,
      bundlePrice: body.bundlePrice,
      discountPercent: body.discountPercent,
      discountAmount: body.discountAmount,
      durationMinutes: body.durationMinutes,
      imageUrl: body.imageUrl ?? undefined,
      imageSource: body.imageSource,
      status: body.status,
    });
    res.status(201).json(created);
  }),
);

masterBundlesRouter.patch(
  '/:bundleId',
  asyncHandler(async (req, res) => {
    const bundleId = z.string().uuid().parse(req.params.bundleId);
    const body = bundlePatch.parse(req.body);
    const out = await patchMyBundle(req.user!.id, bundleId, {
      title: body.title,
      description: body.description,
      serviceIds: body.serviceIds,
      originalPrice: body.originalPrice,
      bundlePrice: body.bundlePrice,
      discountPercent: body.discountPercent,
      discountAmount: body.discountAmount,
      durationMinutes: body.durationMinutes,
      imageUrl: body.imageUrl,
      imageSource: body.imageSource,
      status: body.status,
    });
    res.json(out);
  }),
);

masterBundlesRouter.delete(
  '/:bundleId',
  asyncHandler(async (req, res) => {
    const bundleId = z.string().uuid().parse(req.params.bundleId);
    await deleteMyBundle(req.user!.id, bundleId);
    res.status(204).send();
  }),
);

export const masterPromotionsRouter = Router();

masterPromotionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const list = await listMyPromotions(req.user!.id);
    res.json({ promotions: list });
  }),
);

masterPromotionsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = promoBody.parse(req.body);
    const created = await createMyPromotion(req.user!.id, {
      template: body.template,
      title: body.title,
      description: body.description,
      serviceId: body.serviceId,
      discountType: body.discountType,
      discountValue: body.discountValue,
      discountLabel: body.discountLabel,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      status: body.status,
      backgroundImage: body.backgroundImage,
      publish: body.publish,
      slotIds: body.slotIds,
    });
    res.status(201).json(created);
  }),
);

masterPromotionsRouter.patch(
  '/:promotionId',
  asyncHandler(async (req, res) => {
    const promotionId = z.string().uuid().parse(req.params.promotionId);
    const body = promoPatch.parse(req.body);
    const out = await patchMyPromotion(req.user!.id, promotionId, {
      template: body.template,
      title: body.title,
      description: body.description,
      serviceId: body.serviceId,
      discountType: body.discountType,
      discountValue: body.discountValue,
      discountLabel: body.discountLabel,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      status: body.status,
      backgroundImage: body.backgroundImage,
      publish: body.publish,
    });
    res.json(out);
  }),
);

masterPromotionsRouter.delete(
  '/:promotionId',
  asyncHandler(async (req, res) => {
    const promotionId = z.string().uuid().parse(req.params.promotionId);
    await deleteMyPromotion(req.user!.id, promotionId);
    res.status(204).send();
  }),
);
