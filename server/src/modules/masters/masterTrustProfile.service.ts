import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

const PAYMENT_METHODS_MARKER = '\n\n__SLOTTY_PAYMENT_METHODS_JSON__\n';

function encodePaymentNote(note: string | null | undefined, methods: string[] | undefined): string | null {
  const n = (note ?? '').trim();
  const m = methods?.filter(Boolean) ?? [];
  if (!m.length) return n || null;
  const payload = `${n}${PAYMENT_METHODS_MARKER}${JSON.stringify(m)}`;
  return payload.trim() || null;
}

export function decodePaymentNote(db: string | null): { paymentNote: string; paymentMethods: string[] } {
  if (!db) return { paymentNote: '', paymentMethods: [] };
  const idx = db.indexOf(PAYMENT_METHODS_MARKER);
  if (idx === -1) return { paymentNote: db, paymentMethods: [] };
  const note = db.slice(0, idx).trim();
  const raw = db.slice(idx + PAYMENT_METHODS_MARKER.length).trim();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
      return { paymentNote: note, paymentMethods: parsed as string[] };
    }
  } catch {
    /* ignore */
  }
  return { paymentNote: db, paymentMethods: [] };
}

/** Для API-ответа: paymentNote без маркера + paymentMethods отдельно. */
export async function getMyBookingRulesDecoded(masterId: string): Promise<{
  bookingRules: string | null;
  cancellationPolicy: string | null;
  paymentNote: string | null;
  paymentMethods: string[];
}> {
  const r = await query<{ booking_rules: string | null; cancellation_policy: string | null; payment_note: string | null }>(
    `select booking_rules, cancellation_policy, payment_note
       from public.master_booking_rules
      where master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  if (!row) {
    return { bookingRules: null, cancellationPolicy: null, paymentNote: null, paymentMethods: [] };
  }
  const dec = decodePaymentNote(row.payment_note);
  return {
    bookingRules: row.booking_rules,
    cancellationPolicy: row.cancellation_policy,
    paymentNote: dec.paymentNote || null,
    paymentMethods: dec.paymentMethods,
  };
}

export async function patchMyBookingRules(
  masterId: string,
  patch: {
    bookingRules?: string | null;
    cancellationPolicy?: string | null;
    paymentNote?: string | null;
    paymentMethods?: string[];
  },
): Promise<void> {
  const cur = await getMyBookingRulesDecoded(masterId);
  const bookingRules = patch.bookingRules !== undefined ? patch.bookingRules : cur.bookingRules;
  const cancellationPolicy = patch.cancellationPolicy !== undefined ? patch.cancellationPolicy : cur.cancellationPolicy;
  const notePlain = patch.paymentNote !== undefined ? (patch.paymentNote ?? '') : cur.paymentNote ?? '';
  const methods = patch.paymentMethods !== undefined ? patch.paymentMethods : cur.paymentMethods;
  const paymentNoteEncoded = encodePaymentNote(notePlain, methods);

  await query(
    `insert into public.master_booking_rules (master_id, booking_rules, cancellation_policy, payment_note)
     values ($1, $2, $3, $4)
     on conflict (master_id) do update set
       booking_rules = excluded.booking_rules,
       cancellation_policy = excluded.cancellation_policy,
       payment_note = excluded.payment_note,
       updated_at = now()`,
    [masterId, bookingRules ?? null, cancellationPolicy ?? null, paymentNoteEncoded],
  );
}

export type CareerItemCamel = {
  id: string;
  type: string;
  title: string;
  place: string;
  startYear: number | null;
  endYear: number | null;
  description: string | null;
  sortOrder: number;
};

export async function listMyCareer(masterId: string): Promise<CareerItemCamel[]> {
  const r = await query<{
    id: string;
    type: string;
    title: string;
    place: string;
    start_year: number | null;
    end_year: number | null;
    description: string | null;
    sort_order: number;
  }>(
    `select id, type::text as type, title, place, start_year, end_year, description, sort_order
       from public.master_career_items
      where master_id = $1
      order by sort_order asc, created_at asc`,
    [masterId],
  );
  return r.rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    place: row.place,
    startYear: row.start_year,
    endYear: row.end_year,
    description: row.description,
    sortOrder: row.sort_order,
  }));
}

export async function createMyCareerItem(
  masterId: string,
  input: {
    type: string;
    title: string;
    place: string;
    startYear?: number | null;
    endYear?: number | null;
    description?: string | null;
    sortOrder?: number;
  },
): Promise<CareerItemCamel> {
  const r = await query<{
    id: string;
    type: string;
    title: string;
    place: string;
    start_year: number | null;
    end_year: number | null;
    description: string | null;
    sort_order: number;
  }>(
    `insert into public.master_career_items (
       master_id, type, title, place, start_year, end_year, description, sort_order
     ) values ($1, $2::public.career_item_type, $3, $4, $5, $6, $7, $8)
     returning id, type::text as type, title, place, start_year, end_year, description, sort_order`,
    [
      masterId,
      input.type,
      input.title.trim(),
      input.place.trim(),
      input.startYear ?? null,
      input.endYear ?? null,
      input.description?.trim() || null,
      input.sortOrder ?? 0,
    ],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.internal('Failed to create career item');
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    place: row.place,
    startYear: row.start_year,
    endYear: row.end_year,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

export async function updateMyCareerItem(
  masterId: string,
  itemId: string,
  patch: {
    type?: string;
    title?: string;
    place?: string;
    startYear?: number | null;
    endYear?: number | null;
    description?: string | null;
    sortOrder?: number;
  },
): Promise<void> {
  const sets: string[] = [];
  const vals: unknown[] = [masterId, itemId];
  let i = 3;
  if (patch.type !== undefined) {
    sets.push(`type = $${i}::public.career_item_type`);
    vals.push(patch.type);
    i += 1;
  }
  if (patch.title !== undefined) {
    sets.push(`title = $${i}`);
    vals.push(patch.title.trim());
    i += 1;
  }
  if (patch.place !== undefined) {
    sets.push(`place = $${i}`);
    vals.push(patch.place.trim());
    i += 1;
  }
  if (patch.startYear !== undefined) {
    sets.push(`start_year = $${i}`);
    vals.push(patch.startYear);
    i += 1;
  }
  if (patch.endYear !== undefined) {
    sets.push(`end_year = $${i}`);
    vals.push(patch.endYear);
    i += 1;
  }
  if (patch.description !== undefined) {
    sets.push(`description = $${i}`);
    vals.push(patch.description?.trim() || null);
    i += 1;
  }
  if (patch.sortOrder !== undefined) {
    sets.push(`sort_order = $${i}`);
    vals.push(patch.sortOrder);
    i += 1;
  }
  if (!sets.length) return;
  const res = await query(
    `update public.master_career_items set ${sets.join(', ')}
      where master_id = $1 and id = $2`,
    vals,
  );
  if (!res.rowCount) throw ApiError.notFound('Career item not found');
}

export async function deleteMyCareerItem(masterId: string, itemId: string): Promise<void> {
  const res = await query(`delete from public.master_career_items where master_id = $1 and id = $2`, [masterId, itemId]);
  if (!res.rowCount) throw ApiError.notFound('Career item not found');
}

export type CertificateCamel = {
  id: string;
  title: string;
  issuer: string;
  year: number | null;
  imageUrl: string | null;
  description: string | null;
  sortOrder: number;
};

export async function listMyCertificates(masterId: string): Promise<CertificateCamel[]> {
  const r = await query<{
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
  return r.rows.map((row) => ({
    id: row.id,
    title: row.title,
    issuer: row.issuer,
    year: row.year,
    imageUrl: row.image_url,
    description: row.description,
    sortOrder: row.sort_order,
  }));
}

export async function createMyCertificate(
  masterId: string,
  input: {
    title: string;
    issuer: string;
    year?: number | null;
    description?: string | null;
    imageUrl?: string | null;
    sortOrder?: number;
  },
): Promise<CertificateCamel> {
  const r = await query<{
    id: string;
    title: string;
    issuer: string;
    year: number | null;
    image_url: string | null;
    description: string | null;
    sort_order: number;
  }>(
    `insert into public.master_certificates (
       master_id, title, issuer, year, image_url, description, sort_order
     ) values ($1, $2, $3, $4, $5, $6, $7)
     returning id, title, issuer, year, image_url, description, sort_order`,
    [
      masterId,
      input.title.trim(),
      input.issuer.trim(),
      input.year ?? null,
      input.imageUrl?.trim() || null,
      input.description?.trim() || null,
      input.sortOrder ?? 0,
    ],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.internal('Failed to create certificate');
  return {
    id: row.id,
    title: row.title,
    issuer: row.issuer,
    year: row.year,
    imageUrl: row.image_url,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

export async function updateMyCertificate(
  masterId: string,
  certId: string,
  patch: {
    title?: string;
    issuer?: string;
    year?: number | null;
    description?: string | null;
    imageUrl?: string | null;
    sortOrder?: number;
  },
): Promise<void> {
  const sets: string[] = [];
  const vals: unknown[] = [masterId, certId];
  let i = 3;
  if (patch.title !== undefined) {
    sets.push(`title = $${i}`);
    vals.push(patch.title.trim());
    i += 1;
  }
  if (patch.issuer !== undefined) {
    sets.push(`issuer = $${i}`);
    vals.push(patch.issuer.trim());
    i += 1;
  }
  if (patch.year !== undefined) {
    sets.push(`year = $${i}`);
    vals.push(patch.year);
    i += 1;
  }
  if (patch.description !== undefined) {
    sets.push(`description = $${i}`);
    vals.push(patch.description?.trim() || null);
    i += 1;
  }
  if (patch.imageUrl !== undefined) {
    sets.push(`image_url = $${i}`);
    vals.push(patch.imageUrl?.trim() || null);
    i += 1;
  }
  if (patch.sortOrder !== undefined) {
    sets.push(`sort_order = $${i}`);
    vals.push(patch.sortOrder);
    i += 1;
  }
  if (!sets.length) return;
  const res = await query(
    `update public.master_certificates set ${sets.join(', ')}
      where master_id = $1 and id = $2`,
    vals,
  );
  if (!res.rowCount) throw ApiError.notFound('Certificate not found');
}

export async function deleteMyCertificate(masterId: string, certId: string): Promise<void> {
  const res = await query(`delete from public.master_certificates where master_id = $1 and id = $2`, [masterId, certId]);
  if (!res.rowCount) throw ApiError.notFound('Certificate not found');
}

export type PortfolioCamel = {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  sortOrder: number;
};

export async function listMyPortfolio(masterId: string): Promise<PortfolioCamel[]> {
  const r = await query<{
    id: string;
    image_url: string;
    title: string | null;
    description: string | null;
    sort_order: number;
  }>(
    `select id, image_url, title, description, sort_order
       from public.master_portfolio_items
      where master_id = $1
      order by sort_order asc, created_at asc`,
    [masterId],
  );
  return r.rows.map((row) => ({
    id: row.id,
    imageUrl: row.image_url,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
  }));
}

export async function createMyPortfolioItem(
  masterId: string,
  input: {
    imageUrl: string;
    title?: string | null;
    description?: string | null;
    sortOrder?: number;
  },
): Promise<PortfolioCamel> {
  const r = await query<{
    id: string;
    image_url: string;
    title: string | null;
    description: string | null;
    sort_order: number;
  }>(
    `insert into public.master_portfolio_items (
       master_id, image_url, title, description, sort_order
     ) values ($1, $2, $3, $4, $5)
     returning id, image_url, title, description, sort_order`,
    [
      masterId,
      input.imageUrl.trim(),
      input.title?.trim() || null,
      input.description?.trim() || null,
      input.sortOrder ?? 0,
    ],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.internal('Failed to create portfolio item');
  return {
    id: row.id,
    imageUrl: row.image_url,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

export async function updateMyPortfolioItem(
  masterId: string,
  itemId: string,
  patch: {
    imageUrl?: string;
    title?: string | null;
    description?: string | null;
    sortOrder?: number;
  },
): Promise<void> {
  const sets: string[] = [];
  const vals: unknown[] = [masterId, itemId];
  let i = 3;
  if (patch.imageUrl !== undefined) {
    sets.push(`image_url = $${i}`);
    vals.push(patch.imageUrl.trim());
    i += 1;
  }
  if (patch.title !== undefined) {
    sets.push(`title = $${i}`);
    vals.push(patch.title?.trim() || null);
    i += 1;
  }
  if (patch.description !== undefined) {
    sets.push(`description = $${i}`);
    vals.push(patch.description?.trim() || null);
    i += 1;
  }
  if (patch.sortOrder !== undefined) {
    sets.push(`sort_order = $${i}`);
    vals.push(patch.sortOrder);
    i += 1;
  }
  if (!sets.length) return;
  const res = await query(
    `update public.master_portfolio_items set ${sets.join(', ')}
      where master_id = $1 and id = $2`,
    vals,
  );
  if (!res.rowCount) throw ApiError.notFound('Portfolio item not found');
}

export async function deleteMyPortfolioItem(masterId: string, itemId: string): Promise<void> {
  const res = await query(`delete from public.master_portfolio_items where master_id = $1 and id = $2`, [masterId, itemId]);
  if (!res.rowCount) throw ApiError.notFound('Portfolio item not found');
}
