import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireMasterDbAccess } from '../../middlewares/requireMasterAccess.js';
import {
  getMasterDetail,
  getMyMasterCabinet,
  listPublishedMasters,
  patchMyMasterProfile,
  upsertMyMasterProfile,
} from './masters.service.js';
import {
  createMyCareerItem,
  createMyCertificate,
  createMyPortfolioItem,
  deleteMyCareerItem,
  deleteMyCertificate,
  deleteMyPortfolioItem,
  getMyBookingRulesDecoded,
  listMyCareer,
  listMyCertificates,
  listMyPortfolio,
  patchMyBookingRules,
  updateMyCareerItem,
  updateMyCertificate,
  updateMyPortfolioItem,
} from './masterTrustProfile.service.js';
import {
  insertCertificates,
  replaceScheduleRules,
  upsertPrimaryLocation,
} from './masterOnboarding.service.js';
import { completeMyMasterOnboarding } from './masterOnboardingComplete.service.js';
import { masterServicesRouter } from '../services/services.routes.js';
import { masterSlotsRouter } from '../slots/slots.routes.js';
import { masterAppointmentsRouter } from '../appointments/appointments.routes.js';
import { getMasterSubscriptionWithUsage, switchMasterSubscriptionMock } from '../billing/billing.service.js';

export const mastersRouter = Router();

const listQuery = z.object({
  category: z.string().min(1).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

mastersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = listQuery.parse(req.query);
    const rows = await listPublishedMasters({
      category: q.category,
      search: q.search,
      limit: q.limit,
    });
    res.json({ masters: rows });
  }),
);

const postMe = z.object({
  displayName: z.string().min(1).max(200),
  bio: z.string().max(10_000).optional(),
  phone: z
    .string()
    .max(50)
    .nullable()
    .optional()
    .refine((v) => v == null || v === '' || /^[\d\s+()\-]{5,50}$/.test(v), {
      message: 'Телефон: только цифры, пробелы и + ( ) -, от 5 символов',
    }),
  contact: z.string().max(500).nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  slug: z.string().max(120).nullable().optional(),
  primaryCategoryCode: z.string().min(1).max(80).nullable().optional(),
});

const patchMe = z.object({
  displayName: z.string().min(1).max(200).optional(),
  bio: z.string().max(10_000).optional(),
  phone: z
    .string()
    .max(50)
    .nullable()
    .optional()
    .refine((v) => v == null || v === '' || /^[\d\s+()\-]{5,50}$/.test(v), {
      message: 'Телефон: только цифры, пробелы и + ( ) -, от 5 символов',
    }),
  contact: z.string().max(500).nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  slug: z.string().max(120).nullable().optional(),
  primaryCategoryCode: z.string().min(1).max(80).nullable().optional(),
  publicationStatus: z.enum(['draft', 'published', 'hidden', 'blocked']).optional(),
  globalBufferMinutes: z.coerce.number().int().min(0).max(240).optional(),
});

const primaryLocationBody = z.object({
  visitType: z.enum(['studio', 'at_home']),
  city: z.string().min(1).max(120),
  street: z.string().min(1).max(200),
  building: z.string().min(1).max(80),
  buildingDetail: z.string().max(120).nullable().optional(),
  entrance: z.string().max(120).nullable().optional(),
  floor: z.string().max(40).nullable().optional(),
  room: z.string().max(80).nullable().optional(),
  intercom: z.string().max(80).nullable().optional(),
  landmark: z.string().max(240).nullable().optional(),
  directions: z.string().max(2000).nullable().optional(),
  clientNote: z.string().max(2000).nullable().optional(),
  publicAddress: z.string().min(1).max(600),
  lat: z.number().finite().nullable().optional(),
  lng: z.number().finite().nullable().optional(),
});

const scheduleRulesBody = z.object({
  rules: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^\d{1,2}:\d{2}$/),
        endTime: z.string().regex(/^\d{1,2}:\d{2}$/),
      }),
    )
    .min(1)
    .max(56),
});

const certificatesBatchBody = z.object({
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(300),
        issuer: z.string().min(1).max(300),
        year: z.number().int().min(1950).max(2100).nullable().optional(),
        description: z.string().max(5000).nullable().optional(),
        imageUrl: z.string().url().nullable().optional(),
      }),
    )
    .max(50),
});

const httpsImageUrl = z
  .string()
  .url()
  .max(2000)
  .refine((u) => u.startsWith('https://'), { message: 'Разрешены только https-ссылки на изображения' });

const bookingRulesPatchBody = z.object({
  bookingRules: z.string().max(20000).nullable().optional(),
  cancellationPolicy: z.string().max(20000).nullable().optional(),
  paymentNote: z.string().max(20000).nullable().optional(),
  paymentMethods: z.array(z.string().max(80)).max(30).optional(),
});

const careerTypeEnum = z.enum(['education', 'course', 'practice', 'work']);

const careerCreateBody = z.object({
  type: careerTypeEnum,
  title: z.string().min(1).max(300),
  place: z.string().min(1).max(300),
  startYear: z.number().int().min(1950).max(2100).nullable().optional(),
  endYear: z.number().int().min(1950).max(2100).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const careerPatchBody = z.object({
  type: careerTypeEnum.optional(),
  title: z.string().min(1).max(300).optional(),
  place: z.string().min(1).max(300).optional(),
  startYear: z.number().int().min(1950).max(2100).nullable().optional(),
  endYear: z.number().int().min(1950).max(2100).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const certificateCreateBody = z.object({
  title: z.string().min(1).max(300),
  issuer: z.string().min(1).max(300),
  year: z.number().int().min(1950).max(2100).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  imageUrl: z.union([z.literal(''), httpsImageUrl]).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const certificatePatchBody = z.object({
  title: z.string().min(1).max(300).optional(),
  issuer: z.string().min(1).max(300).optional(),
  year: z.number().int().min(1950).max(2100).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  imageUrl: z.union([z.literal(''), httpsImageUrl]).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const portfolioCreateBody = z.object({
  imageUrl: httpsImageUrl,
  title: z.string().max(300).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const portfolioPatchBody = z.object({
  imageUrl: httpsImageUrl.optional(),
  title: z.string().max(300).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const onboardingLocationSchema = z.object({
  visitType: z.enum(['studio', 'at_home']),
  city: z.string().min(1).max(120),
  street: z.string().min(1).max(200),
  building: z.string().min(1).max(80),
  buildingDetail: z.string().max(120).nullable().optional(),
  entrance: z.string().max(120).nullable().optional(),
  floor: z.string().max(40).nullable().optional(),
  room: z.string().max(80).nullable().optional(),
  intercom: z.string().max(80).nullable().optional(),
  landmark: z.string().max(240).nullable().optional(),
  directions: z.string().max(2000).nullable().optional(),
  clientNote: z.string().max(2000).nullable().optional(),
  publicAddress: z.string().min(1).max(600),
  lat: z.number().finite().nullable().optional(),
  lng: z.number().finite().nullable().optional(),
});

const onboardingScheduleRuleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{1,2}:\d{2}$/),
  endTime: z.string().regex(/^\d{1,2}:\d{2}$/),
  isActive: z.boolean().optional().default(true),
});

const onboardingServiceSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(20_000).optional().default(''),
  durationMinutes: z.coerce.number().int().min(1).max(24 * 60),
  priceAmount: z.coerce.number().min(0),
  priceType: z.enum(['fixed', 'from']).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const onboardingCertificateSchema = z.object({
  title: z.string().min(1).max(300),
  issuer: z.string().min(1).max(300),
  year: z.number().int().min(1950).max(2100).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const onboardingBody = z.object({
  categoryCode: z.string().min(1).max(80),
  name: z.string().min(2).max(200),
  description: z.string().max(10_000).optional(),
  phone: z
    .string()
    .max(50)
    .nullable()
    .optional()
    .refine((v) => v == null || v === '' || /^[\d\s+()\-]{5,50}$/.test(v), {
      message: 'Телефон: только цифры, пробелы и + ( ) -, от 5 символов',
    }),
  contact: z.string().max(500).nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  location: onboardingLocationSchema,
  scheduleRules: z.array(onboardingScheduleRuleSchema).min(1).max(56),
  services: z.array(onboardingServiceSchema).min(1).max(100),
  certificates: z.array(onboardingCertificateSchema).max(50).default([]),
});

mastersRouter.post(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const body = postMe.parse(req.body);
    const out = await upsertMyMasterProfile(req.user!.id, {
      displayName: body.displayName,
      bio: body.bio,
      phone: body.phone === '' ? null : body.phone,
      contact: body.contact === '' ? null : body.contact,
      photoUrl: body.photoUrl,
      slug: body.slug,
      primaryCategoryCode: body.primaryCategoryCode,
    });
    res.status(201).json(out);
  }),
);

mastersRouter.post(
  '/me/onboarding',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const body = onboardingBody.parse(req.body);
    const out = await completeMyMasterOnboarding(req.user!.id, {
      categoryCode: body.categoryCode.trim(),
      name: body.name.trim(),
      description: body.description?.trim(),
      phone: body.phone === '' ? null : body.phone,
      contact: body.contact === '' ? null : body.contact?.trim() ?? null,
      photoUrl: body.photoUrl?.trim() || null,
      location: {
        visitType: body.location.visitType,
        city: body.location.city.trim(),
        street: body.location.street.trim(),
        building: body.location.building.trim(),
        buildingDetail: body.location.buildingDetail?.trim() || null,
        entrance: body.location.entrance?.trim() || null,
        floor: body.location.floor?.trim() || null,
        room: body.location.room?.trim() || null,
        intercom: body.location.intercom?.trim() || null,
        landmark: body.location.landmark?.trim() || null,
        directions: body.location.directions?.trim() || null,
        clientNote: body.location.clientNote?.trim() || null,
        publicAddress: body.location.publicAddress.trim(),
        lat: body.location.lat ?? null,
        lng: body.location.lng ?? null,
      },
      scheduleRules: body.scheduleRules.map((r) => ({
        weekday: r.weekday,
        startTime: r.startTime,
        endTime: r.endTime,
        isActive: r.isActive,
      })),
      services: body.services.map((s) => ({
        title: s.title,
        description: s.description ?? '',
        durationMinutes: s.durationMinutes,
        priceAmount: s.priceAmount,
        priceType: s.priceType,
        sortOrder: s.sortOrder,
      })),
      certificates: body.certificates.map((c) => ({
        title: c.title,
        issuer: c.issuer,
        year: c.year ?? null,
        description: c.description?.trim() ?? null,
        imageUrl: c.imageUrl ?? null,
        sortOrder: c.sortOrder,
      })),
    });
    res.status(201).json(out);
  }),
);

mastersRouter.patch(
  '/me',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const body = patchMe.parse(req.body);
    const out = await patchMyMasterProfile(req.user!.id, {
      displayName: body.displayName,
      bio: body.bio,
      phone: body.phone === '' ? null : body.phone,
      contact: body.contact === '' ? null : body.contact,
      photoUrl: body.photoUrl,
      slug: body.slug,
      primaryCategoryCode: body.primaryCategoryCode,
      publicationStatus: body.publicationStatus,
      globalBufferMinutes: body.globalBufferMinutes,
    });
    res.json(out);
  }),
);

mastersRouter.get(
  '/me',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const cabinet = await getMyMasterCabinet(req.user!.id);
    res.json(cabinet);
  }),
);

mastersRouter.put(
  '/me/primary-location',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const body = primaryLocationBody.parse(req.body);
    await upsertPrimaryLocation(req.user!.id, {
      visitType: body.visitType,
      city: body.city,
      street: body.street,
      building: body.building,
      buildingDetail: body.buildingDetail,
      entrance: body.entrance,
      floor: body.floor,
      room: body.room,
      intercom: body.intercom,
      landmark: body.landmark,
      directions: body.directions,
      clientNote: body.clientNote,
      publicAddress: body.publicAddress,
      lat: body.lat,
      lng: body.lng,
    });
    res.status(204).send();
  }),
);

mastersRouter.put(
  '/me/schedule-rules',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const body = scheduleRulesBody.parse(req.body);
    await replaceScheduleRules(req.user!.id, body.rules);
    res.status(204).send();
  }),
);

mastersRouter.get(
  '/me/booking-rules',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const row = await getMyBookingRulesDecoded(req.user!.id);
    res.json({
      bookingRules: row.bookingRules,
      cancellationPolicy: row.cancellationPolicy,
      paymentNote: row.paymentNote,
      paymentMethods: row.paymentMethods,
    });
  }),
);

mastersRouter.patch(
  '/me/booking-rules',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const body = bookingRulesPatchBody.parse(req.body);
    await patchMyBookingRules(req.user!.id, {
      bookingRules: body.bookingRules,
      cancellationPolicy: body.cancellationPolicy,
      paymentNote: body.paymentNote,
      paymentMethods: body.paymentMethods,
    });
    const row = await getMyBookingRulesDecoded(req.user!.id);
    res.json({
      bookingRules: row.bookingRules,
      cancellationPolicy: row.cancellationPolicy,
      paymentNote: row.paymentNote,
      paymentMethods: row.paymentMethods,
    });
  }),
);

mastersRouter.get(
  '/me/career',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const career = await listMyCareer(req.user!.id);
    res.json({ career });
  }),
);

mastersRouter.post(
  '/me/career',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const body = careerCreateBody.parse(req.body);
    const row = await createMyCareerItem(req.user!.id, body);
    res.status(201).json(row);
  }),
);

mastersRouter.patch(
  '/me/career/:id',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = careerPatchBody.parse(req.body);
    await updateMyCareerItem(req.user!.id, id, body);
    res.status(204).send();
  }),
);

mastersRouter.delete(
  '/me/career/:id',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await deleteMyCareerItem(req.user!.id, id);
    res.status(204).send();
  }),
);

mastersRouter.get(
  '/me/certificates',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const certificates = await listMyCertificates(req.user!.id);
    res.json({ certificates });
  }),
);

mastersRouter.post(
  '/me/certificates',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const body = certificateCreateBody.parse(req.body);
    const row = await createMyCertificate(req.user!.id, {
      title: body.title,
      issuer: body.issuer,
      year: body.year ?? null,
      description: body.description ?? null,
      imageUrl: body.imageUrl === '' ? null : body.imageUrl ?? null,
      sortOrder: body.sortOrder,
    });
    res.status(201).json(row);
  }),
);

mastersRouter.patch(
  '/me/certificates/:id',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = certificatePatchBody.parse(req.body);
    const patch: {
      title?: string;
      issuer?: string;
      year?: number | null;
      description?: string | null;
      imageUrl?: string | null;
      sortOrder?: number;
    } = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.issuer !== undefined) patch.issuer = body.issuer;
    if (body.year !== undefined) patch.year = body.year;
    if (body.description !== undefined) patch.description = body.description;
    if (body.imageUrl !== undefined) patch.imageUrl = body.imageUrl === '' ? null : body.imageUrl;
    if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;
    await updateMyCertificate(req.user!.id, id, patch);
    res.status(204).send();
  }),
);

mastersRouter.delete(
  '/me/certificates/:id',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await deleteMyCertificate(req.user!.id, id);
    res.status(204).send();
  }),
);

mastersRouter.post(
  '/me/certificates/batch',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const body = certificatesBatchBody.parse(req.body);
    await insertCertificates(req.user!.id, body.items);
    res.status(201).json({ ok: true, count: body.items.length });
  }),
);

mastersRouter.get(
  '/me/portfolio',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const portfolio = await listMyPortfolio(req.user!.id);
    res.json({ portfolio });
  }),
);

mastersRouter.post(
  '/me/portfolio',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const body = portfolioCreateBody.parse(req.body);
    const row = await createMyPortfolioItem(req.user!.id, {
      imageUrl: body.imageUrl,
      title: body.title ?? null,
      description: body.description ?? null,
      sortOrder: body.sortOrder,
    });
    res.status(201).json(row);
  }),
);

mastersRouter.patch(
  '/me/portfolio/:id',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = portfolioPatchBody.parse(req.body);
    const patch: {
      imageUrl?: string;
      title?: string | null;
      description?: string | null;
      sortOrder?: number;
    } = {};
    if (body.imageUrl !== undefined) patch.imageUrl = body.imageUrl;
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;
    await updateMyPortfolioItem(req.user!.id, id, patch);
    res.status(204).send();
  }),
);

mastersRouter.delete(
  '/me/portfolio/:id',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await deleteMyPortfolioItem(req.user!.id, id);
    res.status(204).send();
  }),
);

mastersRouter.use('/me/services', authMiddleware, requireMasterDbAccess, masterServicesRouter);
mastersRouter.use('/me/slots', authMiddleware, requireMasterDbAccess, masterSlotsRouter);
mastersRouter.use('/me/appointments', authMiddleware, requireMasterDbAccess, masterAppointmentsRouter);

mastersRouter.get(
  '/me/subscription',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const subscription = await getMasterSubscriptionWithUsage(req.user!.id);
    res.json({ subscription });
  }),
);

const subscriptionMockBody = z.object({
  planCode: z.enum(['free', 'pro']),
  billingPeriod: z.enum(['month', 'year']),
});

mastersRouter.patch(
  '/me/subscription/mock',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const body = subscriptionMockBody.parse(req.body);
    const subscription = await switchMasterSubscriptionMock(req.user!.id, body.planCode, body.billingPeriod);
    res.json({ subscription });
  }),
);

mastersRouter.get(
  '/:masterId',
  asyncHandler(async (req, res) => {
    const masterId = z.string().uuid().parse(req.params.masterId);
    const detail = await getMasterDetail(masterId);
    res.json(detail);
  }),
);
