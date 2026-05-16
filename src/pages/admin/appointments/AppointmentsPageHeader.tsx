import { HiCalendarDays } from 'react-icons/hi2';

type Props = {
  onCalendarClick?: () => void;
};

export function AppointmentsPageHeader({ onCalendarClick }: Props) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.04em] text-[#111827]">
          Записи
        </h1>
        <p className="mt-1.5 text-[15px] leading-snug text-[#6B7280]">
          Управляйте заявками и записями клиентов
        </p>
      </div>
      <button
        type="button"
        onClick={onCalendarClick}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#EAECEF] bg-white text-[#6B7280] shadow-[0_4px_14px_rgba(17,24,39,0.06)] transition hover:border-[#FDE8ED] hover:text-[#F47C8C] active:scale-[0.96]"
        aria-label="Календарь"
      >
        <HiCalendarDays className="h-5 w-5" aria-hidden />
      </button>
    </header>
  );
}
