import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  HiBanknotes,
  HiBell,
  HiCalendar,
  HiCheckCircle,
  HiClock,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import {
  appointmentStatusLabel,
  type OverviewDayStat,
} from '../../../features/master/model/demoMasterAppointments';
import { ADMIN_SCHEDULE_PATH } from '../../../app/paths';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { countActiveServices, assessMasterBookingReadiness } from '../masterReadiness';
import { OverviewOpsPanel } from './OverviewOpsPanel';
import type { OverviewOpsSnapshot } from './overviewOpsSnapshot';
import {
  overviewCard,
  overviewCardPad,
  overviewDesktopCard,
  overviewDesktopCardPad,
  overviewIconCircle,
  overviewPinkBtn,
} from './adminOverviewTheme';
import { OverviewKpiCarousel, OverviewKpiStatCard } from './OverviewKpiBlocks';
import { formatAppointmentWhenRu, formatBynRu } from './overviewFormat';
import {
  OverviewVisitsBarChart,
  OverviewRevenueLineChart,
  OverviewHeroEmpty,
  OverviewCompactMetricCard,
  OverviewSectionCard,
  OverviewWideMetricCard,
} from './OverviewSharedUi';
import { OverviewSummaryHeroBackground } from './OverviewSummaryHeroBackground';

type SummaryProps = {
  metrics: {
    totalRevenue: number;
    totalVisits: number;
    nearest: import('../../../features/master/model/demoMasterAppointments').DemoMasterAppointment | null;
    hasAny: boolean;
  };
  serviceCount: number;
  appointmentsPath: string;
  dayStats: OverviewDayStat[];
  draft: MasterDraft;
  onOpenNearest: () => void;
  ops: OverviewOpsSnapshot;
  opsLoading?: boolean;
  slotsLoadError?: string | null;
  profileCompletionPercent?: number;
  profileComplete?: boolean;
  onOpenAppointmentId?: (id: string) => void;
  publicationStatus?: import('../../../features/admin/lib/profileCompletion').MasterPublicationStatus | null;
  useCabinetApi: boolean;
  onPersistDraft: (next: MasterDraft) => void;
  appointments: import('../../../features/master/model/demoMasterAppointments').DemoMasterAppointment[];
};

function SoftIcon({
  children,
  tone = 'pink',
}: {
  children: ReactNode;
  tone?: 'pink' | 'green' | 'dark';
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-[#ECFDF3] text-[#22C55E]'
      : tone === 'dark'
        ? 'bg-white/12 text-white'
        : 'bg-[#FFF1F4] text-[#ff5f7a]';

  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${toneClass}`}
    >
      {children}
    </span>
  );
}

function SummaryMobileHeroCard({
  firstName,
  totalVisits,
  totalRevenue,
  appointmentsPath,
}: {
  firstName: string;
  totalVisits: number;
  totalRevenue: number;
  appointmentsPath: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[16px] p-5 text-white">
      <OverviewSummaryHeroBackground />

      <div className="relative z-10 min-w-0">
        <h1 className="text-[22px] font-black leading-tight tracking-[-0.05em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
          Привет, {firstName}. Сегодня всё под контролем.
        </h1>

        <p className="mt-3 text-[14px] font-semibold leading-relaxed text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
          Быстрая сводка по записям, доходу, ближайшему клиенту и расписанию.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[14px] bg-white/10 px-3 py-3">
            <p className="text-[11px] font-bold text-white/60">Записей</p>
            <p className="mt-1 text-[22px] font-black leading-none tabular-nums tracking-[-0.06em] text-white">
              {totalVisits}
            </p>
          </div>

          <div className="rounded-[14px] bg-white/10 px-3 py-3">
            <p className="text-[11px] font-bold text-white/60">Доход</p>
            <p className="mt-1 text-[18px] font-black leading-none tabular-nums tracking-[-0.05em] text-white">
              {formatBynRu(totalRevenue)}
            </p>
          </div>
        </div>

        <Link
          to={appointmentsPath}
          className="mt-4 inline-flex w-full min-h-11 items-center justify-center rounded-[12px] bg-white px-4 text-[14px] font-bold text-[#111827] transition active:scale-[0.98]"
        >
          Все записи
        </Link>
      </div>
    </section>
  );
}

function OverviewSummaryPanelMobile({
  metrics,
  serviceCount,
  appointmentsPath,
  dayStats,
  draft,
  onOpenNearest,
  ops,
  opsLoading,
  slotsLoadError,
  profileCompletionPercent,
  profileComplete,
  onOpenAppointmentId,
  publicationStatus,
  useCabinetApi,
  onPersistDraft,
  appointments,
}: SummaryProps) {
  const { totalRevenue, totalVisits, nearest } = metrics;
  const activeServiceCount = countActiveServices(draft.services);
  const profileReady = assessMasterBookingReadiness({
    draft,
    activeSlotCount: ops.activeFutureSlotCount,
    isPublished: publicationStatus === 'published',
  }).readyToAcceptBookings;
  const hasAny = metrics.hasAny || totalRevenue > 0 || totalVisits > 0;
  const avgCheck = totalVisits > 0 ? Math.round(totalRevenue / totalVisits) : 0;
  const displayName = draft.name?.trim() || 'Мастер';
  const firstName = displayName.split(/\s+/)[0] || 'Мастер';

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden lg:hidden">
      <SummaryMobileHeroCard
        firstName={firstName}
        totalVisits={totalVisits}
        totalRevenue={totalRevenue}
        appointmentsPath={appointmentsPath}
      />

      <OverviewOpsPanel
        ops={ops}
        loading={opsLoading}
        slotsLoadError={slotsLoadError}
        profileCompletionPercent={profileCompletionPercent}
        profileComplete={profileComplete}
        onOpenAppointment={onOpenAppointmentId}
        activeServiceCount={activeServiceCount}
        masterId={draft.masterId}
        profileReady={profileReady}
        draft={draft}
        useCabinetApi={useCabinetApi}
        appointments={appointments}
        onPersistDraft={onPersistDraft}
      />

      {!hasAny ? <OverviewHeroEmpty /> : null}

      <OverviewWideMetricCard
        icon={<HiWallet className="h-7 w-7" aria-hidden />}
        label="Доход за период"
        value={formatBynRu(totalRevenue)}
        sub={hasAny ? 'Общая сумма активных и завершённых записей' : 'Пока данных за период нет'}
      />

      <div className="flex min-w-0 gap-2">
        <OverviewCompactMetricCard
          icon={<HiCalendar className="h-[18px] w-[18px]" aria-hidden />}
          label="Записей"
          value={String(totalVisits)}
          sub="за период"
        />

        <OverviewCompactMetricCard
          icon={<HiUsers className="h-[18px] w-[18px]" aria-hidden />}
          label="Услуг"
          value={String(serviceCount)}
          sub="в каталоге"
        />

        <OverviewCompactMetricCard
          icon={<HiBanknotes className="h-[18px] w-[18px]" aria-hidden />}
          label="Ср. чек"
          value={avgCheck > 0 ? formatBynRu(avgCheck) : '0 BYN'}
          sub="за период"
        />
      </div>

      <section className={`${overviewCard} ${overviewCardPad}`}>
        {nearest ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className={`${overviewIconCircle} h-12 w-12 rounded-[18px]`}>
                <HiClock className="h-6 w-6" aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[#F47C8C]">Ближайшая запись</p>
                <p className="mt-1 text-[21px] font-bold tracking-[-0.05em] text-[#111827]">
                  {formatAppointmentWhenRu(nearest.date, nearest.time)}
                </p>
                <p className="mt-2 text-[15px] font-bold text-[#111827]">
                  {nearest.clientName}
                </p>
                <p className="mt-1 text-[13px] text-[#6B7280]">
                  {nearest.serviceTitle}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#FFF1F4] px-3 py-1 text-[12px] font-bold text-[#F47C8C]">
                    {formatBynRu(nearest.priceByn)}
                  </span>

                  <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-[12px] font-bold text-[#6B7280]">
                    {appointmentStatusLabel(nearest.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenNearest}
                className={`flex min-h-12 items-center justify-center text-[14px] font-bold ${overviewPinkBtn}`}
              >
                Открыть
              </button>

              <Link
                to={appointmentsPath}
                className="flex min-h-12 items-center justify-center rounded-[18px] bg-[#F3F4F6] text-[14px] font-bold text-[#111827] transition hover:bg-[#EAECEF] active:scale-[0.98]"
              >
                Все записи
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className={`${overviewIconCircle} h-12 w-12 rounded-[18px]`}>
              <HiBell className="h-6 w-6" aria-hidden />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-bold tracking-[-0.04em] text-[#111827]">
                Ближайших записей нет
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
                Новые записи появятся здесь.
              </p>
            </div>
          </div>
        )}
      </section>

      <OverviewSectionCard
        title="Динамика записей"
        subtitle="Наведите на график — увидите число записей по дням"
        icon={<HiCalendar className="h-5 w-5" aria-hidden />}
      >
        <OverviewVisitsBarChart stats={dayStats} size="large" emptyHint="Записей за период нет" />
      </OverviewSectionCard>

      <OverviewSectionCard
        title="Динамика дохода"
        subtitle="Выручка по завершённым записям за каждый день"
        icon={<HiBanknotes className="h-5 w-5" aria-hidden />}
      >
        <OverviewRevenueLineChart stats={dayStats} size="large" emptyHint="Дохода за период нет" />
      </OverviewSectionCard>
    </div>
  );
}

function DesktopHeroCard({
  firstName,
  totalVisits,
  totalRevenue,
  appointmentsPath,
  embedded = false,
}: {
  firstName: string;
  totalVisits: number;
  totalRevenue: number;
  appointmentsPath: string;
  /** Внутри общей белой карточки с KPI-каруселью (без отдельной тени/скругления). */
  embedded?: boolean;
}) {
  return (
    <section
      className={
        embedded
          ? 'relative overflow-hidden p-6 text-white lg:p-8'
          : 'relative overflow-hidden rounded-[32px] p-6 text-white shadow-[0_22px_65px_rgba(17,24,39,0.18)] lg:p-8'
      }
    >
      <OverviewSummaryHeroBackground />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>


          <h1 className="mt-8 max-w-[760px] text-[52px] font-black leading-[0.95] tracking-[-0.08em] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)]">
            Привет, {firstName}. Сегодня всё под контролем.
          </h1>

          <p className="mt-6 max-w-[660px] text-[17px] font-semibold leading-8 text-white/90 drop-shadow-[0_1px_10px_rgba(0,0,0,0.4)]">
            Быстрая сводка по записям, доходу, ближайшему клиенту и расписанию.
            Всё главное видно сразу, без лишних действий.
          </p>
        </div>

        <div className="rounded-[28px] bg-white/12 p-5 backdrop-blur">
          <div className="mb-5 flex items-center gap-3">
            <SoftIcon tone="dark">
              <HiCheckCircle className="h-6 w-6" />
            </SoftIcon>

            <div>
              <p className="text-[15px] font-black text-white">Сводка периода</p>
              <p className="mt-1 text-[12px] font-semibold text-white/60">
                записи и доход
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[22px] bg-white/10 p-4">
              <p className="text-[12px] font-bold text-white/60">Записей</p>
              <p className="mt-2 text-[32px] font-black leading-none tracking-[-0.08em] text-white">
                {totalVisits}
              </p>
            </div>

            <div className="rounded-[22px] bg-white/10 p-4">
              <p className="text-[12px] font-bold text-white/60">Доход</p>
              <p className="mt-2 text-[24px] font-black leading-none tracking-[-0.07em] text-white">
                {formatBynRu(totalRevenue)}
              </p>
            </div>
          </div>

          <Link
            to={appointmentsPath}
            className="mt-4 inline-flex w-full items-center justify-center rounded-[20px] bg-white px-5 py-3 text-[14px] font-black text-[#111827] transition hover:-translate-y-0.5"
          >
            Все записи
          </Link>
        </div>
      </div>
    </section>
  );
}

function DesktopNearestCard({
  nearest,
  appointmentsPath,
  onOpenNearest,
}: {
  nearest: SummaryProps['metrics']['nearest'];
  appointmentsPath: string;
  onOpenNearest: () => void;
}) {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <SoftIcon>
            <HiClock className="h-6 w-6" aria-hidden />
          </SoftIcon>

          <div>
            <h2 className="text-[20px] font-black tracking-[-0.05em] text-[#111827]">
              Ближайшая запись
            </h2>
            <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
              Следующий клиент
            </p>
          </div>
        </div>
      </div>

      {nearest ? (
        <div>
          <p className="text-[30px] font-black tracking-[-0.07em] text-[#111827]">
            {formatAppointmentWhenRu(nearest.date, nearest.time)}
          </p>

          <div className="mt-5 rounded-[20px] bg-[#f6f7fb] p-5">
            <p className="text-[17px] font-black text-[#111827]">
              {nearest.clientName}
            </p>

            <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
              {nearest.serviceTitle}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[12px] font-black text-[#ff5f7a]">
                {formatBynRu(nearest.priceByn)}
              </span>

              <span className="rounded-full bg-[#F3F4F6] px-3 py-1.5 text-[12px] font-black text-[#6B7280]">
                {appointmentStatusLabel(nearest.status)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenNearest}
            className="mt-5 w-full rounded-[20px] bg-[#ff5f7a] px-5 py-3 text-[14px] font-black text-white shadow-[0_12px_28px_rgba(255,95,122,0.25)] transition hover:bg-[#f04f6c]"
          >
            Открыть запись
          </button>
        </div>
      ) : (
        <div className="rounded-[20px] bg-[#f6f7fb] p-6 text-center">
          <HiBell className="mx-auto h-10 w-10 text-[#D1D5DB]" aria-hidden />

          <p className="mt-4 text-[17px] font-black text-[#111827]">
            Записей пока нет
          </p>

          <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">
            Когда клиент запишется, ближайшая запись появится здесь.
          </p>

          <Link
            to={appointmentsPath}
            className="mt-5 inline-flex items-center justify-center rounded-[18px] bg-[#FFF1F4] px-5 py-3 text-[14px] font-black text-[#ff5f7a] transition hover:bg-[#FFE1E8]"
          >
            Перейти к записям
          </Link>
        </div>
      )}
    </section>
  );
}

function DesktopScheduleCard({
  fillPercent,
  schedulePath,
}: {
  fillPercent: number;
  schedulePath: string;
}) {
  const percent = Math.min(100, Math.max(0, fillPercent));
  const isEmpty = percent === 0;

  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <SoftIcon>
            <HiCalendar className="h-6 w-6" aria-hidden />
          </SoftIcon>

          <div>
            <h2 className="text-[20px] font-black tracking-[-0.05em] text-[#111827]">
              Расписание сегодня
            </h2>
            <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
              Заполненность окон
            </p>
          </div>
        </div>

        {!isEmpty ? (
          <span className="text-[30px] font-black tracking-[-0.08em] text-[#111827]">
            {percent}%
          </span>
        ) : null}
      </div>

      {isEmpty ? (
        <div className="rounded-[20px] bg-[#f6f7fb] p-6 text-center">
          <HiCalendar className="mx-auto h-10 w-10 text-[#D1D5DB]" aria-hidden />

          <p className="mt-4 text-[17px] font-black text-[#111827]">Окон на сегодня нет</p>

          <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">
            Добавьте рабочие окна в расписании — здесь появится заполненность.
          </p>

          <Link
            to={schedulePath}
            className="mt-5 inline-flex items-center justify-center rounded-[18px] bg-[#FFF1F4] px-5 py-3 text-[14px] font-black text-[#ff5f7a] transition hover:bg-[#FFE1E8]"
          >
            Перейти к расписанию
          </Link>
        </div>
      ) : (
        <div className="rounded-[20px] bg-[#f6f7fb] p-5">
          <div className="h-3 overflow-hidden rounded-full bg-[#FFE8EE]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff8aa0] to-[#ff5f7a] transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          <p className="mt-4 text-[13px] font-semibold leading-relaxed text-[#6B7280]">
            {percent >= 80
              ? 'Сегодня почти все окна заняты — осталось немного свободного времени.'
              : percent >= 40
                ? 'Есть свободные окна — клиенты ещё могут записаться.'
                : 'Много свободного времени — можно открыть дополнительные окна.'}
          </p>
        </div>
      )}
    </section>
  );
}

function visitsCountBadgeLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} записей`;
  if (mod10 === 1) return `${n} запись`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} записи`;
  return `${n} записей`;
}

function DesktopChartCard({
  dayStats,
  totalVisits,
}: {
  dayStats: OverviewDayStat[];
  totalVisits: number;
}) {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Динамика записей
          </h2>

          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            Наведите на график — увидите детали по каждому дню
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-[#FFF1F4] px-4 py-2 text-[12px] font-black text-[#ff5f7a]">
          {visitsCountBadgeLabel(totalVisits)}
        </span>
      </div>

      <OverviewVisitsBarChart stats={dayStats} size="large" emptyHint="Записей за период нет" />
    </section>
  );
}

function DesktopRevenueChartCard({
  dayStats,
  totalRevenue,
}: {
  dayStats: OverviewDayStat[];
  totalRevenue: number;
}) {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">Динамика дохода</h2>
          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            Выручка по завершённым записям — наведите на график для суммы за день
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-[#FFF1F4] px-4 py-2 text-[12px] font-black text-[#ff5f7a]">
          {formatBynRu(totalRevenue)}
        </span>
      </div>

      <OverviewRevenueLineChart stats={dayStats} size="large" emptyHint="Дохода за период нет" />
    </section>
  );
}

function OverviewSummaryPanelDesktop({
  metrics,
  serviceCount,
  appointmentsPath,
  dayStats,
  draft,
  onOpenNearest,
  ops,
  opsLoading,
  slotsLoadError,
  profileCompletionPercent,
  profileComplete,
  onOpenAppointmentId,
  publicationStatus,
  useCabinetApi,
  onPersistDraft,
  appointments,
}: SummaryProps) {
  const { totalRevenue, totalVisits, nearest } = metrics;
  const activeServiceCount = countActiveServices(draft.services);
  const profileReady = assessMasterBookingReadiness({
    draft,
    activeSlotCount: ops.activeFutureSlotCount,
    isPublished: publicationStatus === 'published',
  }).readyToAcceptBookings;
  const avgCheck = totalVisits > 0 ? Math.round(totalRevenue / totalVisits) : 0;
  const fillPercent = ops.scheduleFillPercent;
  const displayName = draft.name?.trim() || 'Мастер';
  const firstName = displayName.split(/\s+/)[0] || 'Мастер';

  return (
    <div className="hidden min-w-0 space-y-5 overflow-x-hidden lg:block lg:space-y-6">
      <div className={`overflow-hidden ${overviewDesktopCard}`}>
        <DesktopHeroCard
          embedded
          firstName={firstName}
          totalVisits={totalVisits}
          totalRevenue={totalRevenue}
          appointmentsPath={appointmentsPath}
        />

        <div className="bg-white px-3 pb-4 pt-1 sm:px-4">
          <OverviewKpiCarousel>
            <OverviewKpiStatCard
              surface="carousel"
              label="Доход"
              value={formatBynRu(totalRevenue)}
              hint="За выбранный период"
              icon={<HiWallet className="h-5 w-5" aria-hidden />}
            />
            <OverviewKpiStatCard
              surface="carousel"
              label="Записи"
              value={String(totalVisits)}
              hint="Активные и завершённые"
              icon={<HiCalendar className="h-5 w-5" aria-hidden />}
            />
            <OverviewKpiStatCard
              surface="carousel"
              label="Услуги"
              value={String(serviceCount)}
              hint="Добавлены в каталог"
              icon={<HiUsers className="h-5 w-5" aria-hidden />}
            />
            <OverviewKpiStatCard
              surface="carousel"
              label="Средний чек"
              value={avgCheck > 0 ? formatBynRu(avgCheck) : '0 BYN'}
              hint="По всем записям"
              icon={<HiBanknotes className="h-5 w-5" aria-hidden />}
            />
          </OverviewKpiCarousel>
        </div>
      </div>

      <OverviewOpsPanel
        ops={ops}
        loading={opsLoading}
        slotsLoadError={slotsLoadError}
        profileCompletionPercent={profileCompletionPercent}
        profileComplete={profileComplete}
        onOpenAppointment={onOpenAppointmentId}
        activeServiceCount={activeServiceCount}
        masterId={draft.masterId}
        profileReady={profileReady}
        draft={draft}
        useCabinetApi={useCabinetApi}
        appointments={appointments}
        onPersistDraft={onPersistDraft}
      />

      <DesktopChartCard dayStats={dayStats} totalVisits={totalVisits} />

      <DesktopRevenueChartCard dayStats={dayStats} totalRevenue={totalRevenue} />

      <section className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <DesktopNearestCard
          nearest={nearest}
          appointmentsPath={appointmentsPath}
          onOpenNearest={onOpenNearest}
        />

        <DesktopScheduleCard fillPercent={fillPercent} schedulePath={ADMIN_SCHEDULE_PATH} />
      </section>
    </div>
  );
}

export function OverviewSummaryPanel(props: SummaryProps) {
  return (
    <>
      <OverviewSummaryPanelMobile {...props} />
      <OverviewSummaryPanelDesktop {...props} />
    </>
  );
}