import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requirePlatformAdmin } from '../../middlewares/requirePlatformAdmin.js';
import {
  approveCategoryChangeRequest,
  listCategoryChangeRequestsForAdmin,
  rejectCategoryChangeRequest,
} from '../masters/categoryChangeRequest.service.js';
import {
  listSponsorRequestsForAdmin,
  updateSponsorRequestStatus,
  type SponsorRequestStatus,
} from '../sponsors/sponsorRequest.service.js';
import {
  listMasterProfileReportsForAdmin,
  updateMasterProfileReportStatus,
  type MasterProfileReportStatus,
} from '../masters/masterProfileReport.service.js';
import { getPlatformAdminOverview } from './platformAdmin.overview.service.js';
import { listPlatformAuditLogs } from './platformAdmin.audit.service.js';
import {
  getPlatformBooking,
  listClientBookingStats,
  listPlatformBookings,
} from './platformAdmin.bookings.service.js';
import {
  getPlatformBookingAuditSummary,
  getPlatformBookingDisputes,
  getPlatformBookingEvents,
  getPlatformBookingNotifications,
} from './platformAdmin.bookingAudit.service.js';
import { resolveBookingDisputeByAdmin } from '../appointments/bookingDisputeResolve.service.js';
import {
  getPlatformMaster,
  hidePlatformMaster,
  listPlatformMasterPicker,
  listPlatformMasters,
  pausePlatformMaster,
  unhidePlatformMaster,
  unpausePlatformMaster,
  grantComplimentaryProToMaster,
} from './platformAdmin.masters.service.js';
import {
  hidePlatformService,
  listPlatformServices,
  unhidePlatformService,
} from './platformAdmin.services.service.js';
import {
  blockPlatformUser,
  getPlatformUser,
  listPlatformUsers,
  restrictPlatformUser,
  unblockPlatformUser,
  unrestrictPlatformUser,
} from './platformAdmin.users.service.js';
import { platformAdminMutationLimiter } from '../../middlewares/rateLimit.js';
import {
  createPromoCodeForAdmin,
  listPromoCodesForAdmin,
  setPromoCodeActiveForAdmin,
} from './platformAdmin.promo.service.js';
import {
  getPlatformPurchasesSummary,
  listPlatformPurchases,
} from './platformAdmin.purchases.service.js';
import {
  adminCancelSubscription,
  adminMarkSubscriptionExpired,
  adminRetrySubscriptionPayment,
  getBillingAdminDiagnostics,
  getSubscriptionDetailForAdmin,
  listSubscriptionsForAdmin,
} from './platformAdmin.subscriptions.service.js';
import {
  approveProManualPaymentRequest,
  listProManualPaymentRequestsForAdmin,
  rejectProManualPaymentRequest,
  type ProManualPaymentStatus,
} from '../billing/proManualPayment.service.js';
import {
  countEmailCampaignAudience,
  createEmailCampaignDraft,
  getEmailCampaign,
  getEmailSendingStatus,
  listEmailCampaignRecipients,
  listEmailCampaigns,
  listNewsletterSubscribers,
  previewEmailCampaign,
  retryFailedCampaignRecipient,
  sendEmailCampaign,
  sendTestEmailCampaign,
  updateEmailCampaignDraft,
  type EmailCampaignAudience,
} from './platformAdmin.emailCampaigns.service.js';
import {
  listAppointmentReminderFailures,
  listNotificationDeliveries,
} from './platformAdmin.notifications.service.js';
import {
  listJobsForAdmin,
  rebuildRemindersByBookingCode,
  retryAllFailedNotificationJobs,
  retryNotificationJob,
  sendTestBookingEmailByCode,
  sendTestEmailToAdmin,
  sendTestTelegramToAdmin,
  getExtendedNotificationDiagnostics,
} from './platformAdmin.notificationJobs.service.js';

export const platformAdminRouter = Router();

platformAdminRouter.use(authMiddleware, requirePlatformAdmin);

platformAdminRouter.use((req, res, next) => {
  if (req.method === 'POST') {
    return platformAdminMutationLimiter(req, res, next);
  }
  next();
});

const reasonBody = z.object({ reason: z.string().min(1).max(2000) });
const restrictBody = z.object({
  reason: z.string().min(1).max(2000),
  until: z.string().datetime().optional().nullable(),
});
const rejectBody = z.object({ adminComment: z.string().min(1).max(2000) });

const createPromoBody = z.object({
  code: z.string().min(3).max(64),
  title: z.string().max(200).optional().nullable(),
  discountPercent: z.coerce.number().int().min(1).max(100),
  billingPeriod: z.enum(['month', 'year']).optional().nullable(),
  maxRedemptions: z.coerce.number().int().min(1).optional().nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
});

platformAdminRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    res.json(await getPlatformAdminOverview());
  }),
);

platformAdminRouter.get(
  '/category-change-requests',
  asyncHandler(async (req, res) => {
    const status = z.enum(['all', 'pending', 'approved', 'rejected']).optional().parse(req.query.status);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listCategoryChangeRequestsForAdmin(status ?? 'all', { limit, offset }));
  }),
);

platformAdminRouter.post(
  '/category-change-requests/:id/approve',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await approveCategoryChangeRequest(id, req.user!.id, null);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/category-change-requests/:id/reject',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = rejectBody.parse(req.body);
    await rejectCategoryChangeRequest(id, req.user!.id, body.adminComment);
    res.json({ ok: true });
  }),
);

const sponsorStatusBody = z.object({
  status: z.enum(['in_review', 'closed', 'rejected']),
  adminComment: z.string().max(2000).optional().nullable(),
});

platformAdminRouter.get(
  '/sponsor-requests',
  asyncHandler(async (req, res) => {
    const status = z
      .enum(['all', 'pending', 'in_review', 'closed', 'rejected'])
      .optional()
      .parse(req.query.status);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listSponsorRequestsForAdmin(status ?? 'pending', { limit, offset }));
  }),
);

platformAdminRouter.patch(
  '/sponsor-requests/:id/status',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = sponsorStatusBody.parse(req.body);
    await updateSponsorRequestStatus(id, req.user!.id, {
      status: body.status as SponsorRequestStatus,
      adminComment: body.adminComment,
    });
    res.json({ ok: true });
  }),
);

const profileReportStatusBody = z.object({
  status: z.enum(['in_review', 'closed', 'rejected']),
  adminComment: z.string().max(2000).optional().nullable(),
});

platformAdminRouter.get(
  '/profile-reports',
  asyncHandler(async (req, res) => {
    const status = z
      .enum(['all', 'pending', 'in_review', 'closed', 'rejected'])
      .optional()
      .parse(req.query.status);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listMasterProfileReportsForAdmin(status ?? 'pending', { limit, offset }));
  }),
);

platformAdminRouter.patch(
  '/profile-reports/:id/status',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = profileReportStatusBody.parse(req.body);
    await updateMasterProfileReportStatus(id, req.user!.id, {
      status: body.status as MasterProfileReportStatus,
      adminComment: body.adminComment,
    });
    res.json({ ok: true });
  }),
);

platformAdminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const q = z.string().optional().parse(req.query.q as string | undefined);
    const role = z.string().optional().parse(req.query.role as string | undefined);
    const status = z.string().optional().parse(req.query.status as string | undefined);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listPlatformUsers({ q, role, status, limit, offset }));
  }),
);

platformAdminRouter.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    res.json({ user: await getPlatformUser(id) });
  }),
);

platformAdminRouter.post(
  '/users/:id/block',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = reasonBody.parse(req.body);
    await blockPlatformUser(id, req.user!.id, body.reason);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/users/:id/unblock',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await unblockPlatformUser(id, req.user!.id);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/users/:id/restrict',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = restrictBody.parse(req.body);
    await restrictPlatformUser(id, req.user!.id, body.reason, body.until ?? null);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/users/:id/unrestrict',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await unrestrictPlatformUser(id, req.user!.id);
    res.json({ ok: true });
  }),
);

platformAdminRouter.get(
  '/masters',
  asyncHandler(async (req, res) => {
    const filter = z.string().optional().parse(req.query.filter as string | undefined);
    const q = z.string().optional().parse(req.query.q as string | undefined);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listPlatformMasters({ filter, q, limit, offset }));
  }),
);

platformAdminRouter.get(
  '/masters-picker',
  asyncHandler(async (req, res) => {
    const q = z.string().optional().parse(req.query.q as string | undefined);
    res.json({ masters: await listPlatformMasterPicker(q) });
  }),
);

platformAdminRouter.get(
  '/masters/:id',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    res.json({ master: await getPlatformMaster(id) });
  }),
);

platformAdminRouter.post(
  '/masters/:id/hide',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = reasonBody.parse(req.body);
    await hidePlatformMaster(id, req.user!.id, body.reason);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/masters/:id/unhide',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await unhidePlatformMaster(id, req.user!.id);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/masters/:id/pause',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = reasonBody.parse(req.body);
    await pausePlatformMaster(id, req.user!.id, body.reason);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/masters/:id/unpause',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await unpausePlatformMaster(id, req.user!.id);
    res.json({ ok: true });
  }),
);

const grantProBody = z.object({
  days: z.coerce.number().int().min(1).max(365),
  reason: z.string().min(3).max(2000),
});

platformAdminRouter.post(
  '/masters/:id/grant-pro',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = grantProBody.parse(req.body);
    res.json(await grantComplimentaryProToMaster(id, req.user!.id, body));
  }),
);

platformAdminRouter.get(
  '/services',
  asyncHandler(async (req, res) => {
    const filter = z.string().optional().parse(req.query.filter as string | undefined);
    const categoryId = z.string().uuid().optional().parse(req.query.categoryId as string | undefined);
    const masterId = z.string().uuid().optional().parse(req.query.masterId as string | undefined);
    const q = z.string().optional().parse(req.query.q as string | undefined);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listPlatformServices({ filter, categoryId, masterId, q, limit, offset }));
  }),
);

platformAdminRouter.post(
  '/services/:id/hide',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = reasonBody.parse(req.body);
    await hidePlatformService(id, req.user!.id, body.reason);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/services/:id/unhide',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await unhidePlatformService(id, req.user!.id);
    res.json({ ok: true });
  }),
);

platformAdminRouter.get(
  '/bookings',
  asyncHandler(async (req, res) => {
    const status = z.string().optional().parse(req.query.status as string | undefined);
    const period = z.string().optional().parse(req.query.period as string | undefined);
    const q = z.string().optional().parse(req.query.q as string | undefined);
    const clientId = z.string().uuid().optional().parse(req.query.clientId as string | undefined);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listPlatformBookings({ status, period, q, clientId, limit, offset }));
  }),
);

platformAdminRouter.get(
  '/bookings-clients/stats',
  asyncHandler(async (req, res) => {
    const period = z
      .enum(['all', 'week', 'month'])
      .optional()
      .parse((req.query.period as string | undefined) ?? 'month');
    const minCancellations = z.coerce.number().int().min(1).max(50).optional().parse(req.query.minCancellations);
    const limit = z.coerce.number().int().min(1).max(50).optional().parse(req.query.limit);
    res.json(await listClientBookingStats({ period, minCancellations, limit }));
  }),
);

platformAdminRouter.get(
  '/bookings/:id',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    res.json({ booking: await getPlatformBooking(id) });
  }),
);

const voucherParam = z
  .string()
  .min(1)
  .transform((v) => v.trim().toUpperCase())
  .refine((v) => /^SL-[A-Z0-9]{12}$/.test(v), 'Invalid booking code');

platformAdminRouter.get(
  '/bookings/voucher/:bookingCode/events',
  asyncHandler(async (req, res) => {
    const code = voucherParam.parse(req.params.bookingCode);
    res.json(await getPlatformBookingEvents(code));
  }),
);

platformAdminRouter.get(
  '/bookings/voucher/:bookingCode/disputes',
  asyncHandler(async (req, res) => {
    const code = voucherParam.parse(req.params.bookingCode);
    res.json(await getPlatformBookingDisputes(code));
  }),
);

platformAdminRouter.get(
  '/bookings/voucher/:bookingCode/notifications',
  asyncHandler(async (req, res) => {
    const code = voucherParam.parse(req.params.bookingCode);
    res.json(await getPlatformBookingNotifications(code));
  }),
);

platformAdminRouter.get(
  '/bookings/voucher/:bookingCode/audit',
  asyncHandler(async (req, res) => {
    const code = voucherParam.parse(req.params.bookingCode);
    res.json(await getPlatformBookingAuditSummary(code));
  }),
);

const resolveDisputeBody = z.object({
  resolution: z.enum(['client_supported', 'master_supported', 'neutral', 'rejected']),
  adminNote: z.string().min(5).max(2000),
  finalStatus: z.enum(['completed', 'no_show', 'cancelled_by_master']).optional().nullable(),
});

platformAdminRouter.post(
  '/bookings/voucher/:bookingCode/disputes/:disputeId/resolve',
  asyncHandler(async (req, res) => {
    const code = voucherParam.parse(req.params.bookingCode);
    const disputeId = z.string().uuid().parse(req.params.disputeId);
    const body = resolveDisputeBody.parse(req.body ?? {});
    await resolveBookingDisputeByAdmin(req.user!.id, code, disputeId, body);
    res.status(204).send();
  }),
);

platformAdminRouter.get(
  '/promo-codes',
  asyncHandler(async (_req, res) => {
    res.json({ promoCodes: await listPromoCodesForAdmin() });
  }),
);

platformAdminRouter.post(
  '/promo-codes',
  asyncHandler(async (req, res) => {
    const body = createPromoBody.parse(req.body);
    res.status(201).json({ promoCode: await createPromoCodeForAdmin(req.user!.id, body) });
  }),
);

platformAdminRouter.patch(
  '/promo-codes/:id/active',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const isActive = z.object({ isActive: z.boolean() }).parse(req.body).isActive;
    await setPromoCodeActiveForAdmin(req.user!.id, id, isActive);
    res.json({ ok: true });
  }),
);

platformAdminRouter.get(
  '/purchases/summary',
  asyncHandler(async (_req, res) => {
    res.json(await getPlatformPurchasesSummary());
  }),
);

platformAdminRouter.get(
  '/purchases',
  asyncHandler(async (req, res) => {
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listPlatformPurchases({ limit, offset }));
  }),
);

platformAdminRouter.get(
  '/billing/diagnostics',
  asyncHandler(async (_req, res) => {
    res.json(await getBillingAdminDiagnostics());
  }),
);

platformAdminRouter.get(
  '/subscriptions',
  asyncHandler(async (req, res) => {
    const status = z.string().optional().parse(req.query.status);
    const planCode = z.string().optional().parse(req.query.planCode);
    const cancelAtPeriodEnd =
      req.query.cancelAtPeriodEnd === 'true'
        ? true
        : req.query.cancelAtPeriodEnd === 'false'
          ? false
          : undefined;
    const pastDue = req.query.pastDue === 'true' ? true : undefined;
    const nextChargeSoon = req.query.nextChargeSoon === 'true' ? true : undefined;
    const hasFailedPayments = req.query.hasFailedPayments === 'true' ? true : undefined;
    const page = z.coerce.number().int().min(1).optional().parse(req.query.page);
    const pageSize = z.coerce.number().int().min(1).max(100).optional().parse(req.query.pageSize);
    res.json(
      await listSubscriptionsForAdmin({
        status,
        planCode,
        cancelAtPeriodEnd,
        pastDue,
        nextChargeSoon,
        hasFailedPayments,
        page,
        pageSize,
      }),
    );
  }),
);

platformAdminRouter.get(
  '/subscriptions/:masterId',
  asyncHandler(async (req, res) => {
    const masterId = z.string().uuid().parse(req.params.masterId);
    res.json(await getSubscriptionDetailForAdmin(masterId));
  }),
);

platformAdminRouter.post(
  '/subscriptions/:masterId/cancel',
  asyncHandler(async (req, res) => {
    const masterId = z.string().uuid().parse(req.params.masterId);
    const body = z.object({ reason: z.string().min(3).max(500) }).parse(req.body ?? {});
    await adminCancelSubscription(masterId, req.user!.id, body.reason);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/subscriptions/:masterId/expire',
  asyncHandler(async (req, res) => {
    const masterId = z.string().uuid().parse(req.params.masterId);
    const body = z.object({ reason: z.string().min(3).max(500) }).parse(req.body ?? {});
    await adminMarkSubscriptionExpired(masterId, req.user!.id, body.reason);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/subscriptions/:masterId/retry-payment',
  asyncHandler(async (req, res) => {
    const masterId = z.string().uuid().parse(req.params.masterId);
    res.json(await adminRetrySubscriptionPayment(masterId, req.user!.id));
  }),
);

const approveProPaymentBody = z.object({
  receivedAmount: z.coerce.number().positive().max(999_999.99).optional().nullable(),
  adminNote: z.string().max(4000).optional().nullable(),
  taxReceiptCreated: z.boolean().optional(),
  taxReceiptNote: z.string().max(2000).optional().nullable(),
  durationDays: z.coerce.number().int().min(1).max(366).optional(),
});

const rejectProPaymentBody = z.object({
  rejectionReason: z.string().min(5).max(2000),
  adminNote: z.string().max(4000).optional().nullable(),
});

async function listManualPaymentRequestsHandler(req: import('express').Request, res: import('express').Response) {
  const status = z
    .enum(['all', 'pending', 'approved', 'rejected', 'cancelled'])
    .optional()
    .parse(req.query.status);
  const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
  const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
  res.json(
    await listProManualPaymentRequestsForAdmin(
      (status ?? 'pending') as 'all' | ProManualPaymentStatus,
      { limit, offset },
    ),
  );
}

async function approveManualPaymentHandler(req: import('express').Request, res: import('express').Response) {
  const id = z.string().uuid().parse(req.params.id);
  const body = approveProPaymentBody.parse(req.body);
  await approveProManualPaymentRequest(id, req.user!.id, body);
  res.json({ ok: true });
}

async function rejectManualPaymentHandler(req: import('express').Request, res: import('express').Response) {
  const id = z.string().uuid().parse(req.params.id);
  const body = rejectProPaymentBody.parse(req.body);
  await rejectProManualPaymentRequest(id, req.user!.id, body);
  res.json({ ok: true });
}

platformAdminRouter.get('/pro-payment-requests', asyncHandler(listManualPaymentRequestsHandler));

platformAdminRouter.get(
  '/billing/manual-payment-requests',
  asyncHandler(listManualPaymentRequestsHandler),
);

platformAdminRouter.post(
  '/pro-payment-requests/:id/approve',
  asyncHandler(approveManualPaymentHandler),
);

platformAdminRouter.post(
  '/billing/manual-payment-requests/:id/approve',
  asyncHandler(approveManualPaymentHandler),
);

platformAdminRouter.post(
  '/pro-payment-requests/:id/reject',
  asyncHandler(rejectManualPaymentHandler),
);

platformAdminRouter.post(
  '/billing/manual-payment-requests/:id/reject',
  asyncHandler(rejectManualPaymentHandler),
);

platformAdminRouter.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listPlatformAuditLogs({ limit, offset }));
  }),
);

const emailCampaignAudienceSchema = z.enum([
  'newsletter_subscribers',
  'masters',
  'clients',
  'all_profiles',
  'test_only',
]);

const emailCampaignBody = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().min(1).max(200),
  previewText: z.string().max(300).optional().nullable(),
  bodyText: z.string().min(1).max(20000),
  ctaText: z.string().max(100).optional().nullable(),
  ctaUrl: z.string().max(500).optional().nullable(),
  audience: emailCampaignAudienceSchema,
});

platformAdminRouter.get(
  '/email/status',
  asyncHandler(async (_req, res) => {
    res.json(getEmailSendingStatus());
  }),
);

platformAdminRouter.get(
  '/email/campaigns',
  asyncHandler(async (req, res) => {
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listEmailCampaigns({ limit, offset }));
  }),
);

platformAdminRouter.post(
  '/email/campaigns',
  asyncHandler(async (req, res) => {
    const body = emailCampaignBody.parse(req.body);
    res.status(201).json(await createEmailCampaignDraft(req.user!.id, body));
  }),
);

platformAdminRouter.get(
  '/email/campaigns/:id',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    res.json(await getEmailCampaign(id));
  }),
);

platformAdminRouter.patch(
  '/email/campaigns/:id',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = emailCampaignBody.partial().parse(req.body);
    res.json(await updateEmailCampaignDraft(id, body));
  }),
);

platformAdminRouter.get(
  '/email/campaigns/:id/preview',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    res.json(await previewEmailCampaign(id));
  }),
);

platformAdminRouter.get(
  '/email/campaigns/:id/audience-count',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const campaign = await getEmailCampaign(id);
    const testEmail = z.string().email().optional().parse(req.query.testEmail);
    const count = await countEmailCampaignAudience(campaign.audience as EmailCampaignAudience, testEmail);
    res.json({ count, audience: campaign.audience });
  }),
);

platformAdminRouter.post(
  '/email/campaigns/:id/test',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = z.object({ testEmail: z.string().email() }).parse(req.body);
    res.json(await sendTestEmailCampaign(id, body.testEmail));
  }),
);

platformAdminRouter.post(
  '/email/campaigns/:id/send',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = z
      .object({
        confirmed: z.literal(true),
        testEmail: z.string().email().optional().nullable(),
      })
      .parse(req.body);
    res.json(await sendEmailCampaign(id, body));
  }),
);

platformAdminRouter.get(
  '/email/campaigns/:id/recipients',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const status = z.string().optional().parse(req.query.status);
    const search = z.string().optional().parse(req.query.search);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listEmailCampaignRecipients(id, { status, search, limit, offset }));
  }),
);

platformAdminRouter.post(
  '/email/campaigns/:id/recipients/:recipientId/retry',
  asyncHandler(async (req, res) => {
    const campaignId = z.string().uuid().parse(req.params.id);
    const recipientId = z.string().uuid().parse(req.params.recipientId);
    res.json(await retryFailedCampaignRecipient(campaignId, recipientId));
  }),
);

platformAdminRouter.get(
  '/email/newsletter-subscribers',
  asyncHandler(async (req, res) => {
    const status = z.string().optional().parse(req.query.status);
    const search = z.string().optional().parse(req.query.search);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listNewsletterSubscribers({ status, search, limit, offset }));
  }),
);

platformAdminRouter.get(
  '/notifications/deliveries',
  asyncHandler(async (req, res) => {
    const channel = z.string().optional().parse(req.query.channel);
    const status = z.string().optional().parse(req.query.status);
    const search = z.string().optional().parse(req.query.search);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listNotificationDeliveries({ channel, status, search, limit, offset }));
  }),
);

platformAdminRouter.get(
  '/notifications/reminder-failures',
  asyncHandler(async (req, res) => {
    const search = z.string().optional().parse(req.query.search);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listAppointmentReminderFailures({ search, limit, offset }));
  }),
);

platformAdminRouter.get(
  '/notifications/diagnostics',
  asyncHandler(async (_req, res) => {
    res.json(await getExtendedNotificationDiagnostics());
  }),
);

platformAdminRouter.get(
  '/notifications/jobs',
  asyncHandler(async (req, res) => {
    const bookingCode = z.string().optional().parse(req.query.bookingCode);
    const appointmentId = z.string().uuid().optional().parse(req.query.appointmentId);
    const limit = z.coerce.number().int().min(1).max(200).optional().parse(req.query.limit);
    const jobs = await listJobsForAdmin({ bookingCode, appointmentId, limit });
    res.json({ jobs });
  }),
);

platformAdminRouter.post(
  '/notifications/test-email',
  asyncHandler(async (req, res) => {
    const out = await sendTestEmailToAdmin(req.user!.id);
    res.json(out);
  }),
);

platformAdminRouter.post(
  '/notifications/test-telegram',
  asyncHandler(async (req, res) => {
    const out = await sendTestTelegramToAdmin(req.user!.id);
    res.json(out);
  }),
);

platformAdminRouter.post(
  '/notifications/test-booking/:bookingCode',
  asyncHandler(async (req, res) => {
    const bookingCode = z.string().min(1).parse(req.params.bookingCode);
    const out = await sendTestBookingEmailByCode(req.user!.id, bookingCode);
    res.json(out);
  }),
);

const testBookingBody = z.object({ bookingCode: z.string().min(1) });

platformAdminRouter.post(
  '/notifications/test-booking-email',
  asyncHandler(async (req, res) => {
    const body = testBookingBody.parse(req.body ?? {});
    const out = await sendTestBookingEmailByCode(req.user!.id, body.bookingCode);
    res.json(out);
  }),
);

platformAdminRouter.post(
  '/notifications/rebuild-reminders',
  asyncHandler(async (req, res) => {
    const body = testBookingBody.parse(req.body ?? {});
    await rebuildRemindersByBookingCode(body.bookingCode);
    res.status(204).send();
  }),
);

platformAdminRouter.post(
  '/notifications/retry/:jobId',
  asyncHandler(async (req, res) => {
    const jobId = z.string().uuid().parse(req.params.jobId);
    await retryNotificationJob(jobId);
    res.status(204).send();
  }),
);

platformAdminRouter.post(
  '/notifications/retry-failed',
  asyncHandler(async (_req, res) => {
    const result = await retryAllFailedNotificationJobs();
    res.json(result);
  }),
);
