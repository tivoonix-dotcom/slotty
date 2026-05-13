import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createMySlot, deleteMySlot, listMySlots, listPublicSlots, patchMySlot } from './slots.service.js';

export const slotsPublicRouter = Router();

const publicQuery = z.object({
  masterId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  category: z.string().min(1).max(80).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

slotsPublicRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = publicQuery.parse(req.query);
    const rows = await listPublicSlots({
      masterId: q.masterId,
      serviceId: q.serviceId,
      category: q.category,
      from: q.from,
      to: q.to,
      limit: q.limit,
    });
    res.json({ slots: rows });
  }),
);

export const masterSlotsRouter = Router();

masterSlotsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await listMySlots(req.user!.id);
    res.json({ slots: rows });
  }),
);

const createSlotBody = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  serviceId: z.string().uuid().nullable().optional(),
});

masterSlotsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createSlotBody.parse(req.body);
    const row = await createMySlot(req.user!.id, {
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      serviceId: body.serviceId,
    });
    res.status(201).json(row);
  }),
);

const patchSlotBody = z.object({
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  serviceId: z.string().uuid().nullable().optional(),
});

masterSlotsRouter.patch(
  '/:slotId',
  asyncHandler(async (req, res) => {
    const slotId = z.string().uuid().parse(req.params.slotId);
    const body = patchSlotBody.parse(req.body);
    const row = await patchMySlot(req.user!.id, slotId, {
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      serviceId: body.serviceId,
    });
    res.json(row);
  }),
);

masterSlotsRouter.delete(
  '/:slotId',
  asyncHandler(async (req, res) => {
    const slotId = z.string().uuid().parse(req.params.slotId);
    await deleteMySlot(req.user!.id, slotId);
    res.status(204).send();
  }),
);
