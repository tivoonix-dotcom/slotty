import { apiFetch } from '../../../shared/api/backendClient';
import type { MasterPublicPaymentDto } from '../../../shared/payments/paymentMethodCodes';
import type { MasterVisitType } from '../../profile/model/masterLocation';
import type { MasterLocation } from '../../profile/model/masterLocation';
import type { DemoMasterProfile, DemoMasterService, DemoReview } from '../../services/model/demoMasters';
import { normalizeMasterCareerItemType } from '../../profile/lib/demoMasterStorage';
import type { MasterDraftCareerItem } from '../../profile/lib/demoMasterStorage';
import { masterListingPortraitUrl } from '../lib/masterListingPortrait';
import { resolveFilledContacts } from '../../master-onboarding/model/masterContacts';

async function readApiError(res: Response): Promise<string> {
  const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return j?.error?.message ?? `Ошибка ${res.status}`;
}

export type MasterPublicLocationDto = {
  id: string;
  visitType: string;
  city: string;
  street: string;
  building: string;
  buildingDetail?: string | null;
  salonName?: string | null;
  entrance?: string | null;
  floor?: string | null;
  room?: string | null;
  intercom?: string | null;
  landmark?: string | null;
  directions?: string | null;
  clientNote?: string | null;
  publicAddress: string;
  isPrimary: boolean;
  showExactAddressAfterBooking?: boolean;
  lat?: number | null;
  lng?: number | null;
  distanceLat?: number | null;
  distanceLng?: number | null;
};

export type MasterPublicDetailDto = {
  master: {
    masterId: string;
    displayName: string;
    bio: string;
    photoUrl: string | null;
    coverUrl?: string | null;
    portfolioCoverItemId?: string | null;
    slug: string | null;
    phone: string | null;
    contact: string | null;
    isVerified: boolean;
    isProEntitled?: boolean;
    completedBookingsCount?: number;
    rating: number;
    reviewsCount: number;
    category: { code: string; name: string } | null;
  };
  services: {
    id: string;
    title: string;
    description: string;
    durationMinutes: number;
    price: number;
    priceType: string;
    isActive: boolean;
    sortOrder: number;
    coverImageUrl?: string | null;
    coverFocalX?: number;
    coverFocalY?: number;
  }[];
  locations: MasterPublicLocationDto[];
  bookingRules: {
    bookingRules: string | null;
    cancellationPolicy: string | null;
    paymentNote: string | null;
    paymentMethods?: string[];
    clientPreview?: string[];
  } | null;
  payment: MasterPublicPaymentDto | null;
  certificates: {
    id: string;
    title: string;
    issuer: string;
    year: number | null;
    imageUrl: string | null;
    description: string | null;
    sortOrder: number;
  }[];
  portfolio: {
    id: string;
    imageUrl: string;
    title: string | null;
    description: string | null;
    sortOrder: number;
  }[];
  career: {
    id: string;
    type: string;
    title: string;
    place: string;
    startYear: number | null;
    endYear: number | null;
    description: string | null;
    sortOrder: number;
  }[];
  reviews: {
    id: string;
    rating: number;
    body: string;
    createdAt: string | Date;
    clientId: string;
    clientName: string | null;
    clientAvatarUrl?: string | null;
    masterReply?: string | null;
    masterReplyAt?: string | null;
  }[];
};

export async function fetchMasterPublicDetail(masterId: string): Promise<MasterPublicDetailDto> {
  const res = await apiFetch(`/api/masters/${encodeURIComponent(masterId)}`, { skipAuth: true });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as MasterPublicDetailDto;
}

function locationDtoToModel(loc: MasterPublicLocationDto | undefined): MasterLocation {
  if (!loc) {
    return {
      visitType: 'studio',
      city: '',
      street: '',
      building: '',
    };
  }
  const visit = (loc.visitType === 'at_home' ? 'at_home' : 'studio') as MasterVisitType;
  const base: MasterLocation = {
    visitType: visit,
    city: loc.city?.trim() || '',
    street: loc.street?.trim() || loc.publicAddress?.trim() || '',
    building: loc.building?.trim() || '',
    showExactAddressAfterBooking: visit === 'at_home' ? loc.showExactAddressAfterBooking !== false : false,
  };
  if (typeof loc.lat === 'number' && Number.isFinite(loc.lat) && typeof loc.lng === 'number' && Number.isFinite(loc.lng)) {
    base.lat = loc.lat;
    base.lng = loc.lng;
  }
  if (typeof loc.distanceLat === 'number' && Number.isFinite(loc.distanceLat)) {
    base.distanceLat = loc.distanceLat;
  }
  if (typeof loc.distanceLng === 'number' && Number.isFinite(loc.distanceLng)) {
    base.distanceLng = loc.distanceLng;
  }
  const salon = loc.salonName?.trim();
  if (salon) base.salonName = salon;
  const bd = loc.buildingDetail?.trim();
  if (bd) base.buildingDetail = bd;
  const e = loc.entrance?.trim();
  const f = loc.floor?.trim();
  const r = loc.room?.trim();
  const i = loc.intercom?.trim();
  const l = loc.landmark?.trim();
  const d = loc.directions?.trim();
  const c = loc.clientNote?.trim();
  if (e) base.entrance = e;
  if (f) base.floor = f;
  if (r) base.room = r;
  if (i) base.intercom = i;
  if (l) base.landmark = l;
  if (d) base.directions = d;
  if (c) base.clientNote = c;
  return base;
}

function formatReviewDate(createdAt: string | Date): string {
  try {
    const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

/** Публичная карточка мастера в форме, которую ожидает MasterProfilePage (демо-типы). */
export function mapMasterDetailToDemoProfile(detail: MasterPublicDetailDto): DemoMasterProfile {
  const { master } = detail;
  const primaryLoc =
    detail.locations.find((l) => l.isPrimary) ?? detail.locations[0] ?? undefined;
  const location = locationDtoToModel(primaryLoc);

  const services: DemoMasterService[] = detail.services.map((s) => ({
    id: s.id,
    title: s.title,
    duration: s.durationMinutes,
    price: s.price,
    description: s.description ?? '',
    priceType: s.priceType === 'from' ? 'from' : 'fixed',
    coverImageUrl: s.coverImageUrl ?? undefined,
    coverFocalX: s.coverFocalX,
    coverFocalY: s.coverFocalY,
  }));

  const availableSlotsByServiceId = Object.fromEntries(services.map((s) => [s.id, []])) as DemoMasterProfile['availableSlotsByServiceId'];

  const reviews: DemoReview[] = detail.reviews.map((r) => ({
    id: r.id,
    author: r.clientName?.trim() || 'Клиент',
    authorAvatarUrl: r.clientAvatarUrl ?? null,
    rating: typeof r.rating === 'number' ? r.rating : Number(r.rating),
    date: formatReviewDate(r.createdAt),
    text: r.body ?? '',
    masterReply: r.masterReply?.trim() || null,
    masterReplyAt: r.masterReplyAt ?? null,
  }));

  const categoryLabel = master.category?.name?.trim() || master.category?.code || 'Мастер';
  const categoryCode = master.category?.code?.trim() || undefined;

  return {
    masterId: master.masterId,
    masterName: master.displayName.trim() || 'Мастер',
    category: categoryLabel,
    categoryCode,
    rating: master.rating,
    reviewsCount: master.reviewsCount,
    location,
    photoUrl: masterListingPortraitUrl(master.photoUrl),
    bio: master.bio?.trim() ?? '',
    phone: master.phone?.trim() || undefined,
    contact: master.contact?.trim() || undefined,
    isVerified: Boolean(master.isVerified),
    isProEntitled: master.isProEntitled === true,
    completedBookingsCount:
      master.completedBookingsCount != null && Number.isFinite(master.completedBookingsCount)
        ? Math.max(0, Math.round(master.completedBookingsCount))
        : undefined,
    contacts: resolveFilledContacts({ contact: master.contact }),
    services,
    availableSlotsByServiceId,
    reviews,
  };
}

export function mapCareerToDraftItems(
  career: MasterPublicDetailDto['career'],
): MasterDraftCareerItem[] {
  return career.map((row) => ({
    id: row.id,
    type: normalizeMasterCareerItemType(row.type),
    title: row.title,
    place: row.place,
    startYear: row.startYear != null ? String(row.startYear) : undefined,
    endYear: row.endYear != null ? String(row.endYear) : undefined,
    description: row.description ?? undefined,
  }));
}

export function mapCertificatesFromDetail(detail: MasterPublicDetailDto) {
  return detail.certificates.map((c) => ({
    id: c.id,
    title: c.title,
    issuer: c.issuer,
    year: c.year != null ? String(c.year) : undefined,
    imageUrl: c.imageUrl ?? undefined,
    description: c.description ?? undefined,
  }));
}

export function mapPortfolioFromDetail(
  detail: MasterPublicDetailDto,
  options?: { excludeCoverItemId?: string | null },
) {
  const excludeId = options?.excludeCoverItemId?.trim();
  return detail.portfolio
    .filter((p) => !excludeId || p.id !== excludeId)
    .map((p) => ({
      id: p.id,
      title: p.title ?? undefined,
      imageUrl: p.imageUrl,
      description: p.description ?? undefined,
    }));
}
