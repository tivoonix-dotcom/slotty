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

function statusPillClass(status: ScheduleWindowView['status'], booked: boolean): string {
  if (booked) return 'bg-white/20 text-white';
  if (status === 'blocked') return 'bg-[#E8E4E4] text-neutral-500';
  return 'bg-[#FFF5F5] text-[#C97B7B]';
}

export function ScheduleWindowCard({ window: w, onClick }: Props) {
  const booked = w.status === 'booked';
  const blocked = w.status === 'blocked';

  const shellClass = booked
    ? 'bg-[#E29595] text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)]'
    : blocked
      ? 'bg-[#F1EFEF] text-neutral-500'
      : 'bg-white text-neutral-900 shadow-[0_10px_28px_rgba(17,17,17,0.05)]';

  const timeClass = booked
    ? 'text-white'
    : blocked
      ? 'text-neutral-400'
      : 'text-[#E29595]';

  const subTimeClass = booked ? 'text-white/75' : 'text-neutral-400';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-stretch gap-3.5 rounded-[22px] px-4 py-3.5 text-left transition active:scale-[0.99] ${shellClass}`}
    >
      <div className="flex shrink-0 flex-col justify-center">
        <span className={`text-[15px] font-bold tabular-nums leading-none tracking-tight ${timeClass}`}>
          {w.startTime}
        </span>
        <span className={`mt-1 text-[12px] font-semibold tabular-nums ${subTimeClass}`}>{w.endTime}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`line-clamp-2 text-[14px] font-semibold leading-snug tracking-[-0.02em] ${
              booked ? 'text-white' : blocked ? 'text-neutral-600' : 'text-neutral-950'
            }`}
          >
            {w.serviceName}
          </p>
          {booked ? (
            <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Запись
            </span>
          ) : null}
        </div>

        <p
          className={`mt-2 inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusPillClass(w.status, booked)}`}
        >
          {STATUS_LABEL[w.status]}
          {w.clientName ? (
            <span className={booked ? 'text-white/90' : 'text-neutral-500'}> · {w.clientName}</span>
          ) : null}
        </p>
      </div>
    </button>
  );
}
