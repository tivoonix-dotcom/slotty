import { SlottyImg } from '../../../shared/ui/SlottyImg';
import { apptBadgeCompleted } from './adminAppointmentsTheme';

/** `public/photos/badges/check.webp` */
export const APPOINTMENT_COMPLETED_CHECK_ICON_SRC = '/photos/badges/check.webp';

type Props = {
  label?: string;
  hint?: string;
  className?: string;
  /** Компактный бейдж в hero-карточке модалки. */
  variant?: 'default' | 'hero';
};

export function AppointmentCompletedBadge({
  label = 'Завершено',
  hint = 'Визит завершён. Запись сохранена в истории.',
  className = '',
  variant = 'default',
}: Props) {
  const shellClass =
    variant === 'hero'
      ? 'rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[10px] font-bold text-[#16A34A]'
      : apptBadgeCompleted;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 ${shellClass} ${className}`.trim()}
      title={hint}
      aria-label={`${label}. ${hint}`}
    >
      <SlottyImg
        src={APPOINTMENT_COMPLETED_CHECK_ICON_SRC}
        alt=""
        className={`shrink-0 object-contain ${variant === 'hero' ? 'h-3 w-3' : 'h-3.5 w-3.5'}`}
        decoding="async"
      />
      <span>{label}</span>
    </span>
  );
}
