import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
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
import {
  uploadMasterCertificateImage,
  uploadMasterHeroPhoto,
  uploadMasterPortfolioImage,
} from './masters.storage.js';
import { completeMyMasterOnboarding } from './masterOnboardingComplete.service.js';
import { masterDisplayNamePassesQuality } from '../../lib/masterDisplayNamePolicy.js';
import { masterServicesRouter } from '../services/services.routes.js';
import { masterBundlesRouter, masterPromotionsRouter } from '../service-extras/serviceExtras.routes.js';
import { smartPromotionSuggestionsRouter } from '../smart-promotions/smartPromotionSuggestions.routes.js';
import { masterSlotsRouter } from '../slots/slots.routes.js';
import { masterAppointmentsRouter } from '../appointments/appointments.routes.js';
import { getMasterSubscriptionWithUsage, switchMasterSubscriptionMock } from '../billing/billing.service.js';
import { masterOverviewRouter } from './masterOverview.routes.js';
import { normalizeBelarusPhone, isOptionalBelarusPhoneValid } from '../../utils/belarusPhone.js';

export const mastersRouter = Router();

const masterImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const optionalBelarusMobile = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v == null) return null;
    const s = typeof v === 'string' ? v.trim() : '';
    return s === '' ? null : s;
  })
  .superRefine((v, ctx) => {
    if (v == null) return;
    if (!isOptionalBelarusPhoneValid(v)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Введите корректный номер Беларуси',
      });
    }
  })
  .transform((v) => (v ? normalizeBelarusPhone(v) : null));

const listQuery = z.object({
  category: z.string().min(1).optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(300).optional().default(30),
});

function minutesSinceMidnight(t: string): number {
  const [hs, ms] = t.split(':');
  const h = Number.parseInt(hs ?? '0', 10);
  const m = Number.parseInt(ms ?? '0', 10);
  return h * 60 + m;
}

const timeHHMM = z
  .string()
  .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, { message: 'Время: формат ЧЧ:ММ (00:00–23:59)' });

const scheduleItemSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startTime: timeHHMM,
    endTime: timeHHMM,
  })
  .refine((r) => minutesSinceMidnight(r.endTime) > minutesSinceMidnight(r.startTime), {
    message: 'Время окончания должно быть позже начала',
  });

const onboardingScheduleItemSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startTime: timeHHMM,
    endTime: timeHHMM,
    isActive: z.boolean().optional().default(true),
  })
  .refine((r) => minutesSinceMidnight(r.endTime) > minutesSinceMidnight(r.startTime), {
    message: 'Время окончания должно быть позже начала',
  });

const photoUrlNullable = z
  .union([
    z.literal(''),
    z.string().url(),
    z.string().regex(/^data:image\/(jpeg|jpg|png|webp);base64,/i),
  ])
  .nullable()
  .optional();

const slugNullable = z
  .string()
  .max(120)
  .nullable()
  .optional()
  .refine(
    (s) => s == null || s === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s),
    { message: 'Slug: только латиница в нижнем регистре, цифры и дефисы' },
  );

const httpsImageUrl = z
  .string()
  .url()
  .max(2000)
  .refine((u) => u.startsWith('https://'), { message: 'Разрешены только https-ссылки на изображения' });

const MAX_SERVICE_PRICE_AMOUNT = 10_000_000;

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
  displayName: z
    .string()
    .max(200)
    .transform((s) => s.trim())
    .refine((s) => s.length >= 1, { message: 'Имя не может быть пустым' }),
  bio: z.string().max(10_000).optional(),
  phone: optionalBelarusMobile,
  contact: z.string().max(500).nullable().optional(),
  photoUrl: photoUrlNullable,
  slug: slugNullable,
  primaryCategoryCode: z
    .string()
    .max(80)
    .nullable()
    .optional()
    .transform((v) => (typeof v === 'string' ? v.trim() : v))
    .refine((v) => v == null || v.length >= 1, {
      message: 'Код категории не может быть пустым',
    }),
});

const masterContactItemSchema = z.object({
  type: z.enum(['telegram', 'viber', 'vk', 'instagram', 'whatsapp', 'other']),
  value: z
    .string()
    .max(500)
    .transform((s) => s.trim())
    .refine((s) => s.length >= 1, { message: 'Заполните контакт' }),
});

const patchMe = z.object({
  displayName: z
    .string()
    .max(200)
    .transform((s) => s.trim())
    .refine((s) => s.length >= 1, { message: 'Имя не может быть пустым' })
    .optional(),
  bio: z.string().max(10_000).optional(),
  phone: optionalBelarusMobile,
  contact: z.string().max(500).nullable().optional(),
  contacts: z.array(masterContactItemSchema).max(12).optional(),
  photoUrl: photoUrlNullable,
  slug: slugNullable,
  primaryCategoryCode: z
    .string()
    .max(80)
    .nullable()
    .optional()
    .transform((v) => (typeof v === 'string' ? v.trim() : v))
    .refine((v) => v == null || v.length >= 1, {
      message: 'Код категории не может быть пустым',
    }),
  publicationStatus: z.enum(['draft', 'published', 'hidden', 'blocked']).optional(),
  globalBufferMinutes: z.coerce.number().int().finite().min(0).max(240).optional(),
});

const primaryLocationBody = z
  .object({
    visitType: z.enum(['studio', 'at_home']),
    city: z
      .string()
      .max(120)
      .transform((s) => s.trim())
      .refine((s) => s.length >= 1, { message: 'Укажите город' }),
    street: z
      .string()
      .max(200)
      .transform((s) => s.trim())
      .refine((s) => s.length >= 1, { message: 'Укажите улицу' }),
    building: z
      .string()
      .max(80)
      .transform((s) => s.trim())
      .refine((s) => s.length >= 1, { message: 'Укажите номер дома' }),
    buildingDetail: z.string().max(120).nullable().optional(),
    salonName: z.string().max(120).nullable().optional(),
    district: z.string().max(120).nullable().optional(),
    showExactAddressAfterBooking: z.boolean().nullable().optional(),
    entrance: z.string().max(120).nullable().optional(),
    floor: z.string().max(40).nullable().optional(),
    room: z.string().max(80).nullable().optional(),
    intercom: z.string().max(80).nullable().optional(),
    landmark: z.string().max(240).nullable().optional(),
    directions: z.string().max(2000).nullable().optional(),
    clientNote: z.string().max(2000).nullable().optional(),
    publicAddress: z
      .string()
      .max(600)
      .transform((s) => s.trim())
      .refine((s) => s.length >= 1, { message: 'Укажите адрес для клиентов' }),
    lat: z.number().finite().nullable().optional(),
    lng: z.number().finite().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hasLat = data.lat != null && Number.isFinite(data.lat);
    const hasLng = data.lng != null && Number.isFinite(data.lng);
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Укажите и широту, и долготу, либо обе координаты оставьте пустыми',
        path: ['lat'],
      });
    }
  });

const scheduleRulesBody = z.object({
  rules: z.array(scheduleItemSchema).min(1).max(56),
});

const certificatesBatchBody = z.object({
  items: z
    .array(
      z.object({
        title: z
          .string()
          .max(300)
          .transform((s) => s.trim())
          .refine((s) => s.length >= 2, { message: 'Название сертификата минимум 2 символа' }),
        issuer: z
          .string()
          .max(300)
          .optional()
          .default('')
          .transform((s) => s.trim())
          .transform((s) => (s.length > 0 ? s : null)),
        year: z.number().int().min(1950).max(2100).nullable().optional(),
        description: z
          .string()
          .max(1000)
          .nullable()
          .optional()
          .transform((s) => (s == null ? null : s.trim() || null)),
        imageUrl: z.union([z.literal(''), httpsImageUrl]).nullable().optional(),
      }),
    )
    .max(50),
});

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
  title: z
    .string()
    .max(300)
    .transform((s) => s.trim())
    .refine((s) => s.length >= 2, { message: 'Название сертификата минимум 2 символа' }),
  issuer: z
    .string()
    .max(300)
    .optional()
    .default('')
    .transform((s) => s.trim())
    .transform((s) => (s.length > 0 ? s : null)),
  year: z.number().int().min(1950).max(2100).nullable().optional(),
  description: z
    .string()
    .max(1000)
    .optional()
    .default('')
    .transform((s) => s.trim() || null),
  imageUrl: z.union([z.literal(''), httpsImageUrl]).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const certificatePatchBody = z.object({
  title: z.string().min(2).max(300).optional(),
  issuer: z.string().max(300).nullable().optional(),
  year: z.number().int().min(1950).max(2100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
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

const onboardingLocationSchema = z
  .object({
    visitType: z.enum(['studio', 'at_home']),
    city: z
      .string()
      .max(120)
      .transform((s) => s.trim())
      .refine((s) => s.length >= 1, { message: 'Укажите город' }),
    street: z
      .string()
      .max(200)
      .transform((s) => s.trim())
      .refine((s) => s.length >= 1, { message: 'Укажите улицу' }),
    building: z
      .string()
      .max(80)
      .transform((s) => s.trim())
      .refine((s) => s.length >= 1, { message: 'Укажите номер дома' }),
    buildingDetail: z.string().max(120).nullable().optional(),
    salonName: z.string().max(120).nullable().optional(),
    district: z.string().max(120).nullable().optional(),
    showExactAddressAfterBooking: z.boolean().nullable().optional(),
    entrance: z.string().max(120).nullable().optional(),
    floor: z.string().max(40).nullable().optional(),
    room: z.string().max(80).nullable().optional(),
    intercom: z.string().max(80).nullable().optional(),
    landmark: z.string().max(240).nullable().optional(),
    directions: z.string().max(2000).nullable().optional(),
    clientNote: z.string().max(2000).nullable().optional(),
    publicAddress: z
      .string()
      .max(600)
      .transform((s) => s.trim())
      .refine((s) => s.length >= 1, { message: 'Укажите адрес для клиентов' }),
    lat: z.number().finite().nullable().optional(),
    lng: z.number().finite().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hasLat = data.lat != null && Number.isFinite(data.lat);
    const hasLng = data.lng != null && Number.isFinite(data.lng);
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Укажите и широту, и долготу, либо обе координаты оставьте пустыми',
        path: ['lat'],
      });
    }
  });

const onboardingServiceSchema = z.object({
  title: z
    .string()
    .max(300)
    .transform((s) => s.trim())
    .refine((s) => s.length >= 2, { message: 'Название услуги минимум 2 символа' }),
  description: z.string().max(1000).optional().default('').transform((s) => s.trim()),
  durationMinutes: z.coerce.number().int().finite().min(5).max(24 * 60),
  priceAmount: z.coerce.number().finite().min(0).max(MAX_SERVICE_PRICE_AMOUNT),
  priceType: z.enum(['fixed', 'from']).optional(),
  sortOrder: z.coerce.number().int().finite().min(0).optional(),
});

const onboardingCertificateSchema = z.object({
  title: z
    .string()
    .max(300)
    .transform((s) => s.trim())
    .refine((s) => s.length >= 2, { message: 'Название сертификата минимум 2 символа' }),
  issuer: z
    .string()
    .max(300)
    .optional()
    .default('')
    .transform((s) => s.trim())
    .transform((s) => (s.length > 0 ? s : null)),
  year: z.number().int().min(1950).max(2100).nullable().optional(),
  description: z
    .string()
    .max(1000)
    .optional()
    .default('')
    .transform((s) => s.trim() || null),
  imageUrl: z.union([z.literal(''), httpsImageUrl]).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const onboardingBody = z
  .object({
    categoryCode: z
      .string()
      .max(80)
      .transform((s) => s.trim())
      .refine((s) => s.length >= 1, { message: 'Укажите категорию' }),
    name: z
      .string()
      .max(200)
      .transform((s) => s.trim())
      .refine((s) => s.length >= 2, { message: 'Имя минимум 2 символа' })
      .refine((s) => masterDisplayNamePassesQuality(s), {
        message:
          'Имя должно содержать буквы (не только цифры и знаки); букв должно быть больше, чем цифр; без одного символа подряд и шаблонных слов.',
      }),
    description: z.string().max(10_000).optional(),
    phone: optionalBelarusMobile,
    contact: z.string().max(500).nullable().optional(),
    contacts: z.array(masterContactItemSchema).max(12).optional().default([]),
    photoUrl: photoUrlNullable,
    location: onboardingLocationSchema,
    scheduleRules: z.array(onboardingScheduleItemSchema).min(1).max(56),
    services: z.array(onboardingServiceSchema).min(1).max(100),
    certificates: z.array(onboardingCertificateSchema).max(50).default([]),
    /** Без оплаты через онбординг принимается только basic. */
    masterPlan: z.literal('basic').optional(),
    proInterested: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    const list = data.contacts ?? [];
    const seen = new Map<string, number>();
    for (const c of list) {
      seen.set(c.type, (seen.get(c.type) ?? 0) + 1);
    }
    for (const [t, n] of seen) {
      if (t !== 'other' && n > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Каждый канал — не более одного раза',
          path: ['contacts'],
        });
        return;
      }
      if (t === 'other' && n > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Не более пяти полей «Другое»',
          path: ['contacts'],
        });
        return;
      }
    }
  });

mastersRouter.post(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const body = postMe.parse(req.body);
    const out = await upsertMyMasterProfile(req.user!.id, {
      displayName: body.displayName,
      bio: body.bio,
      phone: body.phone ?? null,
      contact: body.contact === '' ? null : body.contact,
      photoUrl: body.photoUrl === '' || body.photoUrl == null ? null : body.photoUrl,
      slug: body.slug === '' || body.slug == null ? null : body.slug,
      primaryCategoryCode:
        body.primaryCategoryCode === '' || body.primaryCategoryCode == null
          ? null
          : body.primaryCategoryCode,
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
      phone: body.phone ?? null,
      contact: body.contact === '' ? null : body.contact?.trim() ?? null,
      contacts: body.contacts?.length ? body.contacts : null,
      photoUrl: body.photoUrl === '' || body.photoUrl == null ? null : body.photoUrl,
      location: {
        visitType: body.location.visitType,
        city: body.location.city.trim(),
        street: body.location.street.trim(),
        building: body.location.building.trim(),
        buildingDetail: body.location.buildingDetail?.trim() || null,
        salonName: body.location.salonName?.trim() || null,
        district: body.location.district?.trim() || null,
        showExactAddressAfterBooking: body.location.showExactAddressAfterBooking ?? null,
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
        imageUrl: c.imageUrl === '' || c.imageUrl == null ? null : c.imageUrl,
        sortOrder: c.sortOrder,
      })),
      masterPlan: body.masterPlan,
      proInterested: body.proInterested,
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
      phone: body.phone ?? null,
      contact: body.contact === '' ? null : body.contact,
      contacts: body.contacts === undefined ? undefined : body.contacts?.length ? body.contacts : null,
      photoUrl: body.photoUrl === '' || body.photoUrl == null ? null : body.photoUrl,
      slug: body.slug === '' || body.slug == null ? null : body.slug,
      primaryCategoryCode:
        body.primaryCategoryCode === '' || body.primaryCategoryCode == null
          ? null
          : body.primaryCategoryCode,
      publicationStatus: body.publicationStatus,
      globalBufferMinutes: body.globalBufferMinutes,
    });
    res.json(out);
  }),
);

mastersRouter.post(
  '/me/photo',
  authMiddleware,
  requireMasterDbAccess,
  masterImageUpload.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file?.buffer?.length) {
      throw ApiError.badRequest('Missing image file (multipart field: file)', 'MISSING_FILE');
    }
    const imageUrl = await uploadMasterHeroPhoto(req.user!.id, file.buffer, file.mimetype);
    res.json({ imageUrl });
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
      salonName: body.salonName,
      district: body.district,
      showExactAddressAfterBooking: body.showExactAddressAfterBooking,
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
  '/me/certificates/upload',
  authMiddleware,
  requireMasterDbAccess,
  masterImageUpload.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file?.buffer?.length) {
      throw ApiError.badRequest('Missing image file (multipart field: file)', 'MISSING_FILE');
    }
    const imageUrl = await uploadMasterCertificateImage(req.user!.id, file.buffer, file.mimetype);
    res.json({ imageUrl });
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
      issuer?: string | null;
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
  '/me/portfolio/upload',
  authMiddleware,
  requireMasterDbAccess,
  masterImageUpload.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file?.buffer?.length) {
      throw ApiError.badRequest('Missing image file (multipart field: file)', 'MISSING_FILE');
    }
    const imageUrl = await uploadMasterPortfolioImage(req.user!.id, file.buffer, file.mimetype);
    res.json({ imageUrl });
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
mastersRouter.use('/me/bundles', authMiddleware, requireMasterDbAccess, masterBundlesRouter);
mastersRouter.use('/me/promotions', authMiddleware, requireMasterDbAccess, masterPromotionsRouter);
mastersRouter.use(
  '/me/smart-promotion-suggestions',
  authMiddleware,
  requireMasterDbAccess,
  smartPromotionSuggestionsRouter,
);
mastersRouter.use('/me/slots', authMiddleware, requireMasterDbAccess, masterSlotsRouter);
mastersRouter.use('/me/appointments', authMiddleware, requireMasterDbAccess, masterAppointmentsRouter);
mastersRouter.use('/me/overview', masterOverviewRouter);

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
