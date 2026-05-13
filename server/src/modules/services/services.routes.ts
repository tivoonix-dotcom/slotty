import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createMyService, listMyServices, patchMyService, softDeleteMyService } from './services.service.js';

export const masterServicesRouter = Router();

masterServicesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const masterId = req.user!.id;
    const list = await listMyServices(masterId);
    res.json({ services: list });
  }),
);

const createBody = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(1).max(300),
  description: z.string().max(20_000).optional(),
  durationMinutes: z.coerce.number().int().min(1).max(24 * 60),
  priceAmount: z.coerce.number().min(0),
  priceType: z.enum(['fixed', 'from']).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

masterServicesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createBody.parse(req.body);
    const created = await createMyService(req.user!.id, {
      categoryId: body.categoryId,
      title: body.title,
      description: body.description,
      durationMinutes: body.durationMinutes,
      priceAmount: body.priceAmount,
      priceType: body.priceType,
      sortOrder: body.sortOrder,
    });
    res.status(201).json(created);
  }),
);

const patchBody = z.object({
  categoryId: z.string().uuid().optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(20_000).optional(),
  durationMinutes: z.coerce.number().int().min(1).max(24 * 60).optional(),
  priceAmount: z.coerce.number().min(0).optional(),
  priceType: z.enum(['fixed', 'from']).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

masterServicesRouter.patch(
  '/:serviceId',
  asyncHandler(async (req, res) => {
    const serviceId = z.string().uuid().parse(req.params.serviceId);
    const body = patchBody.parse(req.body);
    const out = await patchMyService(req.user!.id, serviceId, {
      categoryId: body.categoryId,
      title: body.title,
      description: body.description,
      durationMinutes: body.durationMinutes,
      priceAmount: body.priceAmount,
      priceType: body.priceType,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
    });
    res.json(out);
  }),
);

masterServicesRouter.delete(
  '/:serviceId',
  asyncHandler(async (req, res) => {
    const serviceId = z.string().uuid().parse(req.params.serviceId);
    await softDeleteMyService(req.user!.id, serviceId);
    res.status(204).send();
  }),
);
