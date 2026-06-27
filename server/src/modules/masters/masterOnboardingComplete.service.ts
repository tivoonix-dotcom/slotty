import type { PoolClient } from 'pg';
import { withTransaction } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { syncUserProfileFromMasterCabinet } from '../profiles/profiles.service.js';
import { ensureMasterSubscriptionWithClient } from '../billing/billing.service.js';
import { recordBillingEvent } from '../billing/billingEvents.service.js';
import {
  contactsToLegacyContactLine,
  type MasterContactPayload,
} from './masterContactsCodec.js';

export type OnboardingLocationInput = {
  visitType: 'studio' | 'at_home';
  city: string;
  street: string;
  building: string;
  buildingDetail?: string | null;
  salonName?: string | null;
  district?: string | null;
  showExactAddressAfterBooking?: boolean | null;
  entrance?: string | null;
  floor?: string | null;
  room?: string | null;
  intercom?: string | null;
  landmark?: string | null;
  directions?: string | null;
  clientNote?: string | null;
  lat?: number | null;
  lng?: number | null;
  publicAddress: string;
};

export type OnboardingScheduleRuleInput = {
  weekday: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
};

export type OnboardingServiceInput = {
  title: string;
  description?: string;
  durationMinutes: number;
  priceAmount: number;
  priceType?: 'fixed' | 'from';
  sortOrder?: number;
};

export type OnboardingCertificateInput = {
  title: string;
  issuer: string | null;
  year?: number | null;
  imageUrl?: string | null;
  description?: string | null;
  sortOrder?: number;
};

export type CompleteMasterOnboardingInput = {
  categoryCode: string;
  name: string;
  description?: string;
  phone?: string | null;
  /** Legacy одна строка; если передан `contacts`, сервер соберёт строку сам. */
  contact?: string | null;
  contacts?: MasterContactPayload[] | null;
  photoUrl?: string | null;
  location: OnboardingLocationInput;
  scheduleRules: OnboardingScheduleRuleInput[];
  services: OnboardingServiceInput[];
  certificates: OnboardingCertificateInput[];
  bookingRules?: string | null;
  cancellationPolicy?: string | null;
  /** Через онбординг без оплаты сохраняется только basic. */
  masterPlan?: 'basic';
  proInterested?: boolean;
};

function num(v: string | null): number | null {
  if (v == null) return null;
  return Number(v);
}

function formatTime(t: unknown): string {
  if (t == null) return '';
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

async function upsertPublishedProfile(
  client: PoolClient,
  masterId: string,
  input: {
    displayName: string;
    primaryCategoryId: string;
    bio: string;
    phone: string | null;
    contact: string | null;
    contacts: MasterContactPayload[] | null;
    photoUrl: string | null;
    masterPlan: 'basic' | 'pro';
    proInterested: boolean;
    proStatus: string | null;
    isProfileActive: boolean;
  },
): Promise<void> {
  await client.query(`update public.profiles set role = 'master', updated_at = now() where id = $1`, [masterId]);

  await client.query(
    `insert into public.master_profiles (
       master_id, display_name, slug, primary_category_id, bio, phone, contact, contacts, photo_url, publication_status,
       is_profile_active, master_plan, pro_interested, pro_status, published_at
     ) values ($1, $2, null, $3, $4, $5, $6, $7::jsonb, $8, 'draft'::public.master_publication_status,
       $9, $10, $11, $12, null)
     on conflict (master_id) do update set
       display_name = excluded.display_name,
       slug = coalesce(excluded.slug, public.master_profiles.slug),
       primary_category_id = excluded.primary_category_id,
       bio = excluded.bio,
       phone = excluded.phone,
       contact = excluded.contact,
       contacts = excluded.contacts,
       photo_url = excluded.photo_url,
       publication_status = case
         when public.master_profiles.publication_status = 'published'::public.master_publication_status
           then public.master_profiles.publication_status
         else 'draft'::public.master_publication_status
       end,
       is_profile_active = case
         when public.master_profiles.publication_status = 'published'::public.master_publication_status
           then public.master_profiles.is_profile_active
         else false
       end,
       master_plan = excluded.master_plan,
       pro_interested = excluded.pro_interested,
       pro_status = excluded.pro_status,
       published_at = public.master_profiles.published_at,
       updated_at = now()`,
    [
      masterId,
      input.displayName,
      input.primaryCategoryId,
      input.bio,
      input.phone,
      input.contact,
      input.contacts?.length ? JSON.stringify(input.contacts) : null,
      input.photoUrl,
      input.isProfileActive,
      input.masterPlan,
      input.proInterested,
      input.proStatus,
    ],
  );
}

async function replacePrimaryLocation(client: PoolClient, masterId: string, loc: OnboardingLocationInput): Promise<void> {
  await client.query(`delete from public.master_locations where master_id = $1 and is_primary = true`, [masterId]);

  await client.query(
    `insert into public.master_locations (
       master_id, visit_type, city, street, building, building_detail, entrance, floor, room,
       intercom, landmark, directions, client_note, lat, lng, public_address,
       salon_name, district, show_exact_address_after_booking, is_primary
     ) values (
       $1, $2::public.visit_type, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
       $17, $18, $19, true
     )`,
    [
      masterId,
      loc.visitType,
      loc.city.trim(),
      loc.street.trim(),
      loc.building.trim(),
      loc.buildingDetail?.trim() || null,
      loc.entrance?.trim() || null,
      loc.floor?.trim() || null,
      loc.room?.trim() || null,
      loc.intercom?.trim() || null,
      loc.landmark?.trim() || null,
      loc.directions?.trim() || null,
      loc.clientNote?.trim() || null,
      loc.lat ?? null,
      loc.lng ?? null,
      loc.publicAddress.trim(),
      loc.salonName?.trim() || null,
      loc.district?.trim() || null,
      loc.showExactAddressAfterBooking === true,
    ],
  );
}

async function replaceScheduleRulesTx(
  client: PoolClient,
  masterId: string,
  rules: OnboardingScheduleRuleInput[],
): Promise<void> {
  await client.query(`delete from public.master_schedule_rules where master_id = $1`, [masterId]);
  for (const rule of rules) {
    const active = rule.isActive !== false;
    await client.query(
      `insert into public.master_schedule_rules (master_id, weekday, start_time, end_time, is_active)
       values ($1, $2, $3::time, $4::time, $5)`,
      [masterId, rule.weekday, rule.startTime, rule.endTime, active],
    );
  }
}

async function deactivateAllServices(client: PoolClient, masterId: string): Promise<void> {
  await client.query(
    `update public.master_services set is_active = false, updated_at = now() where master_id = $1 and is_active = true`,
    [masterId],
  );
}

async function insertServiceRow(
  client: PoolClient,
  masterId: string,
  categoryId: string,
  svc: OnboardingServiceInput,
  fallbackOrder: number,
): Promise<void> {
  await client.query(
    `insert into public.master_services (
       master_id, category_id, title, description, duration_minutes, price_amount, price_type, is_active, sort_order
     ) values ($1, $2, $3, $4, $5, $6, $7, true, $8)`,
    [
      masterId,
      categoryId,
      svc.title.trim(),
      (svc.description ?? '').trim(),
      svc.durationMinutes,
      svc.priceAmount,
      svc.priceType ?? 'fixed',
      svc.sortOrder ?? fallbackOrder,
    ],
  );
}

async function upsertBookingRulesTx(
  client: PoolClient,
  masterId: string,
  bookingRules: string | null,
  cancellationPolicy: string | null,
): Promise<void> {
  const rules = bookingRules?.trim() || null;
  const cancel = cancellationPolicy?.trim() || null;
  if (!rules && !cancel) return;

  await client.query(
    `insert into public.master_booking_rules (master_id, booking_rules, cancellation_policy, payment_note)
     values ($1, $2, $3, null)
     on conflict (master_id) do update set
       booking_rules = excluded.booking_rules,
       cancellation_policy = excluded.cancellation_policy,
       updated_at = now()`,
    [masterId, rules, cancel],
  );
}

async function replaceCertificatesTx(
  client: PoolClient,
  masterId: string,
  items: OnboardingCertificateInput[],
): Promise<void> {
  await client.query(`delete from public.master_certificates where master_id = $1`, [masterId]);
  let order = 0;
  for (const item of items) {
    const y = item.year != null && Number.isFinite(item.year) ? Math.round(item.year) : null;
    await client.query(
      `insert into public.master_certificates (master_id, title, issuer, year, image_url, description, sort_order)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        masterId,
        item.title.trim(),
        item.issuer?.trim() ? item.issuer.trim() : null,
        y,
        item.imageUrl?.trim() || null,
        item.description?.trim() || null,
        item.sortOrder ?? order,
      ],
    );
    order += 1;
  }
}

async function loadOnboardingResult(client: PoolClient, masterId: string) {
  const mp = await client.query<{
    master_id: string;
    display_name: string;
    slug: string | null;
    primary_category_id: string | null;
    bio: string;
    phone: string | null;
    contact: string | null;
    contacts: unknown | null;
    photo_url: string | null;
    publication_status: string;
    rating_avg: string;
    reviews_count: number;
    global_buffer_minutes: number;
    category_code: string | null;
    category_name: string | null;
    master_plan: string;
    pro_interested: boolean;
    pro_status: string | null;
    published_at: string | null;
  }>(
    `select mp.master_id, mp.display_name, mp.slug, mp.primary_category_id, mp.bio, mp.phone, mp.contact, mp.contacts, mp.photo_url,
            mp.publication_status::text, mp.rating_avg::text, mp.reviews_count, mp.global_buffer_minutes,
            sc.code as category_code, sc.name as category_name,
            mp.master_plan, mp.pro_interested, mp.pro_status, mp.published_at::text
       from public.master_profiles mp
       left join public.service_categories sc on sc.id = mp.primary_category_id
      where mp.master_id = $1`,
    [masterId],
  );
  const m = mp.rows[0];
  if (!m) {
    throw ApiError.internal('Не удалось прочитать профиль мастера после сохранения');
  }

  const loc = await client.query<{
    id: string;
    visit_type: string;
    city: string;
    street: string;
    building: string;
    building_detail: string | null;
    salon_name: string | null;
    district: string | null;
    show_exact_address_after_booking: boolean;
    entrance: string | null;
    floor: string | null;
    room: string | null;
    intercom: string | null;
    landmark: string | null;
    directions: string | null;
    client_note: string | null;
    lat: number | null;
    lng: number | null;
    public_address: string;
  }>(
    `select id, visit_type::text, city, street, building, building_detail, salon_name, district,
            show_exact_address_after_booking, entrance, floor, room, intercom,
            landmark, directions, client_note, lat, lng, public_address
       from public.master_locations
      where master_id = $1 and is_primary = true`,
    [masterId],
  );

  const svcs = await client.query<{
    id: string;
    title: string;
    description: string;
    duration_minutes: number;
    price_amount: string;
    price_type: string;
    is_active: boolean;
    sort_order: number;
  }>(
    `select id, title, description, duration_minutes, price_amount::text, price_type::text, is_active, sort_order
       from public.master_services
      where master_id = $1 and is_active = true
      order by sort_order asc, title asc`,
    [masterId],
  );

  const rules = await client.query<{
    id: string;
    weekday: number;
    start_time: unknown;
    end_time: unknown;
    is_active: boolean;
  }>(
    `select id, weekday, start_time, end_time, is_active
       from public.master_schedule_rules
      where master_id = $1
      order by weekday asc, start_time asc`,
    [masterId],
  );

  const certs = await client.query<{
    id: string;
    title: string;
    issuer: string;
    year: number | null;
    image_url: string | null;
    description: string | null;
    sort_order: number;
  }>(
    `select id, title, issuer, year, image_url, description, sort_order
       from public.master_certificates
      where master_id = $1
      order by sort_order asc, created_at asc`,
    [masterId],
  );

  const lr = loc.rows[0];

  return {
    master: {
      masterId: m.master_id,
      displayName: m.display_name,
      slug: m.slug,
      primaryCategoryId: m.primary_category_id,
      bio: m.bio,
      phone: m.phone,
      contact: m.contact,
      contacts: m.contacts ?? null,
      photoUrl: m.photo_url,
      publicationStatus: m.publication_status,
      rating: num(m.rating_avg) ?? 0,
      reviewsCount: m.reviews_count,
      globalBufferMinutes: m.global_buffer_minutes,
      category:
        m.category_code != null
          ? { code: m.category_code, name: m.category_name ?? m.category_code }
          : null,
      masterPlan: m.master_plan,
      proInterested: m.pro_interested,
      proStatus: m.pro_status,
      publishedAt: m.published_at,
    },
    location: lr
      ? {
          id: lr.id,
          visitType: lr.visit_type,
          city: lr.city,
          street: lr.street,
          building: lr.building,
          buildingDetail: lr.building_detail,
          salonName: lr.salon_name,
          district: lr.district,
          showExactAddressAfterBooking: lr.show_exact_address_after_booking,
          entrance: lr.entrance,
          floor: lr.floor,
          room: lr.room,
          intercom: lr.intercom,
          landmark: lr.landmark,
          directions: lr.directions,
          clientNote: lr.client_note,
          lat: lr.lat,
          lng: lr.lng,
          publicAddress: lr.public_address,
        }
      : null,
    services: svcs.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      durationMinutes: row.duration_minutes,
      price: num(row.price_amount) ?? 0,
      priceType: row.price_type,
      isActive: row.is_active,
      sortOrder: row.sort_order,
    })),
    scheduleRules: rules.rows.map((row) => ({
      id: row.id,
      weekday: row.weekday,
      startTime: formatTime(row.start_time),
      endTime: formatTime(row.end_time),
      isActive: row.is_active,
    })),
    certificates: certs.rows.map((row) => ({
      id: row.id,
      title: row.title,
      issuer: row.issuer,
      year: row.year,
      imageUrl: row.image_url,
      description: row.description,
      sortOrder: row.sort_order,
    })),
  };
}

export async function completeMyMasterOnboarding(masterId: string, body: CompleteMasterOnboardingInput) {
  const result = await withTransaction(async (client) => {
    const cat = await client.query<{ id: string }>(
      `select id from public.service_categories where code = $1 and is_active = true`,
      [body.categoryCode.trim()],
    );
    const categoryId = cat.rows[0]?.id;
    if (!categoryId) {
      throw ApiError.badRequest('Неизвестная категория', 'BAD_CATEGORY_CODE');
    }

    const proInterested = Boolean(body.proInterested);
    const proStatus = proInterested ? 'interested' : null;

    await upsertPublishedProfile(client, masterId, {
      displayName: body.name.trim(),
      primaryCategoryId: categoryId,
      bio: (body.description ?? '').trim(),
      phone: body.phone == null || body.phone === '' ? null : body.phone.trim(),
      contact:
        body.contacts?.length
          ? contactsToLegacyContactLine(body.contacts)
          : body.contact == null || body.contact === ''
            ? null
            : body.contact.trim(),
      contacts: body.contacts?.length ? body.contacts : null,
      photoUrl: body.photoUrl?.trim() || null,
      masterPlan: 'basic',
      proInterested,
      proStatus,
      isProfileActive: false,
    });

    const { getMasterEntitlementsWithClient } = await import('../billing/entitlements.service.js');
    const ent = await getMasterEntitlementsWithClient(client, masterId);
    const maxServices = ent.limits.maxServices;
    if (maxServices != null && body.services.length > maxServices) {
      throw ApiError.badRequest(
        `На текущем тарифе можно добавить не более ${maxServices} услуг`,
        'LIMIT_SERVICES_REACHED',
      );
    }

    await replacePrimaryLocation(client, masterId, body.location);
    await replaceScheduleRulesTx(client, masterId, body.scheduleRules);

    await deactivateAllServices(client, masterId);
    let i = 0;
    for (const svc of body.services) {
      await insertServiceRow(client, masterId, categoryId, svc, i);
      i += 1;
    }

    await replaceCertificatesTx(client, masterId, body.certificates);
    await upsertBookingRulesTx(client, masterId, body.bookingRules ?? null, body.cancellationPolicy ?? null);
    await ensureMasterSubscriptionWithClient(client, masterId);

    return loadOnboardingResult(client, masterId);
  });

  await syncUserProfileFromMasterCabinet(masterId, {
    full_name: body.name.trim(),
    phone: body.phone == null || body.phone === '' ? null : body.phone.trim(),
    address: body.location.publicAddress.trim() || null,
  });

  if (body.proInterested) {
    await recordBillingEvent({
      masterId,
      eventType: 'pro_interest',
      planCode: 'pro',
      status: 'recorded',
      source: 'onboarding',
    }).catch(() => {});
  }

  const { tryStartProTrial } = await import('../billing/trial.service.js');
  await tryStartProTrial(masterId);

  return result;
}
