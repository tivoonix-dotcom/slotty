const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VOUCHER_EXACT_RE = /^SL-[A-Z0-9]{12}$/;
const VOUCHER_PREFIX_RE = /^SL-[A-Z0-9]{0,12}$/;

export type BookingSearchParse =
  | { type: 'none' }
  | { type: 'uuid'; value: string }
  | { type: 'voucher_exact'; value: string }
  | { type: 'voucher_prefix'; value: string }
  | { type: 'text'; value: string };

export function parseBookingSearchQuery(raw: string | undefined): BookingSearchParse {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) return { type: 'none' };

  const compact = trimmed.replace(/\s+/g, '');
  if (UUID_RE.test(compact)) {
    return { type: 'uuid', value: compact.toLowerCase() };
  }

  const upper = compact.toUpperCase();
  if (upper.startsWith('SL-')) {
    if (VOUCHER_EXACT_RE.test(upper)) {
      return { type: 'voucher_exact', value: upper };
    }
    if (VOUCHER_PREFIX_RE.test(upper)) {
      return { type: 'voucher_prefix', value: upper };
    }
  }

  return { type: 'text', value: trimmed };
}

export function buildBookingSearchSql(
  parsed: BookingSearchParse,
  vals: unknown[],
  paramIndex: number,
): {
  condition: string | null;
  nextIndex: number;
  orderBy: string;
  needsVoucherJoin: boolean;
} {
  let i = paramIndex;
  let orderBy = 'a.starts_at desc';
  let needsVoucherJoin = false;

  switch (parsed.type) {
    case 'none':
      return { condition: null, nextIndex: i, orderBy, needsVoucherJoin: false };
    case 'uuid':
      needsVoucherJoin = true;
      vals.push(parsed.value);
      return {
        condition: `a.id::text = $${i}`,
        nextIndex: i + 1,
        orderBy,
        needsVoucherJoin,
      };
    case 'voucher_exact':
      needsVoucherJoin = true;
      vals.push(parsed.value);
      return {
        condition: `bv.voucher_number = $${i}`,
        nextIndex: i + 1,
        orderBy: `case when bv.voucher_number = $${i} then 0 else 1 end, a.starts_at desc`,
        needsVoucherJoin,
      };
    case 'voucher_prefix':
      needsVoucherJoin = true;
      vals.push(`${parsed.value}%`);
      return {
        condition: `bv.voucher_number ilike $${i}`,
        nextIndex: i + 1,
        orderBy: `case when bv.voucher_number ilike $${i} then 0 else 1 end, a.starts_at desc`,
        needsVoucherJoin,
      };
    case 'text':
      needsVoucherJoin = true;
      vals.push(`%${parsed.value}%`, parsed.value);
      return {
        condition: `(cp.full_name ilike $${i} or mp.display_name ilike $${i} or a.service_title_snapshot ilike $${i} or bv.voucher_number ilike $${i} or a.id::text = $${i + 1})`,
        nextIndex: i + 2,
        orderBy,
        needsVoucherJoin,
      };
  }
}

export const BOOKINGS_FROM_WITH_VOUCHER = `
  from public.appointments a
  left join public.booking_vouchers bv on bv.appointment_id = a.id
  join public.profiles cp on cp.id = a.client_id
  join public.master_profiles mp on mp.master_id = a.master_id
`;
