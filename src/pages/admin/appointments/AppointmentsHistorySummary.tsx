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
    <section className={`${apptCard} p-4`}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
          <HiChartBar className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-[#111827]">Итоги за всё время</p>
          <p className="text-[13px] text-[#6B7280]">Завершённые и отменённые записи</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-[16px] bg-[#FAFAFA] px-2 py-3 text-center">
          <p className="text-[20px] font-bold tabular-nums text-[#111827]">{completedCount}</p>
          <p className="mt-1 text-[11px] font-semibold leading-tight text-[#6B7280]">Завершено</p>
        </div>
        <div className="rounded-[16px] bg-[#FAFAFA] px-2 py-3 text-center">
          <p className="text-[15px] font-bold tabular-nums leading-tight text-[#111827] sm:text-[16px]">
            {formatAppointmentPrice(earnedTotal)}
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-tight text-[#6B7280]">Заработано</p>
        </div>
        <div className="rounded-[16px] bg-[#FAFAFA] px-2 py-3 text-center">
          <p className="text-[20px] font-bold tabular-nums text-[#111827]">{cancelledCount}</p>
          <p className="mt-1 text-[11px] font-semibold leading-tight text-[#6B7280]">Отменено</p>
        </div>
      </div>
    </section>
  );
}
