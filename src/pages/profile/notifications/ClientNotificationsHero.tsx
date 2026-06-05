import type { ReactNode } from 'react';
import { HiBellAlert, HiCheckBadge, HiInbox } from 'react-icons/hi2';
import {
  clientNotificationsHeroPanel,
  clientNotificationsKpiIcon,
  clientNotificationsKpiTile,
  clientNotificationsMetaAccent,
} from './clientNotificationsTheme';

type Props = {
  unreadCount: number;
  totalCount: number;
};

function KpiStat({
  label,
  value,
  hint,
  icon,
  accentValue,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accentValue?: boolean;
}) {
  return (
    <article className={clientNotificationsKpiTile}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
          {label}
        </p>
        <span className={clientNotificationsKpiIcon}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p
          className={`truncate text-[1.5rem] font-bold tabular-nums leading-none tracking-[-0.04em] sm:text-[1.65rem] ${
            accentValue ? clientNotificationsMetaAccent : 'text-[#111827]'
          }`}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-1 line-clamp-2 text-[12px] font-medium text-[#6B7280]">{hint}</p>
        ) : null}
      </div>
    </article>
  );
}

export function ClientNotificationsHero({ unreadCount, totalCount }: Props) {
  const readCount = Math.max(0, totalCount - unreadCount);
  const subtitle =
    unreadCount === 0
      ? 'Все прочитаны — новые появятся здесь'
      : unreadCount === 1
        ? '1 непрочитанное уведомление'
        : `${unreadCount} непрочитанных`;

  return (
    <section className={clientNotificationsHeroPanel}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[24px] lg:hidden">
            Уведомления
          </h1>
          <p className="mt-1 text-[14px] font-medium leading-snug text-[#6B7280] lg:mt-0">{subtitle}</p>
        </div>
        {unreadCount > 0 ? (
          <span className="shrink-0 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[13px] font-semibold text-[#F47C8C] ring-1 ring-[#FDE8ED]">
            {unreadCount} новых
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <KpiStat
          label="Новые"
          value={String(unreadCount)}
          hint="Ждут просмотра"
          accentValue={unreadCount > 0}
          icon={<HiBellAlert className="h-5 w-5" aria-hidden />}
        />
        <KpiStat
          label="Всего"
          value={String(totalCount)}
          hint="В ленте"
          icon={<HiInbox className="h-5 w-5" aria-hidden />}
        />
        <KpiStat
          label="Прочитано"
          value={String(readCount)}
          hint="Уже открыты"
          icon={<HiCheckBadge className="h-5 w-5" aria-hidden />}
        />
      </div>
    </section>
  );
}
