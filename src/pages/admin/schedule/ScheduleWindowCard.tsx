import type { ScheduleWindowView } from './scheduleTypes';

type Props = {
  window: ScheduleWindowView;
  onClick: () => void;
};

const STATUS_LABEL: Record<ScheduleWindowView['status'], string> = {
  free: 'Свободно',
  booked: 'Записан клиент',
  blocked: 'Недоступно',
};

export function ScheduleWindowCard({ window: w, onClick }: Props) {
  const booked = w.status === 'booked';
  const blocked = w.status === 'blocked';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col gap-1 rounded-[18px] px-3 py-2.5 text-left transition active:scale-[0.99] ${
        booked
          ? 'bg-[#E29595] text-white shadow-[0_8px_22px_rgba(226,149,149,0.28)]'
          : blocked
            ? 'bg-neutral-100 text-neutral-500'
            : 'bg-[#FFF5F5] text-neutral-900 ring-1 ring-[#E29595]/12'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold leading-snug">{w.serviceName}</span>
        {booked ? (
          <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            Запись
          </span>
        ) : null}
      </div>
      <span className={`text-[12px] font-medium ${booked ? 'text-white/85' : 'text-neutral-500'}`}>
        {w.startTime}–{w.endTime}
      </span>
      <span className={`text-[11px] ${booked ? 'text-white/75' : 'text-neutral-400'}`}>
        {STATUS_LABEL[w.status]}
        {w.clientName ? ` · ${w.clientName}` : ''}
      </span>
    </button>
  );
}
