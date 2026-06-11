import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createMyService, listMyServices, patchMyService, softDeleteMyService } from './services.service.js';

const MAX_PRICE_AMOUNT = 10_000_000;

const trimmedNonEmpty = (max: number, message: string) =>
  z
    .string()
    .max(max)
    .transform((s) => s.trim())
    .refine((s) => s.length >= 1, { message });

const trimmedNonEmptyOptional = (max: number, message: string) =>
  z
    .string()
    .max(max)
    .transform((s) => s.trim())
    .refine((s) => s.length >= 1, { message })
    .optional();

const optionalTrimmedDescription = z
  .string()
  .max(20_000)
  .transform((s) => s.trim())
  .optional();

const priceAmount = z.coerce.number().finite().min(0).max(MAX_PRICE_AMOUNT);
const priceAmountOptional = z.coerce.number().finite().min(0).max(MAX_PRICE_AMOUNT).optional();

export const masterServicesRouter = Router();

masterServicesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const masterId = req.user!.id;
    const list = await listMyServices(masterId);
    res.json({ services: list });
  }),
);

const focalCoord = z.coerce.number().int().min(0).max(100).optional();

const createBody = z.object({
  categoryId: z.string().uuid(),
  title: trimmedNonEmpty(300, 'Название не может быть пустым'),
  description: optionalTrimmedDescription,
  durationMinutes: z.coerce.number().int().finite().min(1).max(24 * 60),
  priceAmount,
  priceType: z.enum(['fixed', 'from']).optional(),
  sortOrder: z.coerce.number().int().finite().optional(),
  coverImageUrl: z.string().url().max(2048),
  coverFocalX: focalCoord,
  coverFocalY: focalCoord,
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
      coverImageUrl: body.coverImageUrl,
      coverFocalX: body.coverFocalX,
      coverFocalY: body.coverFocalY,
    });
    res.status(201).json(created);
  }),
);

const patchBody = z.object({
  categoryId: z.string().uuid().optional(),
  title: trimmedNonEmptyOptional(300, 'Название не может быть пустым'),
  description: optionalTrimmedDescription,
  durationMinutes: z.coerce.number().int().finite().min(1).max(24 * 60).optional(),
  priceAmount: priceAmountOptional,
  priceType: z.enum(['fixed', 'from']).optional(),
  sortOrder: z.coerce.number().int().finite().optional(),
  isActive: z.boolean().optional(),
  coverImageUrl: z.string().url().max(2048).nullable().optional(),
  coverFocalX: focalCoord,
  coverFocalY: focalCoord,
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
      coverImageUrl: body.coverImageUrl,
      coverFocalX: body.coverFocalX,
      coverFocalY: body.coverFocalY,
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
