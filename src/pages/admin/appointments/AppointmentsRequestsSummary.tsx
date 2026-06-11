import type { ReactNode } from 'react';
import {
  APPOINTMENTS_REQUESTS_KPI_BG,
  apptHistoryKpiTile,
  apptHistoryKpiTileOverlay,
} from './adminAppointmentsTheme';

type Props = {
  totalCount: number;
  todayCount: number;
  expiringCount: number;
  loading?: boolean;
  mobileHeader?: {
    title: string;
    subtitle: string;
  };
  mobileFilter?: ReactNode;
};

function requestsKpiBackground(label: string): string | null {
  if (label === 'Всего') return APPOINTMENTS_REQUESTS_KPI_BG.total;
  if (label === 'Сегодня') return APPOINTMENTS_REQUESTS_KPI_BG.today;
  if (label === 'Скоро истекают') return APPOINTMENTS_REQUESTS_KPI_BG.expiring;
  return null;
}

function RequestsKpiPhotoBackdrop({ label }: { label: string }) {
  const src = requestsKpiBackground(label);
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

const requestsKpiLabelClass =
  'shrink-0 text-[9px] font-semibold leading-tight text-[#6B7280] drop-shadow-sm sm:text-[10px]';

const requestsKpiValueClass =
  'text-[1.125rem] font-black tabular-nums leading-none tracking-[-0.04em] text-[#111827] drop-shadow-sm sm:text-[1.35rem] lg:text-[1.65rem]';

function RequestsKpiContent({
  label,
  value,
  loading = false,
  compact = false,
}: {
  label: string;
  value: string;
  loading?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`relative z-10 flex w-full flex-col ${compact ? 'min-h-[5.5rem]' : 'min-h-[8.25rem]'}`}>
      <p className={requestsKpiLabelClass}>{label}</p>
      <div className="mt-auto">
        {loading ? (
          <div
            className={`animate-pulse rounded-md bg-[#EBEBEB] ${
              compact ? 'h-[22px] w-[2.75rem] sm:h-6 sm:w-[3rem]' : 'h-8 w-[4.5rem]'
            }`}
          />
        ) : (
          <p
            className={
              compact
                ? 'text-[0.9375rem] font-black tabular-nums leading-none tracking-[-0.03em] text-[#111827] drop-shadow-sm sm:text-[1.125rem]'
                : requestsKpiValueClass
            }
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function MobileStat({
  label,
  value,
  loading = false,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  const backgroundSrc = requestsKpiBackground(label);

  return (
    <div
      className={`relative flex min-h-[6.25rem] min-w-0 flex-1 overflow-hidden rounded-[12px] p-3 sm:min-h-[6.5rem] sm:rounded-[14px] sm:p-3.5 ${
        backgroundSrc ? '' : 'bg-[#F5F5F5]'
      }`}
    >
      {backgroundSrc ? <RequestsKpiPhotoBackdrop label={label} /> : null}
      <RequestsKpiContent label={label} value={value} loading={loading} compact />
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
    <article className={`${apptHistoryKpiTile} h-full min-h-[8.25rem]`}>
      <RequestsKpiPhotoBackdrop label={label} />
      <RequestsKpiContent label={label} value={value} loading={loading} />
    </article>
  );
}

export function AppointmentsRequestsSummary({
  totalCount,
  todayCount,
  expiringCount,
  loading = false,
  mobileHeader,
  mobileFilter,
}: Props) {
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
            {mobileFilter ? <div className="shrink-0 self-start">{mobileFilter}</div> : null}
          </div>

          <div className="px-4 pb-4 pt-3 sm:pb-5 sm:pt-3.5">
            <div className="grid grid-cols-3 items-stretch gap-2.5 sm:gap-3">
              <MobileStat label="Всего" value={String(totalCount)} loading={loading} />
              <MobileStat label="Сегодня" value={String(todayCount)} loading={loading} />
              <MobileStat label="Скоро истекают" value={String(expiringCount)} loading={loading} />
            </div>
          </div>
        </section>
      ) : null}

      <div className="hidden min-w-0 flex-1 lg:grid lg:grid-cols-3 lg:gap-4">
        <DesktopStatBlock label="Всего" value={String(totalCount)} loading={loading} />
        <DesktopStatBlock label="Сегодня" value={String(todayCount)} loading={loading} />
        <DesktopStatBlock label="Скоро истекают" value={String(expiringCount)} loading={loading} />
      </div>
    </>
  );
}
