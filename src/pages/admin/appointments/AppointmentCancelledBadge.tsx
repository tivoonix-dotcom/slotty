import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { apptBadgeCancelled } from './adminAppointmentsTheme';

/** `public/photos/badges/cancel.webp` */
export const APPOINTMENT_CANCELLED_ICON_SRC = '/photos/badges/cancel.webp';

type Props = {
  label?: string;
  hint?: string;
  className?: string;
  /** Компактный бейдж в hero-карточке модалки. */
  variant?: 'default' | 'hero';
};

export function AppointmentCancelledBadge({
  label = 'Отменено',
  hint = 'Запись отменена. Визит не состоялся.',
  className = '',
  variant = 'default',
}: Props) {
  const shellClass =
    variant === 'hero'
      ? 'rounded-full bg-[#FEF2F2] px-2.5 py-0.5 text-[10px] font-bold text-[#EF4444]'
      : apptBadgeCancelled;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 ${shellClass} ${className}`.trim()}
      title={hint}
      aria-label={`${label}. ${hint}`}
    >
      <SlottyImg
        src={APPOINTMENT_CANCELLED_ICON_SRC}
        alt=""
        className={`shrink-0 object-contain ${variant === 'hero' ? 'h-3 w-3' : 'h-3.5 w-3.5'}`}
        decoding="async"
      />
      <span>{label}</span>
    </span>
  );
}
