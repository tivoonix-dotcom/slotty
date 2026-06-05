import type { ReactNode } from 'react';
import { dbStatusToUi, type UiAppointmentStatus } from '../appointmentStatus';

export const CLIENT_BOOKING_COMPLETED_HERO_BG = '/photos/визит%20азверешне/1.png';

export const CLIENT_REVIEW_HERO_BG =
  `/photos/${encodeURIComponent('отзыв')}/${encodeURIComponent('1.png')}`;

export function formatBookingCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${day} в ${time}`;
}

export function bookingStatusBadgeClass(status: string): string {
  const ui = dbStatusToUi(status);
  switch (ui) {
    case 'completed':
    case 'client_confirmed_completed':
      return 'bg-[#ECFDF5] text-[#059669]';
    case 'confirmed':
    case 'client_arrived':
    case 'in_progress':
      return 'bg-[#EFF6FF] text-[#2563EB]';
    case 'pending':
    case 'master_marked_completed':
      return 'bg-[#FFF7ED] text-[#C2410C]';
    case 'cancelled':
      return 'bg-[#F3F4F6] text-[#6B7280]';
    case 'no_show':
    case 'disputed':
      return 'bg-[#FEF2F2] text-[#DC2626]';
    default:
      return 'bg-[#F5F5F5] text-[#374151]';
  }
}

export function shouldUseCompletedHeroPhoto(status: string): boolean {
  const ui = dbStatusToUi(status);
  return ui === 'completed' || ui === 'client_confirmed_completed';
}

export function clientBookingSectionTitleClass() {
  return 'text-[16px] font-bold tracking-[-0.02em] text-[#111827]';
}

export function ClientBookingSectionTitle({ children }: { children: ReactNode }) {
  return <p className={clientBookingSectionTitleClass()}>{children}</p>;
}

export function ClientBookingDetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  if (!value.trim()) return null;
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#6B7280]">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
        <span className="shrink-0 text-[13px] font-medium text-[#6B7280]">{label}</span>
        <span className="min-w-0 text-right text-[14px] font-semibold leading-snug text-[#111827]">{value}</span>
      </div>
    </div>
  );
}

export function clientBookingStatusLabel(status: string, override?: string): string {
  if (override?.trim()) return override;
  const ui = dbStatusToUi(status) as UiAppointmentStatus;
  switch (ui) {
    case 'completed':
    case 'client_confirmed_completed':
      return 'Завершена';
    case 'confirmed':
      return 'Подтверждена';
    case 'pending':
      return 'Ожидает';
    case 'cancelled':
      return 'Отменена';
    default:
      return status;
  }
}
