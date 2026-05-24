import { HiChartBar } from 'react-icons/hi2';
import { apptCard } from './adminAppointmentsTheme';
import { formatAppointmentPrice } from './appointmentsFormat';

type Props = {
  completedCount: number;
  earnedTotal: number;
  cancelledCount: number;
};

export function AppointmentsHistorySummary({ completedCount, earnedTotal, cancelledCount }: Props) {
  return (
    <section className={`${apptCard} p-4 lg:p-5`}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_6px_16px_rgba(255,95,122,0.25)]">
          <HiChartBar className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-black text-[#111827]">Итоги за всё время</p>
          <p className="text-[13px] font-semibold text-[#6B7280]">Завершённые и отменённые записи</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-[16px] bg-[#f6f7fb] px-2 py-3 text-center ring-1 ring-[#EAECEF]/80">
          <p className="text-[20px] font-black tabular-nums text-[#111827]">{completedCount}</p>
          <p className="mt-1 text-[11px] font-semibold leading-tight text-[#6B7280]">Завершено</p>
        </div>
        <div className="rounded-[16px] bg-[#FFF1F4] px-2 py-3 text-center ring-1 ring-[#FDE8ED]">
          <p className="text-[15px] font-black tabular-nums leading-tight text-[#ff5f7a] sm:text-[16px]">
            {formatAppointmentPrice(earnedTotal)}
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-tight text-[#6B7280]">Заработано</p>
        </div>
        <div className="rounded-[16px] bg-[#f6f7fb] px-2 py-3 text-center ring-1 ring-[#EAECEF]/80">
          <p className="text-[20px] font-black tabular-nums text-[#111827]">{cancelledCount}</p>
          <p className="mt-1 text-[11px] font-semibold leading-tight text-[#6B7280]">Отменено</p>
        </div>
      </div>
    </section>
  );
}
