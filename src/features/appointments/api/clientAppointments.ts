import type { MasterLocation } from '../../profile/model/masterLocation';
import { formatPublicAddress } from '../../profile/model/masterLocation';
import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';
import type { DemoAppointmentRecord, DemoAppointmentStatus, DemoAppointmentTab } from '../model/demoAppointments';

/** Ответ GET /api/me/appointments (поля из PostgreSQL). */
export type ServerClientAppointment = {
  id: string;
  master_id: string;
  service_id: string;
  slot_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  price_snapshot: string;
  service_title_snapshot: string;
  client_note: string | null;
  created_at: string;
  master_display_name: string;
  location_visit_type: string | null;
  location_city: string | null;
  location_street: string | null;
  location_building: string | null;
  location_public_address: string | null;
  location_lat: number | string | null;
  location_lng: number | string | null;
  voucher_number: string | null;
};

export type ClientAppointmentsState = {
  upcoming: DemoAppointmentRecord[];
  past: DemoAppointmentRecord[];
};

export function emptyClientAppointments(): ClientAppointmentsState {
  return { upcoming: [], past: [] };
}

function mapDbStatus(status: string): DemoAppointmentStatus {
  switch (status) {
    case 'pending':
    case 'confirmed':
      return status;
    case 'completed':
    case 'no_show':
      return 'completed';
    case 'cancelled_by_client':
    case 'cancelled_by_master':
      return 'cancelled';
    default:
      return 'completed';
  }
}

function formatWhenLabels(startsAt: string): { dateLabel: string; timeLabel: string } {
  const d = new Date(startsAt);
  const timeLabel = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diffDays = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  let dateLabel: string;
  if (diffDays === 0) dateLabel = 'Сегодня';
  else if (diffDays === 1) dateLabel = 'Завтра';
  else if (diffDays === -1) dateLabel = 'Вчера';
  else dateLabel = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  return { dateLabel, timeLabel };
}

function buildLocationFromServer(row: ServerClientAppointment): MasterLocation {
  const visitType = row.location_visit_type === 'at_home' ? 'at_home' : 'studio';
  const street =
    (row.location_street && String(row.location_street).trim()) ||
    (row.location_public_address && String(row.location_public_address).trim()) ||
    '';
  const building = (row.location_building && String(row.location_building).trim()) || '';
  const city = row.location_city ? String(row.location_city).trim() : undefined;
  const latRaw = row.location_lat;
  const lngRaw = row.location_lng;
  const lat =
    latRaw != null && latRaw !== ''
      ? typeof latRaw === 'number'
        ? latRaw
        : Number(latRaw)
      : undefined;
  const lng =
    lngRaw != null && lngRaw !== ''
      ? typeof lngRaw === 'number'
        ? lngRaw
        : Number(lngRaw)
      : undefined;

  const loc: MasterLocation = {
    visitType,
    street: street || 'Адрес уточняется',
    building,
    city: city || undefined,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  };
  return loc;
}

export function mapServerAppointmentToRecord(
  row: ServerClientAppointment,
  tab: DemoAppointmentTab,
): DemoAppointmentRecord {
  const location = buildLocationFromServer(row);
  const addressShort = formatPublicAddress(location);
  const { dateLabel, timeLabel } = formatWhenLabels(row.starts_at);
  const lat = location.lat;
  const lng = location.lng;
  const yandexMap =
    lat != null && lng != null ? { lon: lng, lat, zoom: 16 as const } : undefined;

  return {
    id: row.id,
    masterId: row.master_id,
    masterName: row.master_display_name || 'Мастер',
    serviceTitle: row.service_title_snapshot || 'Услуга',
    dateLabel,
    timeLabel,
    location,
    addressShort,
    yandexMap,
    price: Number.parseFloat(String(row.price_snapshot)) || 0,
    status: mapDbStatus(row.status),
    type: tab,
    voucherNumber: row.voucher_number ?? undefined,
  };
}

export function splitClientAppointments(rows: ServerClientAppointment[]): ClientAppointmentsState {
  const now = Date.now();
  const upcomingRaw: ServerClientAppointment[] = [];
  const pastRaw: ServerClientAppointment[] = [];

  for (const row of rows) {
    const endMs = new Date(row.ends_at).getTime();
    const activeFuture =
      (row.status === 'pending' || row.status === 'confirmed') && endMs > now;
    if (activeFuture) upcomingRaw.push(row);
    else pastRaw.push(row);
  }

  upcomingRaw.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  pastRaw.sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

  return {
    upcoming: upcomingRaw.map((r) => mapServerAppointmentToRecord(r, 'upcoming')),
    past: pastRaw.map((r) => mapServerAppointmentToRecord(r, 'past')),
  };
}

async function readBookingApiError(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export type CreateAppointmentResponse = {
  appointmentId: string;
  masterId: string;
  serviceTitle: string;
  startsAt: string;
  endsAt: string;
  price: number;
  voucherNumber: string;
};

export async function createClientAppointment(body: {
  slotId: string;
  serviceId: string;
  clientNote?: string;
}): Promise<CreateAppointmentResponse> {
  const res = await apiFetch('/api/appointments', {
    method: 'POST',
    body: JSON.stringify({
      slotId: body.slotId,
      serviceId: body.serviceId,
      clientNote: body.clientNote,
    }),
  });
  if (!res.ok) throw new Error(await readBookingApiError(res));
  return (await res.json()) as CreateAppointmentResponse;
}
