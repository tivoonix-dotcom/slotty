import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

export type PrimaryLocationInput = {
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

export async function upsertPrimaryLocation(masterId: string, loc: PrimaryLocationInput): Promise<void> {
  await query(`delete from public.master_locations where master_id = $1 and is_primary = true`, [masterId]);

  await query(
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

export type ScheduleRuleInput = {
  weekday: number;
  startTime: string;
  endTime: string;
};

export async function replaceScheduleRules(masterId: string, rules: ScheduleRuleInput[]): Promise<void> {
  if (!rules.length) {
    throw ApiError.badRequest('Добавьте хотя бы одно окно расписания', 'EMPTY_SCHEDULE');
  }
  await query(`delete from public.master_schedule_rules where master_id = $1`, [masterId]);
  for (const rule of rules) {
    await query(
      `insert into public.master_schedule_rules (master_id, weekday, start_time, end_time, is_active)
       values ($1, $2, $3::time, $4::time, true)`,
      [masterId, rule.weekday, rule.startTime, rule.endTime],
    );
  }
}

export type ScheduleRuleRow = {
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

/** Weekday uses JS `Date.getDay()` (Sun=0 … Sat=6), same as DB column comment. */
export async function listMyScheduleRules(masterId: string): Promise<ScheduleRuleRow[]> {
  const r = await query<{
    weekday: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>(
    `select weekday,
            to_char(start_time, 'HH24:MI') as start_time,
            to_char(end_time, 'HH24:MI') as end_time,
            is_active
       from public.master_schedule_rules
      where master_id = $1
      order by weekday asc, start_time asc`,
    [masterId],
  );
  return r.rows.map((row) => ({
    weekday: row.weekday,
    startTime: row.start_time,
    endTime: row.end_time,
    isActive: row.is_active,
  }));
}

export type CertificateInput = {
  title: string;
  issuer: string | null;
  year?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
};

export async function insertCertificates(masterId: string, items: CertificateInput[]): Promise<void> {
  let sortOrder = 0;
  for (const item of items) {
    const y = item.year != null && Number.isFinite(item.year) ? Math.round(item.year) : null;
    await query(
      `insert into public.master_certificates (master_id, title, issuer, year, image_url, description, sort_order)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        masterId,
        item.title.trim(),
        item.issuer?.trim() ? item.issuer.trim() : null,
        y,
        item.imageUrl?.trim() || null,
        item.description?.trim() || null,
        item.sortOrder ?? sortOrder,
      ],
    );
    sortOrder += 1;
  }
}
