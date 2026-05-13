import { addDays } from '../../../features/booking/lib/calendar';
import { isoDateLocal } from '../../../features/master/model/demoMasterAppointments';

/** «1 250 BYN» */
export function formatBynRu(value: number): string {
  const n = Number.isFinite(value) ? Math.round(value) : 0;
  return `${n.toLocaleString('ru-RU')} BYN`;
}

/** ДД.ММ.ГГГГ */
export function formatDdMmYyyy(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** ДД.ММ для оси графика */
export function formatDdMm(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

/**
 * «Сегодня, 14:30» / «Завтра, 12:00» / «14.05.2026, 14:30»
 */
export function formatAppointmentWhenRu(iso: string, time: string): string {
  const today = isoDateLocal(new Date());
  const tomorrow = isoDateLocal(addDays(new Date(), 1));
  if (iso === today) return `Сегодня, ${time}`;
  if (iso === tomorrow) return `Завтра, ${time}`;
  return `${formatDdMmYyyy(iso)}, ${time}`;
}

/** Последние 30 дней включительно (сегодня — конец). */
export function defaultOverviewLast30Days(): { start: string; end: string } {
  const end = new Date();
  const start = addDays(end, -29);
  return { start: isoDateLocal(start), end: isoDateLocal(end) };
}
