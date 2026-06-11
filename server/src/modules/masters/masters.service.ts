import { query, withPoolClient } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { syncUserProfileFromMasterCabinet } from '../profiles/profiles.service.js';
import { listMyServices } from '../services/services.service.js';
import { listMyScheduleRules } from './masterOnboarding.service.js';
import { contactsToLegacyContactLine, type MasterContactPayload } from './masterContactsCodec.js';
import { decodePaymentNote, listMasterPaymentMethodNames } from './masterTrustProfile.service.js';
import { getPublicMasterBookingRulesSummary } from './masterBookingRulesStructured.service.js';
import { sanitizeMasterLocationForViewer } from '../../lib/sanitizeMasterLocation.js';
import { resolveClientDisplayIdentity } from '../../lib/clientDisplayIdentity.js';

const MASTER_PROFILE_COVER_TITLE = 'Обложка профиля';

async function resolveMasterPublicCoverUrl(
  masterId: string,
  portfolioCoverItemId: string | null,
): Promise<string | null> {
  if (portfolioCoverItemId?.trim()) {
    const r = await query<{ image_url: string | null }>(
      `select image_url from public.master_portfolio_items
        where id = $1 and master_id = $2
        limit 1`,
      [portfolioCoverItemId.trim(), masterId],
    );
    const url = r.rows[0]?.image_url?.trim();
    if (url) return url;
  }

  const byTitle = await query<{ image_url: string | null }>(
    `select image_url from public.master_portfolio_items
      where master_id = $1 and trim(coalesce(title, '')) = $2
      order by sort_order asc, created_at asc
      limit 1`,
    [masterId, MASTER_PROFILE_COVER_TITLE],
  );
  return byTitle.rows[0]?.image_url?.trim() || null;
}

function num(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type PublicMasterLocationRow = {
  id: string;
  visit_type: string;
  city: string;
  street: string;
  building: string;
  building_detail: string | null;
  salon_name: string | null;
  entrance: string | null;
  floor: string | null;
  room: string | null;
  intercom: string | null;
  landmark: string | null;
  directions: string | null;
  client_note: string | null;
  public_address: string;
  is_primary: boolean;
  lat: number | null;
  lng: number | null;
  show_exact_address_after_booking: boolean;
};

function mapPublicMasterLocation(row: PublicMasterLocationRow) {
  return sanitizeMasterLocationForViewer(
    {
      id: row.id,
      visitType: row.visit_type,
      city: row.city,
      street: row.street,
      building: row.building,
      buildingDetail: row.building_detail,
      salonName: row.salon_name,
      entrance: row.entrance,
      floor: row.floor,
      room: row.room,
      intercom: row.intercom,
      landmark: row.landmark,
      directions: row.directions,
      clientNote: row.client_note,
      publicAddress: row.public_address,
      isPrimary: row.is_primary,
      lat: row.lat,
      lng: row.lng,
      showExactAddressAfterBooking: row.show_exact_address_after_booking,
    },
    { isPublicCatalog: false, isPublicMasterProfile: true },
  );
}

export async function listPublishedMasters(filters: { category?: string; search?: string; limit: number }) {
  const params: unknown[] = [];
  let i = 1;
  let where = `mp.publication_status = 'published'
    and exists (
      select 1 from public.profiles pr
      where pr.id = mp.master_id
        and pr.account_status not in ('blocked', 'deleted')
        and (
          pr.account_status = 'active'
          or (
            pr.account_status = 'restricted'
            and pr.access_restricted_until is not null
            and pr.access_restricted_until <= now()
          )
        )
    )`;
  if (filters.category) {
    where += ` and sc.code = $${i++}`;
    params.push(filters.category);
  }
  if (filters.search?.trim()) {
    where += ` and mp.display_name ilike $${i++}`;
    const s = filters.search.trim().replace(/[%_]/g, '');
    params.push(`%${s}%`);
  }
  params.push(filters.limit);
  const limIdx = i;
  const sql = `
    select
      mp.master_id,
      mp.display_name,
      mp.bio,
      mp.photo_url,
      mp.slug,
      mp.rating_avg::text,
      mp.reviews_count,
      sc.code as category_code,
      sc.name as category_name,
      ml.public_address,
      ml.city,
      ml.lat::double precision as location_lat,
      ml.lng::double precision as location_lng,
      ps.id as primary_service_id,
      ps.title as primary_service_title,
      ps.price_amount::text as primary_service_price,
      (
        select min(s.starts_at)
        from public.master_availability_slots s
        where s.master_id = mp.master_id
          and s.status = 'available'
          and s.starts_at > now()
      ) as next_slot_starts_at,
      (
        select count(*)::int
        from public.appointments a
        where a.master_id = mp.master_id
          and a.status = 'completed'
      ) as completed_bookings_count
    from public.master_profiles mp
    left join public.service_categories sc on sc.id = mp.primary_category_id
    left join public.master_locations ml on ml.master_id = mp.master_id and ml.is_primary = true
    left join lateral (
      select ms.id, ms.title, ms.price_amount
      from public.master_services ms
      where ms.master_id = mp.master_id and ms.is_active = true
      order by ms.sort_order asc, ms.price_amount asc nulls last, ms.title asc
      limit 1
    ) ps on true
    where ${where}
    order by mp.rating_avg desc nulls last, mp.display_name asc
    limit $${limIdx}
  `;
  const r = await query<{
    master_id: string;
    display_name: string;
    bio: string;
    photo_url: string | null;
    slug: string | null;
    rating_avg: string;
    reviews_count: number;
    category_code: string | null;
    category_name: string | null;
    public_address: string | null;
    city: string | null;
    location_lat: number | string | null;
    location_lng: number | string | null;
    primary_service_id: string | null;
    primary_service_title: string | null;
    primary_service_price: string | null;
    next_slot_starts_at: Date | string | null;
    completed_bookings_count: number;
  }>(sql, params);

  return r.rows.map((row) => {
    const lat = num(row.location_lat);
    const lng = num(row.location_lng);
    const hasCoords = lat != null && lng != null;
    const location =
      row.public_address
        ? { publicAddress: row.public_address, city: row.city, lat, lng }
        : row.city
          ? { publicAddress: row.city, city: row.city, lat, lng }
          : hasCoords
            ? { publicAddress: 'Точка на карте', city: row.city, lat, lng }
            : null;
    return {
      masterId: row.master_id,
      displayName: row.display_name,
      bio: row.bio,
      photoUrl: row.photo_url,
      slug: row.slug,
      rating: num(row.rating_avg) ?? 0,
      reviewsCount: row.reviews_count,
      category: row.category_code
        ? { code: row.category_code, name: row.category_name ?? row.category_code }
        : null,
      location,
      minServicePrice: num(row.primary_service_price),
      primaryServiceId: row.primary_service_id,
      primaryServiceName: row.primary_service_title,
      nextSlotStartsAt:
        row.next_slot_starts_at != null
          ? new Date(row.next_slot_starts_at as Date).toISOString()
          : null,
      completedBookingsCount: Number(row.completed_bookings_count ?? 0),
    };
  });
}

type ServiceRow = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  price_amount: string;
  price_type: string;
  is_active: boolean;
  sort_order: number;
  cover_image_url: string | null;
  cover_image_focal_x: number;
  cover_image_focal_y: number;
};

function mapService(row: ServiceRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    price: num(row.price_amount) ?? 0,
    priceType: row.price_type,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    coverImageUrl: row.cover_image_url,
    coverFocalX: row.cover_image_focal_x,
    coverFocalY: row.cover_image_focal_y,
  };
}

type BookingRulesRow = {
  booking_rules: string | null;
  cancellation_policy: string | null;
  payment_note: string | null;
};

type CertificateRow = {
  id: string;
  title: string;
  issuer: string;
  year: number | null;
  image_url: string | null;
  description: string | null;
  sort_order: number;
};

type PortfolioRow = {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  sort_order: number;
};

type CareerRow = {
  id: string;
  type: string;
  title: string;
  place: string;
  start_year: number | null;
  end_year: number | null;
  description: string | null;
  sort_order: number;
};

type ReviewRow = {
  id: string;
  rating: number;
  body: string;
  created_at: Date | string;
  client_id: string;
  client_name: string | null;
  client_phone: string | null;
  client_telegram_username: string | null;
  avatar_url: string | null;
  master_display_name: string | null;
  master_photo_url: string | null;
  client_name_snapshot: string | null;
  client_phone_snapshot: string | null;
  master_reply: string | null;
  master_reply_at: Date | string | null;
};

export async function getMasterDetail(masterId: string) {
  const { stabilizePortraitForProfile } = await import('../../lib/stabilizePortraitForProfile.js');
  await stabilizePortraitForProfile(masterId);

  const mp = await query<{
    master_id: string;
    display_name: string;
    bio: string;
    photo_url: string | null;
    slug: string | null;
    rating_avg: string;
    reviews_count: number;
    publication_status: string;
    primary_category_id: string | null;
    phone: string | null;
    contact: string | null;
    is_verified: boolean;
    portfolio_cover_item_id: string | null;
  }>(
    `select master_id, display_name, bio, photo_url, slug, rating_avg::text, reviews_count,
            publication_status::text, primary_category_id, phone, contact, is_verified,
            portfolio_cover_item_id
       from public.master_profiles
      where master_id = $1`,
    [masterId],
  );
  const master = mp.rows[0];
  if (!master || master.publication_status !== 'published') {
    throw ApiError.notFound('Master not found');
  }
  const account = await query<{ account_status: string }>(
    `select account_status::text from public.profiles where id = $1`,
    [masterId],
  );
  const st = account.rows[0]?.account_status;
  if (!st || st === 'blocked' || st === 'deleted' || st === 'restricted') {
    throw ApiError.notFound('Master not found');
  }

  const {
    category,
    services,
    locations,
    bookingRules,
    certificates,
    portfolio,
    career,
    reviews,
    statsRow,
  } = await withPoolClient(async (client) => {
    const category = master.primary_category_id
      ? await client.query<{ code: string; name: string }>(
          `select code, name from public.service_categories where id = $1`,
          [master.primary_category_id],
        )
      : { rows: [] as { code: string; name: string }[] };
    const services = await client.query(
      `select id, title, description, duration_minutes, price_amount::text, price_type::text, is_active, sort_order,
              cover_image_url, cover_image_focal_x, cover_image_focal_y
         from public.master_services
        where master_id = $1 and is_active = true and admin_hidden_at is null
        order by sort_order asc, title asc`,
      [masterId],
    );
    const locations = await client.query(
      `select id, visit_type::text, city, street, building, building_detail, salon_name, entrance, floor, room,
              intercom, landmark, directions, client_note, public_address, is_primary, lat, lng,
              show_exact_address_after_booking
         from public.master_locations
        where master_id = $1
        order by is_primary desc, created_at asc`,
      [masterId],
    );
    const bookingRules = await client.query(
      `select booking_rules, cancellation_policy, payment_note
         from public.master_booking_rules
        where master_id = $1`,
      [masterId],
    );
    const certificates = await client.query(
      `select id, title, issuer, year, image_url, description, sort_order
         from public.master_certificates
        where master_id = $1
        order by sort_order asc, created_at asc`,
      [masterId],
    );
    const portfolio = await client.query(
      `select id, image_url, title, description, sort_order
         from public.master_portfolio_items
        where master_id = $1
        order by sort_order asc, created_at asc`,
      [masterId],
    );
    const career = await client.query(
      `select id, type::text, title, place, start_year, end_year, description, sort_order
         from public.master_career_items
        where master_id = $1
        order by sort_order asc, created_at asc`,
      [masterId],
    );
    const reviews = await client.query(
      `select r.id, r.rating, r.body, r.created_at, r.client_id,
              r.master_reply, r.master_reply_at,
              p.full_name as client_name, p.phone as client_phone, p.telegram_username as client_telegram_username,
              p.avatar_url,
              mp.display_name as master_display_name, mp.photo_url as master_photo_url,
              a.client_name_snapshot, a.client_phone_snapshot
         from public.reviews r
         join public.appointments a on a.id = r.appointment_id
         join public.profiles p on p.id = r.client_id
         left join public.master_profiles mp on mp.master_id = r.client_id
        where r.master_id = $1 and r.status = 'published'
        order by r.created_at desc
        limit 50`,
      [masterId],
    );
    const statsRow = await client.query<{ completed_bookings_count: number }>(
      `select count(*)::int as completed_bookings_count
         from public.appointments a
        where a.master_id = $1 and a.status = 'completed'`,
      [masterId],
    );
    return { category, services, locations, bookingRules, certificates, portfolio, career, reviews, statsRow };
  });

  const cat = category.rows[0];

  const br = bookingRules.rows[0] as BookingRulesRow | undefined;
  const paymentMethodsPublic = await listMasterPaymentMethodNames(masterId);
  const paymentDecodedPublic = br
    ? decodePaymentNote(br.payment_note)
    : { paymentNote: '', paymentMethods: [] as string[] };
  const paymentNotePublic = paymentDecodedPublic.paymentNote || null;
  const paymentMethodsResolved = paymentMethodsPublic.length
    ? paymentMethodsPublic
    : paymentDecodedPublic.paymentMethods;

  const rulesSummary = await getPublicMasterBookingRulesSummary(masterId);
  const { getPublicMasterPayment } = await import('./masterPaymentSettings.service.js');
  const paymentPublic = await getPublicMasterPayment(masterId);

  const locRows = locations.rows as PublicMasterLocationRow[];
  const coverUrl = await resolveMasterPublicCoverUrl(master.master_id, master.portfolio_cover_item_id);
  const coverId = master.portfolio_cover_item_id?.trim() || null;
  const completedBookingsCount = Number(statsRow.rows[0]?.completed_bookings_count ?? 0);
  let isProEntitled = false;
  try {
    const { getMasterEntitlements } = await import('../billing/entitlements.service.js');
    const ent = await getMasterEntitlements(masterId);
    isProEntitled = ent.isProEntitled;
  } catch {
    isProEntitled = false;
  }

  return {
    master: {
      masterId: master.master_id,
      displayName: master.display_name,
      bio: master.bio,
      photoUrl: master.photo_url,
      coverUrl,
      portfolioCoverItemId: coverId,
      slug: master.slug,
      phone: master.phone,
      contact: master.contact,
      rating: num(master.rating_avg) ?? 0,
      reviewsCount: master.reviews_count,
      isVerified: Boolean(master.is_verified),
      isProEntitled,
      completedBookingsCount,
      category: cat ? { code: cat.code, name: cat.name } : null,
    },
    services: (services.rows as ServiceRow[]).map(mapService),
    locations: locRows.map((row) => mapPublicMasterLocation(row)),
    bookingRules: br || rulesSummary.clientPreview.length
      ? {
          bookingRules: br?.booking_rules ?? null,
          cancellationPolicy: br?.cancellation_policy ?? null,
          paymentNote: paymentNotePublic,
          paymentMethods: paymentMethodsResolved,
          clientPreview: rulesSummary.clientPreview,
        }
      : null,
    payment: paymentPublic,
    certificates: (certificates.rows as CertificateRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      issuer: row.issuer,
      year: row.year,
      imageUrl: row.image_url,
      description: row.description,
      sortOrder: row.sort_order,
    })),
    portfolio: (portfolio.rows as PortfolioRow[]).map((row) => ({
      id: row.id,
      imageUrl: row.image_url,
      title: row.title,
      description: row.description,
      sortOrder: row.sort_order,
    })),
    career: (career.rows as CareerRow[]).map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      place: row.place,
      startYear: row.start_year,
      endYear: row.end_year,
      description: row.description,
      sortOrder: row.sort_order,
    })),
    reviews: (reviews.rows as ReviewRow[]).map((row) => {
      const identity = resolveClientDisplayIdentity({
        masterDisplayName: row.master_display_name,
        masterPhotoUrl: row.master_photo_url,
        profileFullName: row.client_name,
        profileAvatarUrl: row.avatar_url,
        nameSnapshot: row.client_name_snapshot,
        phone: row.client_phone,
        phoneSnapshot: row.client_phone_snapshot,
        telegramUsername: row.client_telegram_username,
      });
      return {
        id: row.id,
        rating: row.rating,
        body: row.body,
        createdAt: row.created_at,
        clientId: row.client_id,
        clientName: identity.displayName,
        clientAvatarUrl: identity.avatarUrl,
        masterReply: row.master_reply?.trim() || null,
        masterReplyAt: row.master_reply_at
          ? row.master_reply_at instanceof Date
            ? row.master_reply_at.toISOString()
            : String(row.master_reply_at)
          : null,
      };
    }),
  };
}

export async function upsertMyMasterProfile(
  profileId: string,
  body: {
    displayName: string;
    bio?: string;
    phone?: string | null;
    contact?: string | null;
    photoUrl?: string | null;
    slug?: string | null;
    primaryCategoryCode?: string | null;
  },
) {
  await query(`update public.profiles set role = 'master', updated_at = now() where id = $1`, [profileId]);

  let primaryCategoryId: string | null = null;
  if (body.primaryCategoryCode) {
    const c = await query<{ id: string }>(
      `select id from public.service_categories where code = $1 and is_active = true`,
      [body.primaryCategoryCode],
    );
    primaryCategoryId = c.rows[0]?.id ?? null;
  }

  await query(
    `insert into public.master_profiles (
       master_id, display_name, slug, primary_category_id, bio, phone, contact, photo_url, publication_status
     ) values ($1, $2, $3, $4, coalesce($5, ''), $6, $7, $8, 'draft')
     on conflict (master_id) do update set
       display_name = excluded.display_name,
       slug = coalesce(excluded.slug, public.master_profiles.slug),
       primary_category_id = coalesce(excluded.primary_category_id, public.master_profiles.primary_category_id),
       bio = excluded.bio,
       phone = excluded.phone,
       contact = excluded.contact,
       photo_url = excluded.photo_url,
       updated_at = now()`,
    [
      profileId,
      body.displayName,
      body.slug ?? null,
      primaryCategoryId,
      body.bio ?? '',
      body.phone ?? null,
      body.contact ?? null,
      body.photoUrl ?? null,
    ],
  );

  return getMyMasterProfile(profileId);
}

export async function getMyMasterProfile(profileId: string) {
  const { backfillMasterProfileMediaFromUserProfile, fetchUserProfileMediaFallback } =
    await import('../profiles/profiles.service.js');
  const { stabilizePortraitForProfile } = await import('../../lib/stabilizePortraitForProfile.js');

  await stabilizePortraitForProfile(profileId);

  const r = await query(
    `select master_id, display_name, slug, primary_category_id, bio, phone, contact, contacts, photo_url,
            portfolio_cover_item_id,
            publication_status::text, is_profile_active, rating_avg::text, reviews_count, global_buffer_minutes,
            created_at
       from public.master_profiles
      where master_id = $1`,
    [profileId],
  );
  const row = r.rows[0] as
    | {
        master_id: string;
        display_name: string;
        slug: string | null;
        primary_category_id: string | null;
        bio: string;
        phone: string | null;
        contact: string | null;
        contacts: unknown | null;
        photo_url: string | null;
        portfolio_cover_item_id: string | null;
        publication_status: string;
        is_profile_active: boolean;
        rating_avg: string;
        reviews_count: number;
        global_buffer_minutes: number;
        created_at: Date | string;
      }
    | undefined;
  if (!row) {
    throw ApiError.notFound('Master profile not found');
  }

  let portfolioCoverItemId = row.portfolio_cover_item_id;
  if (!portfolioCoverItemId) {
    const inferred = await query<{ id: string }>(
      `select id from public.master_portfolio_items
        where master_id = $1 and trim(coalesce(title, '')) = $2
        order by sort_order asc, created_at asc
        limit 1`,
      [profileId, 'Обложка профиля'],
    );
    const inferredId = inferred.rows[0]?.id;
    if (inferredId) {
      await query(
        `update public.master_profiles set portfolio_cover_item_id = $2, updated_at = now() where master_id = $1`,
        [profileId, inferredId],
      );
      portfolioCoverItemId = inferredId;
    }
  }

  const needsPhoto = !row.photo_url?.trim();
  const needsPhone = !row.phone?.trim();
  if (needsPhoto || needsPhone) {
    await backfillMasterProfileMediaFromUserProfile(profileId);
  }
  const fallback = needsPhoto || needsPhone ? await fetchUserProfileMediaFallback(profileId) : null;

  const phone = row.phone?.trim() || fallback?.phone || null;
  const photoUrl = row.photo_url?.trim() || fallback?.avatarUrl || null;

  return {
    masterId: row.master_id,
    displayName: row.display_name,
    slug: row.slug,
    primaryCategoryId: row.primary_category_id,
    bio: row.bio,
    phone,
    contact: row.contact,
    contacts: row.contacts ?? null,
    photoUrl,
    portfolioCoverItemId,
    publicationStatus: row.publication_status,
    isProfileActive: row.is_profile_active,
    rating: num(row.rating_avg) ?? 0,
    reviewsCount: row.reviews_count,
    globalBufferMinutes: row.global_buffer_minutes,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function patchMyMasterProfile(
  profileId: string,
  patch: {
    displayName?: string;
    bio?: string;
    phone?: string | null;
    contact?: string | null;
    contacts?: MasterContactPayload[] | null;
    photoUrl?: string | null;
    slug?: string | null;
    primaryCategoryCode?: string | null;
    publicationStatus?: 'draft' | 'published' | 'hidden' | 'blocked' | 'paused';
    globalBufferMinutes?: number;
    portfolioCoverItemId?: string | null;
  },
) {
  const exists = await query<{ publication_status: string }>(
    `select publication_status::text from public.master_profiles where master_id = $1`,
    [profileId],
  );
  const currentRow = exists.rows[0];
  if (!currentRow) {
    throw ApiError.notFound('Master profile not found');
  }

  if (patch.publicationStatus !== undefined) {
    const next = patch.publicationStatus;
    const current = currentRow.publication_status;

    if (next === 'blocked') {
      throw ApiError.forbidden('Статус «заблокирован» назначает только администратор', 'FORBIDDEN_STATUS');
    }
    if (current === 'blocked') {
      throw ApiError.forbidden(
        'Профиль заблокирован администратором. Обратитесь в поддержку.',
        'PROFILE_BLOCKED',
      );
    }
  }

  let primaryCategoryId: string | null | undefined;
  if (patch.primaryCategoryCode !== undefined) {
    const currentRes = await query<{ code: string | null }>(
      `select c.code
         from public.master_profiles mp
         left join public.service_categories c on c.id = mp.primary_category_id
        where mp.master_id = $1`,
      [profileId],
    );
    const currentCode = currentRes.rows[0]?.code ?? null;
    const nextCode = patch.primaryCategoryCode;
    const categoryChanging = currentCode !== nextCode;

    if (categoryChanging) {
      const { buildCategoryChangePolicy } = await import('./categoryChangePolicy.service.js');
      const policy = await buildCategoryChangePolicy(profileId);
      if (!policy.canChangeDirectly) {
        throw ApiError.badRequest(
          'Для активного профиля смена категории проходит через заявку',
          'category_change_requires_request',
        );
      }
      if (policy.hasActiveRequest) {
        throw ApiError.badRequest('У вас уже есть заявка на смену категории', 'active_request_exists');
      }
    }

    if (categoryChanging) {
      if (nextCode === null) {
        primaryCategoryId = null;
      } else {
        const c = await query<{ id: string }>(
          `select id from public.service_categories where code = $1 and is_active = true`,
          [nextCode],
        );
        primaryCategoryId = c.rows[0]?.id ?? null;
      }
    }
  }

  const fields: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  const push = (sql: string, v: unknown) => {
    fields.push(`${sql} = $${i++}`);
    vals.push(v);
  };
  if (patch.displayName !== undefined) push('display_name', patch.displayName);
  if (patch.bio !== undefined) push('bio', patch.bio);
  if (patch.phone !== undefined) push('phone', patch.phone);
  if (patch.contacts !== undefined) {
    const json = patch.contacts?.length ? JSON.stringify(patch.contacts) : null;
    push('contacts', json);
    push('contact', contactsToLegacyContactLine(patch.contacts));
  } else if (patch.contact !== undefined) {
    push('contact', patch.contact);
  }
  if (patch.photoUrl !== undefined) push('photo_url', patch.photoUrl);
  if (patch.slug !== undefined) push('slug', patch.slug);
  if (primaryCategoryId !== undefined) push('primary_category_id', primaryCategoryId);
  if (patch.publicationStatus !== undefined) {
    push('publication_status', patch.publicationStatus);
    fields.push(`is_profile_active = ${patch.publicationStatus === 'published'}`);
    if (patch.publicationStatus === 'published') {
      fields.push(`published_at = coalesce(published_at, now())`);
    }
    if (patch.publicationStatus === 'hidden' || patch.publicationStatus === 'paused') {
      fields.push('admin_hidden_reason = null');
    }
  }
  if (patch.globalBufferMinutes !== undefined) push('global_buffer_minutes', patch.globalBufferMinutes);
  if (patch.portfolioCoverItemId !== undefined) {
    if (patch.portfolioCoverItemId === null) {
      push('portfolio_cover_item_id', null);
    } else {
      const owned = await query<{ id: string }>(
        `select id from public.master_portfolio_items where id = $1 and master_id = $2`,
        [patch.portfolioCoverItemId, profileId],
      );
      if (!owned.rows[0]) {
        throw ApiError.badRequest('Фото обложки не найдено в портфолио', 'portfolio_cover_not_found');
      }
      push('portfolio_cover_item_id', patch.portfolioCoverItemId);
    }
  }

  if (fields.length) {
    vals.push(profileId);
    await query(
      `update public.master_profiles set ${fields.join(', ')}, updated_at = now() where master_id = $${i}`,
      vals,
    );
  }

  const syncPatch: {
    full_name?: string | null;
    phone?: string | null;
  } = {};
  if (patch.displayName !== undefined) syncPatch.full_name = patch.displayName;
  if (patch.phone !== undefined) syncPatch.phone = patch.phone;
  if (Object.keys(syncPatch).length > 0) {
    await syncUserProfileFromMasterCabinet(profileId, syncPatch);
  }

  return getMyMasterProfile(profileId);
}

type PrimaryLocationRow = {
  id: string;
  visit_type: string;
  city: string;
  street: string;
  building: string;
  building_detail: string | null;
  salon_name: string | null;
  district: string | null;
  entrance: string | null;
  floor: string | null;
  room: string | null;
  intercom: string | null;
  landmark: string | null;
  directions: string | null;
  client_note: string | null;
  public_address: string;
  is_primary: boolean;
  lat: number | null;
  lng: number | null;
  show_exact_address_after_booking: boolean;
};

/** Полный снимок кабинета мастера (без фильтра по publication). */
export async function getMyMasterCabinet(masterId: string) {
  const profile = await getMyMasterProfile(masterId);

  const categoryPromise = profile.primaryCategoryId
    ? query<{ code: string; name: string }>(
        `select code, name from public.service_categories where id = $1 and is_active = true`,
        [profile.primaryCategoryId],
      )
    : Promise.resolve({ rows: [] as { code: string; name: string }[] });

  const [
    category,
    primaryLoc,
    scheduleRules,
    services,
    bookingRules,
    certificates,
    portfolio,
    career,
  ] = await Promise.all([
    categoryPromise,
    query<PrimaryLocationRow>(
      `select id, visit_type::text, city, street, building, building_detail, salon_name, district, entrance, floor, room,
              intercom, landmark, directions, client_note, public_address, is_primary, lat, lng,
              show_exact_address_after_booking
         from public.master_locations
        where master_id = $1 and is_primary = true
        limit 1`,
      [masterId],
    ),
    listMyScheduleRules(masterId),
    listMyServices(masterId),
    query<BookingRulesRow>(
      `select booking_rules, cancellation_policy, payment_note
         from public.master_booking_rules
        where master_id = $1`,
      [masterId],
    ),
    query<CertificateRow>(
      `select id, title, issuer, year, image_url, description, sort_order
         from public.master_certificates
        where master_id = $1
        order by sort_order asc, created_at asc`,
      [masterId],
    ),
    query<PortfolioRow>(
      `select id, image_url, title, description, sort_order
         from public.master_portfolio_items
        where master_id = $1
        order by sort_order asc, created_at asc`,
      [masterId],
    ),
    query<CareerRow>(
      `select id, type::text, title, place, start_year, end_year, description, sort_order
         from public.master_career_items
        where master_id = $1
        order by sort_order asc, created_at asc`,
      [masterId],
    ),
  ]);

  const loc = primaryLoc.rows[0];
  const br = bookingRules.rows[0] as BookingRulesRow | undefined;
  const paymentMethodsCabinet = await listMasterPaymentMethodNames(masterId);
  const paymentDecoded = br ? decodePaymentNote(br.payment_note) : { paymentNote: '', paymentMethods: [] as string[] };
  const paymentNoteCabinet = paymentDecoded.paymentNote || null;
  const paymentMethodsCabinetResolved = paymentMethodsCabinet.length
    ? paymentMethodsCabinet
    : paymentDecoded.paymentMethods;

  let primaryCategory = category.rows[0] ?? null;
  let profileOut = profile;

  if (!primaryCategory && services.length > 0) {
    const serviceCategoryId = services.find((s) => s.categoryId)?.categoryId;
    if (serviceCategoryId) {
      const catFromService = await query<{ id: string; code: string; name: string }>(
        `select id, code, name from public.service_categories where id = $1 and is_active = true`,
        [serviceCategoryId],
      );
      const row = catFromService.rows[0];
      if (row) {
        primaryCategory = { code: row.code, name: row.name };
        if (!profile.primaryCategoryId) {
          await query(
            `update public.master_profiles
                set primary_category_id = $2, updated_at = now()
              where master_id = $1`,
            [masterId, row.id],
          );
          profileOut = { ...profile, primaryCategoryId: row.id };
        }
      }
    }
  }

  let categoryChangePolicy: Awaited<
    ReturnType<(typeof import('./categoryChangePolicy.service.js'))['buildCategoryChangePolicy']>
  >;
  try {
    const { buildCategoryChangePolicy } = await import('./categoryChangePolicy.service.js');
    categoryChangePolicy = await buildCategoryChangePolicy(masterId);
  } catch (e) {
    console.error('[masters] buildCategoryChangePolicy failed:', e instanceof Error ? e.message : e);
    categoryChangePolicy = {
      canChangeDirectly: true,
      needsRequest: false,
      reason: 'draft_profile',
      hasActiveRequest: false,
      activeRequest: null,
      activity: {
        servicesCount: services.length,
        activeWindowsCount: 0,
        futureBookingsCount: 0,
        completedBookingsCount: 0,
        reviewsCount: profile.reviewsCount,
      },
    };
  }

  return {
    profile: profileOut,
    primaryCategory,
    categoryChangePolicy,
    primaryLocation: loc
      ? {
          id: loc.id,
          visitType: loc.visit_type,
          city: loc.city,
          street: loc.street,
          building: loc.building,
          buildingDetail: loc.building_detail,
          salonName: loc.salon_name,
          district: loc.district,
          entrance: loc.entrance,
          floor: loc.floor,
          room: loc.room,
          intercom: loc.intercom,
          landmark: loc.landmark,
          directions: loc.directions,
          clientNote: loc.client_note,
          publicAddress: loc.public_address,
          isPrimary: loc.is_primary,
          lat: loc.lat,
          lng: loc.lng,
          showExactAddressAfterBooking: loc.show_exact_address_after_booking,
        }
      : null,
    scheduleRules,
    services,
    bookingRules: br
      ? {
          bookingRules: br.booking_rules,
          cancellationPolicy: br.cancellation_policy,
          paymentNote: paymentNoteCabinet,
          paymentMethods: paymentMethodsCabinetResolved,
        }
      : null,
    certificates: (certificates.rows as CertificateRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      issuer: row.issuer,
      year: row.year,
      imageUrl: row.image_url,
      description: row.description,
      sortOrder: row.sort_order,
    })),
    portfolio: (portfolio.rows as PortfolioRow[]).map((row) => ({
      id: row.id,
      imageUrl: row.image_url,
      title: row.title,
      description: row.description,
      sortOrder: row.sort_order,
    })),
    career: (career.rows as CareerRow[]).map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      place: row.place,
      startYear: row.start_year,
      endYear: row.end_year,
      description: row.description,
      sortOrder: row.sort_order,
    })),
  };
}
