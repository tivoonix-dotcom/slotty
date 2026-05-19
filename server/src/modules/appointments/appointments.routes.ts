import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import {
  cancelClientAppointment,
  createAppointmentTx,
  listClientAppointments,
  listMasterAppointments,
  masterCancelAppointment,
  masterCompleteAppointment,
  masterConfirmAppointment,
} from './appointments.service.js';
import { notifyAppointmentCreated, notifyMasterClientCancelledBooking } from './appointments.telegram.js';

export const appointmentCreateRouter = Router();
appointmentCreateRouter.use(authMiddleware);

const bookBody = z.object({
  slotId: z.string().uuid(),
  serviceId: z.string().uuid(),
  clientNote: z.string().max(2000).optional(),
});

appointmentCreateRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = bookBody.parse(req.body);
    const out = await createAppointmentTx({
      clientId: req.user!.id,
      slotId: body.slotId,
      serviceId: body.serviceId,
      clientNote: body.clientNote,
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

clientAppointmentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await listClientAppointments(req.user!.id);
    res.json({ appointments: rows });
  }),
);

clientAppointmentsRouter.patch(
  '/:appointmentId/cancel',
  asyncHandler(async (req, res) => {
    const appointmentId = z.string().uuid().parse(req.params.appointmentId);
    const { masterId } = await cancelClientAppointment(req.user!.id, appointmentId);
    void notifyMasterClientCancelledBooking(masterId, appointmentId);
    res.status(204).send();
  }),
);

export const masterAppointmentsRouter = Router();

masterAppointmentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await listMasterAppointments(req.user!.id);
    res.json({ appointments: rows });
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
    await masterCancelAppointment(req.user!.id, appointmentId);
    res.status(204).send();
  }),
);
