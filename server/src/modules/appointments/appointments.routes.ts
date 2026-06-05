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
  getClientAppointmentByVoucher,
  getMasterAppointmentById,
  getMasterAppointmentByVoucher,
  getMasterAppointmentStats,
  listClientAppointments,
  listMasterAppointments,
  MASTER_APPOINTMENTS_LIST_MAX,
  masterCancelAppointment,
  masterClientArrivedAppointment,
  masterConfirmAppointment,
  masterCloseOverdueAppointment,
  masterReportNoShowAppointment,
  masterNoShowAppointment,
  masterStartAppointment,
  masterMarkCompletedAppointment,
  clientConfirmCompletedAppointment,
  createClientBookingDispute,
  createMasterBookingDispute,
  clientBookingSignal,
  addClientBookingComment,
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
      clientPhone: out.clientPhone,
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

const voucherParam = z
  .string()
  .min(1)
  .transform((v) => v.trim().toUpperCase())
  .refine((v) => /^SL-[A-Z0-9]{12}$/.test(v), 'Invalid booking code');

clientAppointmentsRouter.get(
  '/voucher/:voucherNumber',
  asyncHandler(async (req, res) => {
    const voucherNumber = voucherParam.parse(req.params.voucherNumber);
    const appointment = await getClientAppointmentByVoucher(req.user!.id, voucherNumber);
    res.json({ appointment });
  }),
);

const cancelReasonBody = z.object({
  reason: z.string().max(2000).optional(),
  reasonCategory: z.string().max(64).optional(),
  comment: z.string().max(2000).optional(),
});

clientAppointmentsRouter.patch(
  '/:appointmentId/cancel',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    const body = cancelReasonBody.parse(req.body ?? {});
    const reasonText = [body.reason, body.comment].filter(Boolean).join(' — ') || body.reason;
    const { masterId } = await cancelClientAppointment(
      req.user!.id,
      appointmentId,
      reasonText,
      body.reasonCategory,
    );
    void notifyMasterClientCancelledBooking(masterId, appointmentId);
    res.status(204).send();
  }),
);

clientAppointmentsRouter.patch(
  '/voucher/:voucherNumber/cancel',
  asyncHandler(async (req, res) => {
    const voucherNumber = voucherParam.parse(req.params.voucherNumber);
    const { requireAppointmentForClientByVoucher } = await import('./appointments.access.js');
    const row = await requireAppointmentForClientByVoucher(req.user!.id, voucherNumber);
    const body = cancelReasonBody.parse(req.body ?? {});
    const reasonText = [body.reason, body.comment].filter(Boolean).join(' — ') || body.reason;
    const { masterId } = await cancelClientAppointment(
      req.user!.id,
      row.id,
      reasonText,
      body.reasonCategory,
    );
    void notifyMasterClientCancelledBooking(masterId, row.id);
    res.status(204).send();
  }),
);

const clientDisputeBody = z.object({
  reason: z.string().min(1).max(64),
  comment: z.string().min(10).max(2000),
});

const masterDisputeBody = z.object({
  reason: z.string().min(1).max(64),
  comment: z.string().max(2000).optional(),
});

const masterClientReportBody = z.object({
  reasonCode: z.enum(['client_misconduct', 'client_not_paid', 'client_harassment', 'client_fake_info', 'other']),
  reasonText: z.string().max(2000).optional().nullable(),
});

const signalBody = z.object({
  comment: z.string().max(500).optional(),
  lateMinutes: z.coerce.number().int().min(1).max(240).optional(),
});

const commentBody = z.object({
  message: z.string().min(1).max(2000),
});

clientAppointmentsRouter.post(
  '/voucher/:voucherNumber/confirm-completed',
  asyncHandler(async (req, res) => {
    const voucherNumber = voucherParam.parse(req.params.voucherNumber);
    const { requireAppointmentForClientByVoucher } = await import('./appointments.access.js');
    const row = await requireAppointmentForClientByVoucher(req.user!.id, voucherNumber);
    await clientConfirmCompletedAppointment(req.user!.id, row.id);
    res.status(204).send();
  }),
);

clientAppointmentsRouter.post(
  '/voucher/:voucherNumber/dispute',
  asyncHandler(async (req, res) => {
    const voucherNumber = voucherParam.parse(req.params.voucherNumber);
    const { requireAppointmentForClientByVoucher } = await import('./appointments.access.js');
    const row = await requireAppointmentForClientByVoucher(req.user!.id, voucherNumber);
    const body = clientDisputeBody.parse(req.body ?? {});
    const out = await createClientBookingDispute(req.user!.id, row.id, body);
    res.status(201).json(out);
  }),
);

clientAppointmentsRouter.post(
  '/voucher/:voucherNumber/on-the-way',
  asyncHandler(async (req, res) => {
    const voucherNumber = voucherParam.parse(req.params.voucherNumber);
    const { requireAppointmentForClientByVoucher } = await import('./appointments.access.js');
    const row = await requireAppointmentForClientByVoucher(req.user!.id, voucherNumber);
    const body = signalBody.parse(req.body ?? {});
    await clientBookingSignal(req.user!.id, row.id, 'on_the_way', { comment: body.comment });
    res.status(204).send();
  }),
);

clientAppointmentsRouter.post(
  '/voucher/:voucherNumber/running-late',
  asyncHandler(async (req, res) => {
    const voucherNumber = voucherParam.parse(req.params.voucherNumber);
    const { requireAppointmentForClientByVoucher } = await import('./appointments.access.js');
    const row = await requireAppointmentForClientByVoucher(req.user!.id, voucherNumber);
    const body = signalBody.parse(req.body ?? {});
    await clientBookingSignal(req.user!.id, row.id, 'running_late', {
      comment: body.comment,
      lateMinutes: body.lateMinutes,
    });
    res.status(204).send();
  }),
);

clientAppointmentsRouter.post(
  '/voucher/:voucherNumber/reported-arrived',
  asyncHandler(async (req, res) => {
    const voucherNumber = voucherParam.parse(req.params.voucherNumber);
    const { requireAppointmentForClientByVoucher } = await import('./appointments.access.js');
    const row = await requireAppointmentForClientByVoucher(req.user!.id, voucherNumber);
    const body = signalBody.parse(req.body ?? {});
    await clientBookingSignal(req.user!.id, row.id, 'reported_arrived', { comment: body.comment });
    res.status(204).send();
  }),
);

clientAppointmentsRouter.post(
  '/voucher/:voucherNumber/comment',
  asyncHandler(async (req, res) => {
    const voucherNumber = voucherParam.parse(req.params.voucherNumber);
    const { requireAppointmentForClientByVoucher } = await import('./appointments.access.js');
    const row = await requireAppointmentForClientByVoucher(req.user!.id, voucherNumber);
    const body = commentBody.parse(req.body ?? {});
    await addClientBookingComment(req.user!.id, row.id, body.message);
    res.status(204).send();
  }),
);

clientAppointmentsRouter.post(
  '/:appointmentId/confirm-completed',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    await clientConfirmCompletedAppointment(req.user!.id, appointmentId);
    res.status(204).send();
  }),
);

clientAppointmentsRouter.post(
  '/:appointmentId/dispute',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    const body = clientDisputeBody.parse(req.body ?? {});
    const out = await createClientBookingDispute(req.user!.id, appointmentId, body);
    res.status(201).json(out);
  }),
);

export const masterAppointmentsRouter = Router();
masterAppointmentsRouter.use(requireMasterPlatformWrite);

const masterCancelBody = z.object({
  reason: z.string().min(1).max(2000),
  category: z.string().max(64).optional(),
});

const masterCommentBody = z.object({
  comment: z.string().max(2000).optional(),
});

const masterReportNoShowBody = z.object({
  waitedMinutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]),
  hadClientContact: z.boolean(),
  comment: z.string().max(2000).optional(),
});

const masterCloseBody = z.object({
  reason: z.string().max(2000).optional(),
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

masterAppointmentsRouter.get(
  '/voucher/:voucherNumber',
  asyncHandler(async (req, res) => {
    const voucherNumber = voucherParam.parse(req.params.voucherNumber);
    const appointment = await getMasterAppointmentByVoucher(req.user!.id, voucherNumber);
    res.json({ appointment });
  }),
);

masterAppointmentsRouter.get(
  '/:appointmentId',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    const appointment = await getMasterAppointmentById(req.user!.id, appointmentId);
    res.json({ appointment });
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
    await masterMarkCompletedAppointment(req.user!.id, appointmentId);
    res.status(204).send();
  }),
);

masterAppointmentsRouter.patch(
  '/:appointmentId/mark-completed',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    await masterMarkCompletedAppointment(req.user!.id, appointmentId);
    res.status(204).send();
  }),
);

masterAppointmentsRouter.post(
  '/:appointmentId/dispute',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    const body = masterDisputeBody.parse(req.body ?? {});
    const out = await createMasterBookingDispute(req.user!.id, appointmentId, body);
    res.status(201).json(out);
  }),
);

masterAppointmentsRouter.post(
  '/:appointmentId/report-client',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    const body = masterClientReportBody.parse(req.body ?? {});
    const { createBookingClientReport } = await import('./bookingClientReport.service.js');
    const out = await createBookingClientReport(req.user!.id, appointmentId, body);
    res.status(201).json(out);
  }),
);

masterAppointmentsRouter.patch(
  '/:appointmentId/client-arrived',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    await masterClientArrivedAppointment(req.user!.id, appointmentId);
    res.status(204).send();
  }),
);

masterAppointmentsRouter.patch(
  '/:appointmentId/start',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    await masterStartAppointment(req.user!.id, appointmentId);
    res.status(204).send();
  }),
);

masterAppointmentsRouter.patch(
  '/:appointmentId/no-show',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    const body = masterCommentBody.parse(req.body ?? {});
    await masterNoShowAppointment(req.user!.id, appointmentId, body.comment);
    res.status(204).send();
  }),
);

masterAppointmentsRouter.post(
  '/:appointmentId/report-no-show',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    const body = masterReportNoShowBody.parse(req.body ?? {});
    const out = await masterReportNoShowAppointment(req.user!.id, appointmentId, body);
    res.status(201).json(out);
  }),
);

masterAppointmentsRouter.patch(
  '/:appointmentId/close',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    const body = masterCloseBody.parse(req.body ?? {});
    await masterCloseOverdueAppointment(req.user!.id, appointmentId, body.reason);
    res.status(204).send();
  }),
);

masterAppointmentsRouter.patch(
  '/:appointmentId/cancel',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    const body = masterCancelBody.parse(req.body ?? {});
    await masterCancelAppointment(req.user!.id, appointmentId, body.reason, body.category);
    res.status(204).send();
  }),
);
