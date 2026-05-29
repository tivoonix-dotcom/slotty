import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireClientBookingCreate, requireMasterPlatformWrite } from '../../middlewares/profileAccountAccess.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  cancelClientAppointment,
  createAppointmentTx,
  getMasterAppointmentStats,
  listClientAppointments,
  listMasterAppointments,
  MASTER_APPOINTMENTS_LIST_MAX,
  masterCancelAppointment,
  masterCompleteAppointment,
  masterConfirmAppointment,
} from './appointments.service.js';
import { uploadBookingReferencePhoto } from './appointments.storage.js';
import { notifyAppointmentCreated, notifyMasterClientCancelledBooking } from './appointments.telegram.js';
import { bookingCreateLimiter } from '../../middlewares/rateLimit.js';
import { requireSignupConsents } from '../../middlewares/requireSignupConsents.js';

export const appointmentCreateRouter = Router();
appointmentCreateRouter.use(authMiddleware);

const bookBody = z.object({
  slotId: z.string().uuid(),
  serviceId: z.string().uuid(),
  clientNote: z.string().max(2000).optional(),
  clientReferencePhotoUrl: z.string().url().max(2048).optional(),
});

appointmentCreateRouter.post('/', bookingCreateLimiter, requireClientBookingCreate, requireSignupConsents, asyncHandler(async (req, res) => {
    const body = bookBody.parse(req.body);
    const out = await createAppointmentTx({
      clientId: req.user!.id,
      slotId: body.slotId,
      serviceId: body.serviceId,
      clientNote: body.clientNote,
      clientReferencePhotoUrl: body.clientReferencePhotoUrl,
    });
    void notifyAppointmentCreated({
      appointmentId: out.appointmentId,
      clientId: out.clientId,
      masterId: out.masterId,
      serviceTitle: out.serviceTitle,
      startsAt: out.startsAt,
      voucherNumber: out.voucherNumber,
      clientDisplayName: out.clientDisplayName,
      masterDisplayName: out.masterDisplayName,
    });
    res.status(201).json(out);
  }),
);

export const clientAppointmentsRouter = Router();
clientAppointmentsRouter.use(authMiddleware);

const clientUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

clientAppointmentsRouter.post(
  '/reference-photo',
  clientUpload.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file?.buffer?.length) {
      throw ApiError.badRequest('Missing image file (multipart field: file)', 'MISSING_FILE');
    }
    const publicUrl = await uploadBookingReferencePhoto(req.user!.id, file.buffer, file.mimetype);
    res.json({ url: publicUrl });
  }),
);

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(MASTER_APPOINTMENTS_LIST_MAX).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const masterListQuery = listQuery.extend({
  tab: z.enum(['pending', 'upcoming', 'history', 'active', 'all']).optional(),
});

clientAppointmentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = listQuery.parse(req.query);
    const out = await listClientAppointments(req.user!.id, { limit: q.limit, offset: q.offset });
    res.json(out);
  }),
);

const cancelReasonBody = z.object({
  reason: z.string().max(2000).optional(),
});

clientAppointmentsRouter.patch(
  '/:appointmentId/cancel',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    const body = cancelReasonBody.parse(req.body ?? {});
    const { masterId } = await cancelClientAppointment(req.user!.id, appointmentId, body.reason);
    void notifyMasterClientCancelledBooking(masterId, appointmentId);
    res.status(204).send();
  }),
);

export const masterAppointmentsRouter = Router();
masterAppointmentsRouter.use(requireMasterPlatformWrite);

const masterCancelBody = z.object({
  reason: z.string().min(1).max(2000),
});

masterAppointmentsRouter.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const stats = await getMasterAppointmentStats(req.user!.id);
    res.json({ stats });
  }),
);

masterAppointmentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = masterListQuery.parse(req.query);
    const out = await listMasterAppointments(req.user!.id, {
      limit: q.limit,
      offset: q.offset,
      tab: q.tab,
    });
    res.json(out);
  }),
);

masterAppointmentsRouter.patch(
  '/:appointmentId/confirm',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    await masterConfirmAppointment(req.user!.id, appointmentId);
    res.status(204).send();
  }),
);

masterAppointmentsRouter.patch(
  '/:appointmentId/complete',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    await masterCompleteAppointment(req.user!.id, appointmentId);
    res.status(204).send();
  }),
);

masterAppointmentsRouter.patch(
  '/:appointmentId/cancel',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    const body = masterCancelBody.parse(req.body ?? {});
    await masterCancelAppointment(req.user!.id, appointmentId, body.reason);
    res.status(204).send();
  }),
);
