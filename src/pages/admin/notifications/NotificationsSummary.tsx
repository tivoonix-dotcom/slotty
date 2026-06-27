import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HiCheck, HiCog6Tooth } from 'react-icons/hi2';
import { MASTER_SETTINGS_NOTIFICATIONS_PATH } from '../../../app/paths';
import {
  apptHistoryKpiTile,
  apptHistoryKpiTileOverlay,
} from '../appointments/adminAppointmentsTheme';
import {
  NOTIFICATIONS_KPI_BG,
  notifHeroActionLink,
  notifHeroActionMuted,
  notifHeroSubtitle,
} from './adminNotificationsTheme';
import type { MasterNotificationStats } from './masterNotificationModel';

type Props = {
  stats: MasterNotificationStats;
  loading?: boolean;
  mobileHeader?: {
    title: string;
    subtitle: string;
  };
  mobileFilter?: ReactNode;
  mobileFiltersPanel?: ReactNode;
  desktopFiltersPanel?: ReactNode;
  onMarkAllRead?: () => void;
  /** null — скрыть кнопку «Настроить» (кабинет клиента). */
  settingsTo?: string | null;
  desktopSubtitle?: string;
};

function kpiBackground(label: string): string | null {
  if (label === 'Действия') return NOTIFICATIONS_KPI_BG.actionRequired;
  if (label === 'Новые') return NOTIFICATIONS_KPI_BG.unread;
  if (label === 'Сегодня') return NOTIFICATIONS_KPI_BG.today;
  if (label === 'Прочитано') return NOTIFICATIONS_KPI_BG.read;
  return null;
}

function KpiPhotoBackdrop({ label }: { label: string }) {
  const src = kpiBackground(label);
  if (!src) return null;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${src})` }}
        aria-hidden
      />
      <div className={apptHistoryKpiTileOverlay} aria-hidden />
    </>
  );
}

const kpiLabelClass =
  'shrink-0 text-[9px] font-semibold leading-tight text-[#6B7280] drop-shadow-sm sm:text-[10px]';

const kpiValueClass =
  'text-[1.5rem] font-black tabular-nums leading-none tracking-[-0.04em] text-[#111827] drop-shadow-sm sm:text-[1.85rem] lg:text-[2.5rem]';

function KpiContent({
  label,
  value,
  loading = false,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="relative z-10 flex w-full min-h-[8.25rem] flex-col">
      <p className={kpiLabelClass}>{label}</p>
      <div className="mt-auto">
        {loading ? (
          <div className="h-9 w-[5rem] animate-pulse rounded-md bg-[#EBEBEB] sm:h-10" />
        ) : (
          <p className={kpiValueClass}>{value}</p>
        )}
      </div>
    </div>
  );
}

function DesktopStatBlock({
  label,
  value,
  loading = false,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <article className={`${apptHistoryKpiTile} h-full min-h-[8.25rem] w-full`}>
      <KpiPhotoBackdrop label={label} />
      <KpiContent label={label} value={value} loading={loading} />
    </article>
  );
}

function DoubleCheckIcon() {
  return (
    <span className="relative inline-flex h-4 w-[1.125rem] shrink-0 items-center" aria-hidden>
      <HiCheck className="absolute left-0 h-3.5 w-3.5 stroke-[2.5]" />
      <HiCheck className="absolute left-[0.4rem] h-3.5 w-3.5 stroke-[2.5]" />
    </span>
  );
}

function SummaryActions({
  onMarkAllRead,
  settingsTo = MASTER_SETTINGS_NOTIFICATIONS_PATH,
}: {
  onMarkAllRead?: () => void;
  settingsTo?: string | null;
}) {
  return (
    <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2">
      {settingsTo ? (
        <Link
          to={settingsTo}
          className={`${notifHeroActionMuted} gap-1.5`}
          aria-label="Настроить уведомления"
        >
          <HiCog6Tooth className="h-4 w-4 shrink-0" aria-hidden />
          <span>Настроить</span>
        </Link>
      ) : null}
      {onMarkAllRead ? (
        <button type="button" onClick={onMarkAllRead} className={`${notifHeroActionLink} gap-1.5`}>
          <DoubleCheckIcon />
          <span>Прочитать все</span>
        </button>
      ) : null}
    </div>
  );
}

export function NotificationsSummary({
  stats,
  loading = false,
  mobileHeader,
  mobileFilter,
  mobileFiltersPanel,
  desktopFiltersPanel,
  onMarkAllRead,
  settingsTo = MASTER_SETTINGS_NOTIFICATIONS_PATH,
  desktopSubtitle = 'Все события по записям, клиентам и напоминаниям',
}: Props) {
  const desktopKpiTiles = (
    <>
      <DesktopStatBlock label="Действия" value={String(stats.actionRequired)} loading={loading} />
      <DesktopStatBlock label="Новые" value={String(stats.unread)} loading={loading} />
      <DesktopStatBlock label="Сегодня" value={String(stats.today)} loading={loading} />
      <DesktopStatBlock label="Прочитано" value={String(stats.read)} loading={loading} />
    </>
  );

  return (
    <>
      {mobileHeader ? (
        <section className="overflow-hidden rounded-[16px] bg-white ring-1 ring-[#EEEEEE] lg:hidden">
          <div className="flex items-start justify-between gap-3 border-b border-[#EEEEEE] px-4 py-3.5">
            <div className="min-w-0 flex-1">
              {loading ? (
                <>
                  <div className="h-[18px] w-[70%] max-w-[12rem] animate-pulse rounded-md bg-[#EBEBEB]" />
                  <div className="mt-2 h-[14px] w-[90%] max-w-[16rem] animate-pulse rounded-md bg-[#EBEBEB]" />
                </>
              ) : (
                <>
                  <p className="text-[15px] font-bold tracking-[-0.02em] text-[#111827]">{mobileHeader.title}</p>
                  <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#9CA3AF] sm:text-[13px] sm:text-[#6B7280]">
                    {mobileHeader.subtitle}
                  </p>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-start gap-1.5">
              {mobileFilter ? <div className="self-start">{mobileFilter}</div> : null}
              <SummaryActions onMarkAllRead={onMarkAllRead} settingsTo={settingsTo} />
            </div>
          </div>

          <div className="px-4 py-3.5 sm:py-4">
            {mobileFiltersPanel ? <div>{mobileFiltersPanel}</div> : null}
          </div>
        </section>
      ) : null}

      <div className="hidden w-full min-w-0 lg:block">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[24px]">
              Уведомления
            </h1>
            <p className={notifHeroSubtitle}>{desktopSubtitle}</p>
          </div>
          <SummaryActions onMarkAllRead={onMarkAllRead} settingsTo={settingsTo} />
        </div>
        {desktopFiltersPanel ? (
          <div className="mb-4 flex w-full min-w-0 justify-end">{desktopFiltersPanel}</div>
        ) : null}
        <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {desktopKpiTiles}
        </div>
      </div>
    </>
  );
}
