import { appointmentsCountRu } from './appointmentsFormat';

function formatCountBadge(n: number): string {
  if (n > 99) return '99+';
  return String(n);
}

type Props = {
  dayNum: number;
  inCurrentMonth: boolean;
  count: number;
  hasAttention: boolean;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  onSelect: () => void;
};

export function AppointmentsUpcomingCalendarDayCell({
  dayNum,
  inCurrentMonth,
  count,
  hasAttention,
  isToday,
  isPast,
  isSelected,
  onSelect,
}: Props) {
  if (!inCurrentMonth) {
    return <div className="aspect-square min-w-0" aria-hidden />;
  }

  const hasAppointments = count > 0;
  const pastMuted = isPast && !isSelected;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex aspect-square min-w-0 flex-col items-center justify-center rounded-[10px] transition active:scale-[0.97] ${
        pastMuted ? 'opacity-70' : ''
      } ${
        isSelected
          ? hasAttention
            ? 'bg-[#FEE2E2] ring-2 ring-[#F47C8C]/45'
            : 'bg-[#FFF4F6] ring-2 ring-[#F47C8C]/40'
          : hasAttention
            ? 'bg-[#FEE2E2] ring-1 ring-[#FECACA]'
            : hasAppointments
              ? 'bg-[#FFF4F6] ring-1 ring-[#FDE8ED]'
              : isToday
                ? 'bg-white ring-1 ring-[#EEEEEE]'
                : 'bg-[#F5F5F5]'
      }`}
      aria-label={`${dayNum}, ${appointmentsCountRu(count)}`}
      aria-pressed={isSelected}
    >
      <span
        className={`text-[13px] font-bold tabular-nums leading-none lg:text-[14px] ${
          hasAppointments || isToday || isSelected ? 'text-[#111827]' : 'text-[#9CA3AF]'
        }`}
      >
        {dayNum}
      </span>
      {hasAppointments ? (
        <span
          className={`mt-0.5 text-[9px] font-bold tabular-nums leading-none lg:text-[10px] ${
            hasAttention ? 'text-[#B91C1C]' : 'text-[#F47C8C]'
          }`}
        >
          {formatCountBadge(count)}
        </span>
      ) : null}
    </button>
  );
}
