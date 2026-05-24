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
  if (status === 'blocked') return 'bg-[#EAECEF] text-[#6B7280]';
  return 'bg-[#FFF1F4] text-[#ff5f7a]';
}

export function ScheduleWindowCard({ window: w, onClick }: Props) {
  const booked = w.status === 'booked';
  const blocked = w.status === 'blocked';
  const free = w.status === 'free';

  const shellClass = booked
    ? 'bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_12px_32px_rgba(255,95,122,0.32)]'
    : blocked
      ? 'border border-[#EAECEF] bg-[#f6f7fb] text-[#6B7280]'
      : 'border border-[#FDE8ED] bg-white text-[#111827] shadow-[0_8px_24px_rgba(255,95,122,0.1)] ring-1 ring-[#FFF1F4]';

  const timeClass = booked ? 'text-white' : blocked ? 'text-[#9CA3AF]' : 'text-[#ff5f7a]';

  const subTimeClass = booked ? 'text-white/80' : 'text-[#9CA3AF]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-stretch gap-3.5 overflow-hidden rounded-[20px] px-4 py-3.5 text-left transition hover:opacity-[0.98] active:scale-[0.99] ${shellClass}`}
    >
      {free ? (
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#ff6f88] to-[#ff5f7a]"
          aria-hidden
        />
      ) : null}

      <div className={`flex shrink-0 flex-col justify-center ${free ? 'pl-1' : ''}`}>
        <span className={`text-[16px] font-black tabular-nums leading-none tracking-[-0.04em] ${timeClass}`}>
          {w.startTime}
        </span>
        <span className={`mt-1 text-[12px] font-bold tabular-nums ${subTimeClass}`}>{w.endTime}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`line-clamp-2 text-[14px] font-bold leading-snug tracking-[-0.02em] ${
              booked ? 'text-white' : blocked ? 'text-[#6B7280]' : 'text-[#111827]'
            }`}
          >
            {w.serviceName}
          </p>
          {booked ? (
            <span className="shrink-0 rounded-full bg-white/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Запись
            </span>
          ) : null}
        </div>

        <p
          className={`mt-2 inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${statusPillClass(w.status, booked)}`}
        >
          {STATUS_LABEL[w.status]}
          {w.clientName ? (
            <span className={booked ? 'text-white/90' : 'text-[#6B7280]'}> · {w.clientName}</span>
          ) : null}
        </p>
      </div>
    </button>
  );
}
