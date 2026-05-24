import { HiArchiveBox, HiCalendarDays, HiInbox } from 'react-icons/hi2';
import { apptAccentIcon, apptCard, apptPriceAccent } from './adminAppointmentsTheme';

type StatItem = {
  value: number;
  label: string;
  Icon: typeof HiInbox;
  accent?: boolean;
};

type Props = {
  requests: number;
  upcoming: number;
  history: number;
  className?: string;
};

function StatCell({ value, label, Icon, accent }: StatItem) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 px-1 py-1 text-center">
      <span className={`${apptAccentIcon} h-10 w-10 rounded-[14px] text-white`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p
        className={`text-[22px] font-black tabular-nums leading-none tracking-[-0.04em] ${
          accent ? apptPriceAccent : 'text-[#111827]'
        }`}
      >
        {value}
      </p>
      <p className="text-[12px] font-semibold leading-tight text-[#6B7280]">{label}</p>
    </div>
  );
}

export function AppointmentsStatsCard({ requests, upcoming, history, className = '' }: Props) {
  const items: StatItem[] = [
    { value: requests, label: 'Заявки', Icon: HiInbox, accent: requests > 0 },
    { value: upcoming, label: 'Предстоящие', Icon: HiCalendarDays },
    { value: history, label: 'История', Icon: HiArchiveBox },
  ];

  return (
    <section className={`${apptCard} p-4 ${className}`.trim()}>
      <div className="grid grid-cols-3 divide-x divide-[#FDE8ED]">
        {items.map((item) => (
          <StatCell key={item.label} {...item} />
        ))}
      </div>
    </section>
  );
}
