import { query } from '../../config/db.js';
import { isBlockedDisplayValue } from '../../lib/displayFormat.js';
import {
  buildClientAvailableActions,
  buildClientBookingHero,
  deriveClientSignalSummary,
  formatBookingTimelineEventForClient,
  formatTimelineCreatedAt,
} from '../../lib/bookingClientDetail.js';
import { dedupeTimelineItems } from '../../lib/bookingTimelinePolicy.js';
import { parseContactsJson, type MasterContactPayload } from '../masters/masterContactsCodec.js';
import type { BookingEventRow } from './bookingEvents.service.js';

export type ClientMasterContactAction = {
  type: 'telegram' | 'phone' | 'email' | 'whatsapp' | 'slotty';
  label: string;
  href: string | null;
};

export type ClientBookingMasterCard = {
  id: string;
  display_name: string;
  photo_url: string | null;
  slug: string | null;
  profile_path: string;
  specialty: string | null;
  rating: number;
  reviews_count: number;
  contacts_visible: boolean;
  contact_actions: ClientMasterContactAction[];
};

function formatMasterDisplayName(raw: string | null | undefined): string {
  const n = raw?.trim() || '';
  if (!n || isBlockedDisplayValue(n)) return 'Мастер';
  return n;
}

function telegramHref(username: string): string {
  const u = username.replace(/^@+/, '').trim();
  return `https://t.me/${u}`;
}

function buildContactActions(
  phone: string | null,
  contacts: MasterContactPayload[] | null,
  showDirect: boolean,
): ClientMasterContactAction[] {
  if (!showDirect) {
    return [{ type: 'slotty', label: 'Связаться через SLOTTY', href: null }];
  }

  const out: ClientMasterContactAction[] = [];
  const tel = phone?.trim();
  if (tel) {
    const digits = tel.replace(/\s/g, '');
    out.push({ type: 'phone', label: 'Позвонить', href: `tel:${digits}` });
  }

  for (const c of contacts ?? []) {
    const v = c.value.trim();
    if (!v) continue;
    if (c.type === 'telegram') {
      const handle = v.replace(/^@+/, '');
      out.push({ type: 'telegram', label: 'Написать в Telegram', href: telegramHref(handle) });
    } else if (c.type === 'whatsapp') {
      const digits = v.replace(/\D/g, '');
      if (digits) out.push({ type: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${digits}` });
    }
  }

  if (!out.length) {
    return [{ type: 'slotty', label: 'Связаться через SLOTTY', href: null }];
  }
  return out;
}

export async function loadClientBookingMasterCard(
  masterId: string,
  appointmentStatus: string,
): Promise<ClientBookingMasterCard> {
  const r = await query<{
    display_name: string;
    photo_url: string | null;
    slug: string | null;
    phone: string | null;
    contacts: unknown;
    rating_avg: string;
    reviews_count: number;
    category_name: string | null;
    publication_status: string;
  }>(
    `select coalesce(mp.display_name, 'Мастер') as display_name,
            nullif(trim(mp.photo_url), '') as photo_url,
            mp.slug,
            mp.phone,
            mp.contacts,
            mp.rating_avg::text,
            coalesce(mp.reviews_count, 0)::int as reviews_count,
            sc.name as category_name,
            mp.publication_status::text as publication_status
       from public.master_profiles mp
       left join public.service_categories sc on sc.id = mp.primary_category_id
      where mp.master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  const showDirect =
    row?.publication_status === 'published' &&
    (appointmentStatus === 'confirmed' ||
      appointmentStatus === 'client_arrived' ||
      appointmentStatus === 'in_progress' ||
      appointmentStatus === 'master_marked_completed' ||
      appointmentStatus === 'client_confirmed_completed' ||
      appointmentStatus === 'pending');

  const contacts = parseContactsJson(row?.contacts);
  const phone = row?.phone?.trim() || null;

  return {
    id: masterId,
    display_name: formatMasterDisplayName(row?.display_name),
    photo_url: row?.photo_url ?? null,
    slug: row?.slug ?? null,
    profile_path: `/master/${masterId}`,
    specialty: row?.category_name?.trim() || null,
    rating: Number.parseFloat(row?.rating_avg ?? '') || 0,
    reviews_count: row?.reviews_count ?? 0,
    contacts_visible: showDirect,
    contact_actions: buildContactActions(phone, contacts, showDirect),
  };
}

export function buildAddressPresentation(params: {
  status: string;
  publicAddress: string | null;
  hasCoords: boolean;
}): { line: string | null; hint: string | null; map_available: boolean } {
  const addr = params.publicAddress?.trim() || '';
  const confirmed =
    params.status === 'confirmed' ||
    params.status === 'client_arrived' ||
    params.status === 'in_progress' ||
    params.status === 'master_marked_completed' ||
    params.status === 'client_confirmed_completed' ||
    params.status === 'completed';

  if (addr && (confirmed || params.status === 'pending')) {
    return { line: addr, hint: null, map_available: params.hasCoords || addr.length > 3 };
  }
  if (params.status === 'pending') {
    return {
      line: null,
      hint: 'Адрес будет доступен после подтверждения мастером',
      map_available: false,
    };
  }
  return {
    line: null,
    hint: 'Адрес не указан — свяжитесь с мастером',
    map_available: false,
  };
}

export function enrichClientAppointmentDetail(params: {
  status: string;
  starts_at: string | Date;
  ends_at: string | Date;
  service_duration_snapshot: number | null;
  cancel_reason: string | null;
  cancel_reason_category: string | null;
  has_review: boolean;
  can_leave_review: boolean;
  has_open_dispute: boolean;
  public_address: string | null;
  has_coords: boolean;
  events: BookingEventRow[];
  master: ClientBookingMasterCard;
}) {
  const signal = deriveClientSignalSummary(params.events);
  const hero = buildClientBookingHero({
    status: params.status,
    startsAt: params.starts_at,
    signal,
  });
  const address = buildAddressPresentation({
    status: params.status,
    publicAddress: params.public_address,
    hasCoords: params.has_coords,
  });
  const available_actions = buildClientAvailableActions({
    status: params.status,
    startsAt: params.starts_at,
    hasOpenDispute: params.has_open_dispute,
    canLeaveReview: params.can_leave_review,
    hasReview: params.has_review,
    hasAddress: Boolean(address.line),
    hasDirectContact: params.master.contacts_visible && params.master.contact_actions.some((a) => a.type !== 'slotty'),
  });

  const timeline = dedupeTimelineItems(
    params.events
      .map((ev) => {
        const label = formatBookingTimelineEventForClient(ev);
        if (!label) return null;
        return {
          id: ev.id,
          eventType: ev.event_type,
          label,
          createdAt: ev.created_at instanceof Date ? ev.created_at.toISOString() : String(ev.created_at),
          timeLabel: formatTimelineCreatedAt(ev.created_at),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null),
  ).slice(-20);

  return {
    hero,
    client_signal: signal,
    available_actions,
    address,
    master: params.master,
    service_duration_minutes: params.service_duration_snapshot,
    cancel_reason: params.cancel_reason,
    cancel_reason_category: params.cancel_reason_category,
    timeline,
  };
}
