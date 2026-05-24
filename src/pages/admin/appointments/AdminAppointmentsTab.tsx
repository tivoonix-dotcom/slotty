import { useCallback, useEffect, useMemo, useState } from 'react';
import { preloadTabIntroImages } from '../useTabIntroImage';
import { Link } from 'react-router-dom';
import { HiInbox } from 'react-icons/hi2';
import { ADMIN_BILLING_PATH } from '../../../app/paths';
import { planBadgeLabel } from '../../../features/billing/model/masterPlans';
import { useMasterPlanEntitlements } from '../../../features/billing/useMasterPlanEntitlements';
import type {
  DemoAppointmentStatus,
  DemoMasterAppointment,
} from '../../../features/master/model/demoMasterAppointments';
import { AdminTabContentTransition } from '../shared/AdminTabContentTransition';
import { AdminToast } from '../shared/AdminToast';
import { useAdminToast } from '../shared/useAdminToast';
import {
  APPOINTMENTS_PAGE_BG,
  apptBillingBanner,
  apptEmptyIcon,
  apptGroupLabel,
  apptListTray,
  apptMonthLabel,
  apptPinkBtn,
  appointmentsDesktopCard,
  appointmentsDesktopTabsSticky,
  appointmentsShellCard,
} from './adminAppointmentsTheme';
import { AppointmentsPageHeader } from './AppointmentsPageHeader';
import { AppointmentsSectionTabs } from './AppointmentsSectionTabs';
import {
  AppointmentsActionSheet,
  type AppointmentActionConfig,
} from './AppointmentsActionSheet';
import { AppointmentsBottomTabBar } from './AppointmentsBottomTabBar';
import { AppointmentsEmptyState } from './AppointmentsEmptyState';
import { AppointmentsFiltersSheet } from './AppointmentsFiltersSheet';
import { AppointmentsQuickFilters } from './AppointmentsQuickFilters';
import { AppointmentsHistoryRow } from './AppointmentsHistoryRow';
import { AppointmentsHistorySummary } from './AppointmentsHistorySummary';
import { AppointmentsNearestCard } from './AppointmentsNearestCard';
import { APPOINTMENTS_TAB_INTRO_IMAGES } from './AppointmentsTabIntro';
import { AppointmentsRequestCard } from './AppointmentsRequestCard';
import { AppointmentsStatsCard } from './AppointmentsStatsCard';
import { AppointmentsUpcomingRow } from './AppointmentsUpcomingRow';
import {
  compareAppointmentsByDateAsc,
  compareAppointmentsByDateDesc,
  compareAppointmentsByPriceAsc,
  compareAppointmentsByPriceDesc,
  filterHistoryByPeriod,
  groupAppointmentsByDay,
  groupAppointmentsByMonth,
  isUpcomingConfirmed,
  pickNearestUpcoming,
  uniqueServiceTitles,
} from './appointmentsFormat';
import type {
  AppointmentsTabId,
  HistoryPeriodFilter,
  HistorySort,
  HistoryStatusFilter,
  RequestsSort,
  UpcomingSort,
} from './appointmentsTypes';

type Props = {
  appointments: DemoMasterAppointment[];
  onChangeAppointments: (rows: DemoMasterAppointment[]) => void | Promise<void>;
  onOpenDetail: (appointment: DemoMasterAppointment) => void;
};

function updateStatus(
  rows: DemoMasterAppointment[],
  id: string,
  status: DemoAppointmentStatus,
): DemoMasterAppointment[] {
  return rows.map((row) => (row.id === id ? { ...row, status } : row));
}

function apptLimitProgressClass(ratio: number): string {
  if (ratio >= 1) return 'bg-[#EF4444]';
  if (ratio >= 0.85) return 'bg-amber-400';
  return 'bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a]';
}

export function AdminAppointmentsTab({
  appointments,
  onChangeAppointments,
  onOpenDetail,
}: Props) {
  const [tab, setTab] = useState<AppointmentsTabId>('requests');
  const [actionConfig, setActionConfig] = useState<AppointmentActionConfig | null>(null);
  const [actionApiError, setActionApiError] = useState<string | null>(null);
  const { toast, showToast, showErrorToast, clearToast } = useAdminToast();

  const [requestsService, setRequestsService] = useState('all');
  const [requestsSort, setRequestsSort] = useState<RequestsSort>('newest');
  const [upcomingService, setUpcomingService] = useState('all');
  const [upcomingSort, setUpcomingSort] = useState<UpcomingSort>('date');
  const [historyStatus, setHistoryStatus] = useState<HistoryStatusFilter>('all');
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriodFilter>('all');
  const [historySort, setHistorySort] = useState<HistorySort>('newest');
  const [historyService, setHistoryService] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setFilterOpen(false);
  }, [tab]);

  useEffect(() => {
    preloadTabIntroImages(APPOINTMENTS_TAB_INTRO_IMAGES);
  }, []);

  const stats = useMemo(() => {
    const requests = appointments.filter((a) => a.status === 'pending').length;
    const upcoming = appointments.filter((a) => isUpcomingConfirmed(a)).length;
    const history = appointments.filter(
      (a) => a.status === 'completed' || a.status === 'cancelled',
    ).length;
    return { requests, upcoming, history };
  }, [appointments]);

  const pendingRows = useMemo(
    () => appointments.filter((a) => a.status === 'pending'),
    [appointments],
  );
  const upcomingRows = useMemo(
    () => appointments.filter((a) => isUpcomingConfirmed(a)),
    [appointments],
  );
  const historyRows = useMemo(
    () => appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled'),
    [appointments],
  );

  const requestsFiltered = useMemo(() => {
    let rows = pendingRows;
    if (requestsService !== 'all') {
      rows = rows.filter((a) => a.serviceTitle === requestsService);
    }
    return [...rows].sort(
      requestsSort === 'newest' ? compareAppointmentsByDateDesc : compareAppointmentsByDateAsc,
    );
  }, [pendingRows, requestsService, requestsSort]);

  const upcomingFiltered = useMemo(() => {
    let rows = upcomingRows;
    if (upcomingService !== 'all') {
      rows = rows.filter((a) => a.serviceTitle === upcomingService);
    }
    return [...rows].sort(
      upcomingSort === 'date' ? compareAppointmentsByDateAsc : compareAppointmentsByDateDesc,
    );
  }, [upcomingRows, upcomingService, upcomingSort]);

  const nearest = useMemo(() => pickNearestUpcoming(upcomingFiltered), [upcomingFiltered]);

  const upcomingRest = useMemo(() => {
    if (!nearest) return upcomingFiltered;
    return upcomingFiltered.filter((a) => a.id !== nearest.id);
  }, [upcomingFiltered, nearest]);

  const upcomingGroups = useMemo(
    () => groupAppointmentsByDay(upcomingRest),
    [upcomingRest],
  );

  const historySortFn = useMemo(() => {
    switch (historySort) {
      case 'oldest':
        return compareAppointmentsByDateAsc;
      case 'price_high':
        return compareAppointmentsByPriceDesc;
      case 'price_low':
        return compareAppointmentsByPriceAsc;
      default:
        return compareAppointmentsByDateDesc;
    }
  }, [historySort]);

  const historyFiltered = useMemo(() => {
    let rows = historyRows;
    if (historyService !== 'all') {
      rows = rows.filter((a) => a.serviceTitle === historyService);
    }
    if (historyStatus === 'completed') rows = rows.filter((a) => a.status === 'completed');
    if (historyStatus === 'cancelled') rows = rows.filter((a) => a.status === 'cancelled');
    rows = filterHistoryByPeriod(rows, historyPeriod);
    return rows;
  }, [historyRows, historyService, historyStatus, historyPeriod]);

  const historyGroups = useMemo(
    () => groupAppointmentsByMonth(historyFiltered, historySortFn),
    [historyFiltered, historySortFn],
  );

  const historySummary = useMemo(() => {
    const completed = historyRows.filter((a) => a.status === 'completed');
    const cancelled = historyRows.filter((a) => a.status === 'cancelled');
    const earned = completed.reduce((s, a) => s + (Number.isFinite(a.priceByn) ? a.priceByn : 0), 0);
    return {
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      earnedTotal: earned,
    };
  }, [historyRows]);

  const {
    planId: billingPlanId,
    limits: billingLimits,
    monthlyAppointments: monthlyApptCount,
    freeAppointmentLimitReached: atFreeApptLimit,
    freeAppointmentLimitAlmostReached: almostFreeAppt,
  } = useMasterPlanEntitlements();
  const freeApptCap = billingLimits.maxMonthlyAppointments ?? 20;
  const apptUsageRatio = Math.min(1, monthlyApptCount / freeApptCap);

  const openAction = useCallback((config: AppointmentActionConfig) => {
    setActionApiError(null);
    setActionConfig(config);
  }, []);

  const closeAction = useCallback(() => {
    setActionApiError(null);
    setActionConfig(null);
  }, []);

  const applyAction = useCallback(
    async (rejectReason?: string) => {
      if (!actionConfig) return;
      const { appointment, nextStatus } = actionConfig;
      const nextRows = updateStatus(appointments, appointment.id, nextStatus);
      setActionApiError(null);
      try {
        await Promise.resolve(onChangeAppointments(nextRows));
        if (nextStatus === 'confirmed') {
          showToast('Запись подтверждена');
          setTab('upcoming');
        } else if (nextStatus === 'completed') {
          showToast('Запись завершена');
          setTab('history');
        } else if (nextStatus === 'cancelled') {
          const suffix = rejectReason ? `: ${rejectReason}` : '';
          showToast(
            actionConfig.kind === 'reject' ? `Заявка отклонена${suffix}` : `Запись отменена${suffix}`,
          );
          setTab('history');
        }
        setActionConfig(null);
      } catch (e) {
        showErrorToast(e instanceof Error ? e.message : 'Не удалось обновить запись');
      }
    },
    [actionConfig, appointments, onChangeAppointments, showErrorToast, showToast],
  );

  const servicePills = (rows: DemoMasterAppointment[]) => [
    { id: 'all', label: 'Все услуги' },
    ...uniqueServiceTitles(rows).map((title) => ({ id: title, label: title })),
  ];

  const sheetFilterActive =
    tab === 'requests'
      ? requestsService !== 'all'
      : tab === 'upcoming'
        ? upcomingService !== 'all'
        : historyService !== 'all';

  const sheetAriaLabel = useMemo(() => {
    if (tab === 'requests') {
      return requestsService === 'all' ? 'Все услуги' : `Услуга: ${requestsService}`;
    }
    if (tab === 'upcoming') {
      return upcomingService === 'all' ? 'Все услуги' : `Услуга: ${upcomingService}`;
    }
    return historyService === 'all' ? 'Все услуги и фильтры' : `Услуга: ${historyService}`;
  }, [tab, requestsService, upcomingService, historyService]);

  const resetFilters = useCallback(() => {
    if (tab === 'requests') {
      setRequestsService('all');
      setRequestsSort('newest');
      return;
    }
    if (tab === 'upcoming') {
      setUpcomingService('all');
      setUpcomingSort('date');
      return;
    }
    setHistoryStatus('all');
    setHistoryPeriod('all');
    setHistorySort('newest');
    setHistoryService('all');
  }, [tab]);

  const renderRequests = () => {
    if (!requestsFiltered.length) {
      return (
        <AppointmentsEmptyState
          title="Новых заявок пока нет"
          text="Когда клиент отправит заявку на запись, она появится здесь"
          hint="Заявку можно будет подтвердить или отклонить"
          icon={
            <span className={apptEmptyIcon}>
              <HiInbox className="h-8 w-8" aria-hidden />
            </span>
          }
        />
      );
    }
    return (
      <ul className="flex flex-col gap-3">
        {requestsFiltered.map((a) => (
          <li key={a.id}>
            <AppointmentsRequestCard
              appointment={a}
              onConfirm={() =>
                openAction({
                  kind: 'confirm',
                  title: 'Подтвердить заявку?',
                  text: `Клиент ${a.clientName} увидит, что запись подтверждена.`,
                  buttonLabel: 'Подтвердить',
                  nextStatus: 'confirmed',
                  appointment: a,
                })
              }
              onReject={() =>
                openAction({
                  kind: 'reject',
                  title: 'Отклонить заявку?',
                  text: `Заявка клиента ${a.clientName} будет перенесена в историю.`,
                  buttonLabel: 'Отклонить',
                  nextStatus: 'cancelled',
                  appointment: a,
                })
              }
            />
          </li>
        ))}
      </ul>
    );
  };

  const renderUpcoming = () => {
    if (!upcomingFiltered.length) {
      return (
        <AppointmentsEmptyState
          title="Предстоящих записей нет"
          text="Подтверждённые записи появятся здесь"
          action={
            stats.requests > 0 ? (
              <button type="button" onClick={() => setTab('requests')} className={apptPinkBtn}>
                Перейти к заявкам ({stats.requests})
              </button>
            ) : undefined
          }
        />
      );
    }
    return (
      <div className="space-y-4">
        {nearest ? <AppointmentsNearestCard appointment={nearest} onOpen={() => onOpenDetail(nearest)} /> : null}
        {upcomingGroups.map((group) => (
          <section key={group.dayIso}>
            <h3 className={`mb-2 px-0.5 ${apptGroupLabel}`}>{group.label}</h3>
            <ul className="flex flex-col gap-3">
              {group.items.map((a) => (
                <li key={a.id}>
                  <AppointmentsUpcomingRow appointment={a} onOpen={() => onOpenDetail(a)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  };

  const renderHistory = () => {
    if (!historyRows.length) {
      return (
        <AppointmentsEmptyState
          title="Истории записей пока нет"
          text="Завершённые и отменённые записи появятся здесь"
        />
      );
    }
    if (!historyFiltered.length) {
      return (
        <AppointmentsEmptyState
          title="Ничего не найдено"
          text="Попробуйте изменить фильтры статуса или периода"
        />
      );
    }
    return (
      <div className="space-y-4">
        <AppointmentsHistorySummary
          completedCount={historySummary.completedCount}
          earnedTotal={historySummary.earnedTotal}
          cancelledCount={historySummary.cancelledCount}
        />
        {historyGroups.map((group) => (
          <section key={group.monthKey}>
            <h3 className={apptMonthLabel}>{group.label}</h3>
            <ul className="flex flex-col gap-3">
              {group.items.map((a) => (
                <li key={a.id}>
                  <AppointmentsHistoryRow appointment={a} onOpen={() => onOpenDetail(a)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  };

  const billingBanner =
    billingPlanId === 'free' ? (
      <section
        className={`${apptBillingBanner} ${
          atFreeApptLimit ? 'border-amber-300 ring-amber-100' : almostFreeAppt ? 'border-amber-200' : ''
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 flex-1 text-[14px] font-semibold text-[#374151]">
            {planBadgeLabel(billingPlanId)} · {monthlyApptCount} / {freeApptCap} записей в месяце
          </p>
          <Link
            to={ADMIN_BILLING_PATH}
            className="inline-flex shrink-0 rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-3 py-1.5 text-[12px] font-bold text-white shadow-[0_6px_16px_rgba(255,95,122,0.28)]"
          >
            Мой тариф
          </Link>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#FFF1F4] ring-1 ring-[#FDE8ED]/80">
          <div
            className={`h-full rounded-full transition-all duration-300 ${apptLimitProgressClass(apptUsageRatio)}`}
            style={{ width: `${apptUsageRatio * 100}%` }}
            role="progressbar"
            aria-valuenow={monthlyApptCount}
            aria-valuemin={0}
            aria-valuemax={freeApptCap}
            aria-label={`Записей в месяце: ${monthlyApptCount} из ${freeApptCap}`}
          />
        </div>
        {atFreeApptLimit || almostFreeAppt ? (
          <p className="mt-1.5 text-[12px] font-semibold text-amber-800/85">
            {atFreeApptLimit
              ? 'Лимит Free исчерпан — откройте Pro в тарифах.'
              : 'Почти достигнут лимит Free на этот месяц.'}
          </p>
        ) : null}
      </section>
    ) : null;

  const filterSheets = (
    <>
      {tab === 'requests' ? (
        <AppointmentsFiltersSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          mode="requests"
          serviceOptions={servicePills(pendingRows)}
          service={requestsService}
          onService={setRequestsService}
          sort={requestsSort}
          onSort={setRequestsSort}
          onReset={resetFilters}
        />
      ) : null}
      {tab === 'upcoming' ? (
        <AppointmentsFiltersSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          mode="upcoming"
          serviceOptions={servicePills(upcomingRows)}
          service={upcomingService}
          onService={setUpcomingService}
          sort={upcomingSort}
          onSort={setUpcomingSort}
          onReset={resetFilters}
        />
      ) : null}
      {tab === 'history' ? (
        <AppointmentsFiltersSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          mode="history"
          serviceOptions={servicePills(historyRows)}
          service={historyService}
          onService={setHistoryService}
          sort={historySort}
          onSort={setHistorySort}
          status={historyStatus}
          onStatus={setHistoryStatus}
          period={historyPeriod}
          onPeriod={setHistoryPeriod}
          onReset={resetFilters}
        />
      ) : null}
    </>
  );

  const toolbar = (
    <div className={apptListTray}>
      <AppointmentsQuickFilters
        tab={tab}
        sheetActive={sheetFilterActive}
        sheetOpen={filterOpen}
        onOpenSheet={() => setFilterOpen(true)}
        sheetAriaLabel={sheetAriaLabel}
        requestsSort={requestsSort}
        onRequestsSort={setRequestsSort}
        upcomingSort={upcomingSort}
        onUpcomingSort={setUpcomingSort}
        historySort={historySort}
        onHistorySort={setHistorySort}
        historyStatus={historyStatus}
        onHistoryStatus={setHistoryStatus}
        historyPeriod={historyPeriod}
        onHistoryPeriod={setHistoryPeriod}
      />
    </div>
  );

  const tabPanels = (
    <AdminTabContentTransition activeKey={tab} className="min-w-0">
      {tab === 'requests' ? renderRequests() : null}
      {tab === 'upcoming' ? renderUpcoming() : null}
      {tab === 'history' ? renderHistory() : null}
    </AdminTabContentTransition>
  );

  const mobileBody = (
    <section
      className={`-mx-4 min-w-0 space-y-4 overflow-x-hidden px-4 pb-[calc(5.75rem+1.25rem)] lg:hidden ${APPOINTMENTS_PAGE_BG}`}
    >
      <div className="relative z-0">
        <AppointmentsPageHeader tab={tab} stats={stats} />
        <div className="relative z-10 -mt-7 lg:hidden">
          <AppointmentsStatsCard
            requests={stats.requests}
            upcoming={stats.upcoming}
            history={stats.history}
            className="border-[#FDE8ED] shadow-[0_14px_40px_rgba(255,95,122,0.12)]"
          />
        </div>
      </div>
      {billingBanner}
      {toolbar}
      {tabPanels}
    </section>
  );

  const desktopBody = (
    <div className={`${appointmentsShellCard} space-y-6`}>
      <div className={`${appointmentsDesktopCard} ${appointmentsDesktopTabsSticky}`}>
        <AppointmentsSectionTabs active={tab} onChange={setTab} counts={stats} />
      </div>
      <div className="min-w-0 space-y-6">
        <AppointmentsPageHeader tab={tab} stats={stats} />
        {billingBanner}
        {toolbar}
        {tabPanels}
      </div>
    </div>
  );

  return (
    <>
      <AppointmentsBottomTabBar active={tab} onChange={setTab} variant="mobile" />
      {mobileBody}
      {desktopBody}
      <AdminToast toast={toast} onDismiss={clearToast} />
      {filterSheets}
      <AppointmentsActionSheet
        config={actionConfig}
        apiError={actionApiError}
        onClose={closeAction}
        onConfirm={(reason) => void applyAction(reason)}
      />
    </>
  );
}
