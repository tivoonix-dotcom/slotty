import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ADMIN_BILLING_PATH, ADMIN_SCHEDULE_PATH, ADMIN_SERVICES_PATH } from '../../../app/paths';
import { planBadgeLabel } from '../../../features/billing/model/masterPlans';
import { useMasterPlanEntitlements } from '../../../features/billing/useMasterPlanEntitlements';
import type {
  DemoAppointmentStatus,
  DemoMasterAppointment,
} from '../../../features/master/model/demoMasterAppointments';
import { isoDateLocal } from '../../../features/master/model/demoMasterAppointments';
import { AdminDesktopSectionTabsShell } from '../shared/AdminDesktopSectionTabsShell';
import { AdminTabContentTransition } from '../shared/AdminTabContentTransition';
import { AdminToast } from '../shared/AdminToast';
import { useAdminToast } from '../shared/useAdminToast';
import {
  APPOINTMENTS_PAGE_BG,
  APPOINTMENTS_REQUESTS_EMPTY_ILLUSTRATION_SRC,
  apptBillingBanner,
  apptCardShell,
  apptGroupLabel,
  apptListGap,
  apptMonthLabel,
  apptOutlineBtn,
  apptPinkBtn,
  appointmentsDesktopCardPad,
  appointmentsShellCard,
  appointmentsTabPanelShell,
  APPOINTMENTS_TAB_BAR_SCROLL_PAD,
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
import { AppointmentsHistoryRow } from './AppointmentsHistoryRow';
import { AppointmentsHistorySummary } from './AppointmentsHistorySummary';
import { AppointmentsHistoryExportMenu } from './AppointmentsHistoryExportMenu';
import {
  AppointmentsHistoryListHeader,
  AppointmentsHistoryToolbar,
  AppointmentsRequestsListHeader,
  AppointmentsRequestsToolbar,
  AppointmentsUpcomingListHeader,
  AppointmentsUpcomingToolbar,
} from './AppointmentsHistoryToolbar';
import { buildHistoryExportFiltersLabel } from './historyExportFilterLabel';
import { tabSummaryCopy } from './appointmentsTabSummaryModel';
import {
  computeHistoryEarnedTrend,
  historyEarnedTrendPercent as computeHistoryEarnedTrendPercent,
} from './historyEarnedTrend';
import { AppointmentsRequestCard } from './AppointmentsRequestCard';
import { APPOINTMENTS_REQUESTS_GUIDE_DETAIL } from './appointmentsRequestsGuide';
import { AppointmentsRequestsSummary } from './AppointmentsRequestsSummary';
import { AppointmentsUpcomingCalendar } from './AppointmentsUpcomingCalendar';
import { AppointmentsUpcomingRow } from './AppointmentsUpcomingRow';
import { AppointmentsUpcomingSummary } from './AppointmentsUpcomingSummary';
import { AppointmentsUpcomingViewToggle } from './AppointmentsUpcomingViewToggle';
import {
  compareAppointmentsByDateAsc,
  compareAppointmentsByDateDesc,
  compareAppointmentsByPriceAsc,
  compareAppointmentsByPriceDesc,
  filterHistoryByPeriod,
  filterHistoryBySearch,
  filterRequestsByFeature,
  filterRequestsByPeriod,
  groupAppointmentsByDay,
  groupAppointmentsByMonth,
  isHistoryAppointment,
  isRequestExpiringSoon,
  isUpcomingTabAppointment,
  pickNearestUpcoming,
  uniqueServiceTitles,
} from './appointmentsFormat';
import { isRequiresAttentionAppointment } from '../../../features/appointments/masterAppointmentLifecycle';
import type {
  AppointmentsTabId,
  HistoryPeriodFilter,
  HistorySort,
  HistoryStatusFilter,
  RequestsFeatureFilter,
  RequestsPeriodFilter,
  RequestsSort,
  UpcomingSort,
  UpcomingViewMode,
} from './appointmentsTypes';
import { AppointmentsLoadMore } from './AppointmentsLoadMore';
import { AppointmentsListSkeleton } from './AppointmentsListSkeleton';
import { listLoadErrorTitle } from './appointmentsTabSummaryModel';
import { useMasterAppointmentsPage } from './useMasterAppointmentsPage';
import { useAdminSectionTab } from '../useAdminSectionTab';
import {
  fetchMasterAppointments,
  type MasterAppointmentsTab,
} from '../../../features/admin/api/masterCabinetApi';
import { mapMasterAppointmentRowToDemo } from '../../../features/admin/lib/masterCabinetMapper';

const APPOINTMENTS_TABS = ['requests', 'upcoming', 'history'] as const satisfies readonly AppointmentsTabId[];

const UPCOMING_VIEW_MODES = ['list', 'calendar'] as const satisfies readonly UpcomingViewMode[];

const APPOINTMENT_FOCUS_PARAM = 'focus';

function appointmentsTabForStatus(status: string): AppointmentsTabId {
  if (status === 'pending') return 'requests';
  if (status === 'confirmed' || status === 'client_arrived' || status === 'in_progress') {
    return 'upcoming';
  }
  return 'history';
}

type Props = {
  appointments: DemoMasterAppointment[];
  /** API-режим: списки с сервера по вкладкам + пагинация. */
  useRemoteList?: boolean;
  onChangeAppointments: (
    rows: DemoMasterAppointment[],
    options?: { cancelReason?: string },
  ) => void | Promise<void>;
  onOpenDetail: (appointment: DemoMasterAppointment, tab: AppointmentsTabId) => void;
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
  return 'bg-[#F47C8C]';
}

export function AdminAppointmentsTab({
  appointments,
  useRemoteList = false,
  onChangeAppointments,
  onOpenDetail,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get(APPOINTMENT_FOCUS_PARAM);
  const focusHandledRef = useRef<string | null>(null);
  const [tab, setTab] = useAdminSectionTab('tab', 'requests', APPOINTMENTS_TABS);
  const [upcomingView, setUpcomingView] = useAdminSectionTab('view', 'list', UPCOMING_VIEW_MODES);
  const remote = useMasterAppointmentsPage({ enabled: useRemoteList, tab });

  const clearAppointmentFocus = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(APPOINTMENT_FOCUS_PARAM);
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  useEffect(() => {
    if (!focusId || focusHandledRef.current === focusId) return;

    const openLocal = (row: DemoMasterAppointment) => {
      focusHandledRef.current = focusId;
      const t = appointmentsTabForStatus(row.status);
      setTab(t);
      onOpenDetail(row, t);
      clearAppointmentFocus();
    };

    if (!useRemoteList) {
      const local = appointments.find((a) => a.id === focusId);
      if (local) openLocal(local);
      else clearAppointmentFocus();
      return;
    }

    let cancelled = false;
    const apiTabs: MasterAppointmentsTab[] = ['pending', 'upcoming', 'history', 'all'];

    void (async () => {
      for (const apiTab of apiTabs) {
        try {
          const out = await fetchMasterAppointments({ tab: apiTab, limit: 100, offset: 0 });
          const row = out.appointments.find((a) => a.id === focusId);
          if (row && !cancelled) {
            const mapped = mapMasterAppointmentRowToDemo(row);
            focusHandledRef.current = focusId;
            const t = appointmentsTabForStatus(mapped.status);
            setTab(t);
            onOpenDetail(mapped, t);
            clearAppointmentFocus();
            return;
          }
        } catch {
          /* пробуем следующую вкладку */
        }
      }
      if (!cancelled) clearAppointmentFocus();
    })();

    return () => {
      cancelled = true;
    };
  }, [
    appointments,
    clearAppointmentFocus,
    focusId,
    onOpenDetail,
    setTab,
    useRemoteList,
  ]);
  const listAppointments = useRemoteList ? remote.items : appointments;
  const [actionConfig, setActionConfig] = useState<AppointmentActionConfig | null>(null);
  const [actionApiError, setActionApiError] = useState<string | null>(null);
  const { toast, showToast, showErrorToast, clearToast } = useAdminToast();

  const [requestsService, setRequestsService] = useState('all');
  const [requestsSort, setRequestsSort] = useState<RequestsSort>('newest');
  const [requestsPeriod, setRequestsPeriod] = useState<RequestsPeriodFilter>('all');
  const [requestsFeature, setRequestsFeature] = useState<RequestsFeatureFilter>('all');
  const [requestsSearch, setRequestsSearch] = useState('');
  const [upcomingService, setUpcomingService] = useState('all');
  const [upcomingSort, setUpcomingSort] = useState<UpcomingSort>('date');
  const [upcomingSearch, setUpcomingSearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState<HistoryStatusFilter>('all');
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriodFilter>('all');
  const [historySort, setHistorySort] = useState<HistorySort>('newest');
  const [historyService, setHistoryService] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setFilterOpen(false);
  }, [tab]);

  const stats = useMemo(() => {
    if (useRemoteList && remote.stats) {
      return {
        requests: remote.stats.pending,
        upcoming: remote.stats.upcoming,
        history: remote.stats.history,
      };
    }
    const requests = appointments.filter((a) => a.status === 'pending').length;
    const upcoming = appointments.filter((a) => isUpcomingTabAppointment(a)).length;
    const history = appointments.filter((a) => isHistoryAppointment(a)).length;
    return { requests, upcoming, history };
  }, [appointments, remote.stats, useRemoteList]);

  const pendingRows = useMemo(() => {
    if (useRemoteList && tab === 'requests') return listAppointments;
    return listAppointments.filter((a) => a.status === 'pending');
  }, [listAppointments, tab, useRemoteList]);

  const upcomingRows = useMemo(() => {
    if (useRemoteList && tab === 'upcoming') return listAppointments;
    return listAppointments.filter((a) => isUpcomingTabAppointment(a));
  }, [listAppointments, tab, useRemoteList]);

  const historyRows = useMemo(() => {
    if (useRemoteList && tab === 'history') return listAppointments;
    return listAppointments.filter((a) => isHistoryAppointment(a));
  }, [listAppointments, tab, useRemoteList]);

  const requestsSortFn = useMemo(() => {
    switch (requestsSort) {
      case 'oldest':
        return compareAppointmentsByDateAsc;
      case 'price_high':
        return compareAppointmentsByPriceDesc;
      case 'price_low':
        return compareAppointmentsByPriceAsc;
      default:
        return compareAppointmentsByDateDesc;
    }
  }, [requestsSort]);

  const requestsFiltered = useMemo(() => {
    let rows = pendingRows;
    if (requestsService !== 'all') {
      rows = rows.filter((a) => a.serviceTitle === requestsService);
    }
    rows = filterRequestsByPeriod(rows, requestsPeriod);
    rows = filterRequestsByFeature(rows, requestsFeature);
    rows = filterHistoryBySearch(rows, requestsSearch);
    return [...rows].sort(requestsSortFn);
  }, [
    pendingRows,
    requestsFeature,
    requestsPeriod,
    requestsSearch,
    requestsService,
    requestsSortFn,
  ]);

  const upcomingFiltered = useMemo(() => {
    let rows = upcomingRows;
    if (upcomingService !== 'all') {
      rows = rows.filter((a) => a.serviceTitle === upcomingService);
    }
    rows = filterHistoryBySearch(rows, upcomingSearch);
    return [...rows].sort(
      upcomingSort === 'date' ? compareAppointmentsByDateAsc : compareAppointmentsByDateDesc,
    );
  }, [upcomingRows, upcomingSearch, upcomingService, upcomingSort]);

  const nearest = useMemo(() => pickNearestUpcoming(upcomingFiltered), [upcomingFiltered]);

  const upcomingRest = useMemo(() => {
    if (!nearest) return upcomingFiltered;
    return upcomingFiltered.filter((a) => a.id !== nearest.id);
  }, [upcomingFiltered, nearest]);

  const attentionRows = useMemo(
    () => upcomingFiltered.filter((a) => isRequiresAttentionAppointment(a)),
    [upcomingFiltered],
  );

  const upcomingTodayCount = useMemo(() => {
    const todayIso = isoDateLocal(new Date());
    return upcomingFiltered.filter((a) => a.date === todayIso).length;
  }, [upcomingFiltered]);

  const upcomingActiveRows = useMemo(
    () => upcomingRest.filter((a) => !isRequiresAttentionAppointment(a)),
    [upcomingRest],
  );

  const upcomingGroups = useMemo(
    () => groupAppointmentsByDay(upcomingActiveRows),
    [upcomingActiveRows],
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
    if (historyStatus === 'completed') {
      rows = rows.filter((a) => a.status === 'completed' || a.status === 'no_show');
    }
    if (historyStatus === 'cancelled') rows = rows.filter((a) => a.status === 'cancelled');
    rows = filterHistoryByPeriod(rows, historyPeriod);
    rows = filterHistoryBySearch(rows, historySearch);
    return rows;
  }, [historyRows, historyService, historyStatus, historyPeriod, historySearch]);

  const historyAttentionRows = useMemo(
    () => historyFiltered.filter((a) => isRequiresAttentionAppointment(a)),
    [historyFiltered],
  );

  const historyGroups = useMemo(
    () =>
      groupAppointmentsByMonth(
        historyFiltered.filter((a) => !isRequiresAttentionAppointment(a)),
        historySortFn,
      ),
    [historyFiltered, historySortFn],
  );

  const historySortedForExport = useMemo(
    () => [...historyFiltered].sort(historySortFn),
    [historyFiltered, historySortFn],
  );

  const historyExportFiltersLabel = useMemo(
    () =>
      buildHistoryExportFiltersLabel({
        service: historyService,
        status: historyStatus,
        period: historyPeriod,
        sort: historySort,
        search: historySearch,
      }),
    [historyPeriod, historySearch, historyService, historySort, historyStatus],
  );

  const historySummary = useMemo(() => {
    if (useRemoteList && remote.stats) {
      return {
        completedCount: remote.stats.completedCount,
        cancelledCount: remote.stats.cancelledCount,
        earnedTotal: remote.stats.earnedTotal,
      };
    }
    const completed = historyRows.filter((a) => a.status === 'completed');
    const cancelled = historyRows.filter((a) => a.status === 'cancelled');
    const earned = completed.reduce((s, a) => s + (Number.isFinite(a.priceByn) ? a.priceByn : 0), 0);
    return {
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      earnedTotal: earned,
    };
  }, [historyRows, remote.stats, useRemoteList]);

  const historyEarnedTrend = useMemo(
    () => computeHistoryEarnedTrend(historyRows),
    [historyRows],
  );

  const historyEarnedTrendPercent = useMemo(
    () => computeHistoryEarnedTrendPercent(historyRows),
    [historyRows],
  );

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
      const { appointment, nextStatus, kind } = actionConfig;
      const nextRows = updateStatus(appointments, appointment.id, nextStatus);
      setActionApiError(null);
      setActionConfig(null);

      if (useRemoteList) {
        const leavesCurrentTab =
          (tab === 'requests' && (nextStatus === 'confirmed' || kind === 'reject')) ||
          (tab === 'upcoming' &&
            (nextStatus === 'completed' || nextStatus === 'cancelled')) ||
          (tab === 'history' && nextStatus === 'cancelled');
        if (leavesCurrentTab) {
          remote.removeFromList(appointment.id);
        } else {
          remote.patchItem(appointment.id, { status: nextStatus });
        }
        void remote.loadStats();
      }

      if (nextStatus === 'confirmed') {
        showToast('Запись подтверждена');
        setTab('upcoming');
      } else if (nextStatus === 'completed') {
        showToast('Запись завершена');
        setTab('history');
      } else if (nextStatus === 'cancelled') {
        const suffix = rejectReason ? `: ${rejectReason}` : '';
        showToast(kind === 'reject' ? `Заявка отклонена${suffix}` : `Запись отменена${suffix}`);
        setTab('history');
      }

      try {
        await Promise.resolve(
          onChangeAppointments(nextRows, {
            cancelReason: nextStatus === 'cancelled' ? rejectReason?.trim() : undefined,
          }),
        );
      } catch (e) {
        if (useRemoteList) {
          void remote.reload();
        }
        showErrorToast(e instanceof Error ? e.message : 'Не удалось обновить запись');
      }
    },
    [
      actionConfig,
      appointments,
      onChangeAppointments,
      remote,
      showErrorToast,
      showToast,
      tab,
      useRemoteList,
    ],
  );

  const listPagination = useRemoteList ? (
    <AppointmentsLoadMore
      hasMore={remote.hasMore}
      loading={remote.loadingMore}
      loadedCount={remote.items.length}
      total={remote.total}
      onLoadMore={remote.loadMore}
    />
  ) : null;

  const listLoadingBlock =
    useRemoteList && remote.loading && remote.items.length === 0 ? <AppointmentsListSkeleton /> : null;

  const historyInitialLoading = Boolean(useRemoteList && remote.loading && remote.items.length === 0);
  const upcomingInitialLoading = Boolean(useRemoteList && remote.loading && remote.items.length === 0 && tab === 'upcoming');
  const requestsInitialLoading = Boolean(useRemoteList && remote.loading && remote.items.length === 0 && tab === 'requests');
  const historySummaryLoading = historyInitialLoading && !remote.stats;
  const upcomingSummaryLoading = upcomingInitialLoading && !remote.stats;
  const requestsSummaryLoading = requestsInitialLoading && !remote.stats;
  const showHistorySummaryHeader = tab === 'history' && (stats.history > 0 || historyInitialLoading);
  const showUpcomingSummaryHeader = tab === 'upcoming' && (stats.upcoming > 0 || upcomingInitialLoading);
  const showRequestsSummaryHeader = tab === 'requests';
  const usePremiumTabShell = tab === 'history' || tab === 'upcoming' || tab === 'requests';
  const showTabSummaryHeader =
    showHistorySummaryHeader || showUpcomingSummaryHeader || showRequestsSummaryHeader;

  const requestsTodayCount = useMemo(() => {
    const today = isoDateLocal(new Date());
    return pendingRows.filter((row) => row.date === today).length;
  }, [pendingRows]);

  const requestsExpiringCount = useMemo(
    () => pendingRows.filter((row) => isRequestExpiringSoon(row)).length,
    [pendingRows],
  );

  const listErrorBlock =
    useRemoteList && remote.error ? (
      <section className={`${apptCardShell} flex flex-col items-center px-6 py-8 text-center`}>
        <h3 className="text-[16px] font-bold tracking-[-0.02em] text-[#111827]">
          {listLoadErrorTitle(tab)}
        </h3>
        <p className="mt-2 max-w-[20rem] text-[14px] leading-relaxed text-[#6B7280]">{remote.error}</p>
        <button
          type="button"
          onClick={() => void remote.reload()}
          className={`${apptPinkBtn} mt-5 w-full max-w-[14rem]`}
        >
          Повторить
        </button>
      </section>
    ) : null;

  const servicePills = (rows: DemoMasterAppointment[]) => [
    { id: 'all', label: 'Все услуги' },
    ...uniqueServiceTitles(rows).map((title) => ({ id: title, label: title })),
  ];

  const resetFilters = useCallback(() => {
    if (tab === 'requests') {
      setRequestsService('all');
      setRequestsSort('newest');
      setRequestsPeriod('all');
      setRequestsFeature('all');
      setRequestsSearch('');
      return;
    }
    if (tab === 'upcoming') {
      setUpcomingService('all');
      setUpcomingSort('date');
      setUpcomingSearch('');
      return;
    }
    setHistoryStatus('all');
    setHistoryPeriod('all');
    setHistorySort('newest');
    setHistoryService('all');
    setHistorySearch('');
  }, [tab]);

  const renderRequests = () => {
    if (listErrorBlock) return listErrorBlock;

    const requestsMobileHeader = tabSummaryCopy('requests', stats);
    const requestsToolbarFiltersActive =
      requestsService !== 'all' || requestsSort !== 'newest';

    const requestsSummaryBlock = (
      <AppointmentsRequestsSummary
        totalCount={stats.requests}
        todayCount={requestsTodayCount}
        expiringCount={requestsExpiringCount}
        loading={requestsSummaryLoading}
        mobileHeader={{
          title: requestsMobileHeader.title,
          subtitle: requestsMobileHeader.subtitle,
        }}
      />
    );

    const requestsToolbarBlock = (
      <AppointmentsRequestsToolbar
        search={requestsSearch}
        onSearch={setRequestsSearch}
        period={requestsPeriod}
        onPeriod={setRequestsPeriod}
        feature={requestsFeature}
        onFeature={setRequestsFeature}
        filtersActive={requestsToolbarFiltersActive}
        filterOpen={filterOpen}
        onOpenFilters={() => setFilterOpen(true)}
      />
    );

    const requestsListHeader = (
      <AppointmentsRequestsListHeader
        count={requestsFiltered.length}
        sort={requestsSort}
        onSort={setRequestsSort}
      />
    );

    if (requestsInitialLoading) {
      return (
        <div className="space-y-3 lg:space-y-4">
          {requestsSummaryBlock}
          {requestsToolbarBlock}
          {listLoadingBlock}
        </div>
      );
    }

    if (!requestsFiltered.length) {
      if (pendingRows.length > 0 || stats.requests > 0) {
        return (
          <div className="space-y-3 lg:space-y-4">
            {requestsSummaryBlock}
            {requestsToolbarBlock}
            {requestsListHeader}
            <AppointmentsEmptyState
              title="Ничего не найдено"
              text="Попробуйте изменить поиск, дату, услугу или другие фильтры"
              picture="searchEmpty"
            />
          </div>
        );
      }

      return (
        <div className="space-y-3 lg:space-y-4">
          {requestsSummaryBlock}
          {requestsToolbarBlock}
          <AppointmentsEmptyState
            title="Новых заявок пока нет"
            text="Когда клиент отправит заявку, она появится здесь."
            illustrationSrc={APPOINTMENTS_REQUESTS_EMPTY_ILLUSTRATION_SRC}
            detail={APPOINTMENTS_REQUESTS_GUIDE_DETAIL}
            action={
              <>
                <Link to={ADMIN_SCHEDULE_PATH} className={`${apptPinkBtn} w-full`}>
                  Открыть расписание
                </Link>
                <Link to={ADMIN_SERVICES_PATH} className={`${apptOutlineBtn} w-full`}>
                  Настроить услуги
                </Link>
              </>
            }
          />
        </div>
      );
    }

    return (
      <div className="space-y-3 lg:space-y-4">
        {requestsSummaryBlock}
        {requestsToolbarBlock}
        {requestsListHeader}
        <ul className={apptListGap}>
          {requestsFiltered.map((a) => (
            <li key={a.id}>
              <AppointmentsRequestCard
                appointment={a}
                onOpenDetail={() => onOpenDetail(a, 'requests')}
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
        {listPagination}
      </div>
    );
  };

  const renderUpcoming = () => {
    if (listErrorBlock) return listErrorBlock;

    const upcomingMobileHeader = tabSummaryCopy('upcoming', stats);
    const upcomingToolbarFiltersActive =
      upcomingService !== 'all' || upcomingSort !== 'date';
    const upcomingViewToggle = (
      <AppointmentsUpcomingViewToggle value={upcomingView} onChange={setUpcomingView} />
    );

    const upcomingSummaryBlock = (
      <AppointmentsUpcomingSummary
        totalCount={upcomingFiltered.length}
        todayCount={upcomingTodayCount}
        attentionCount={attentionRows.length}
        loading={upcomingSummaryLoading}
        mobileHeader={{
          title: upcomingMobileHeader.title,
          subtitle: upcomingMobileHeader.subtitle,
        }}
      />
    );

    const upcomingToolbarBlock = (
      <AppointmentsUpcomingToolbar
        search={upcomingSearch}
        onSearch={setUpcomingSearch}
        filtersActive={upcomingToolbarFiltersActive}
        filterOpen={filterOpen}
        onOpenFilters={() => setFilterOpen(true)}
        trailing={upcomingViewToggle}
      />
    );

    const upcomingListHeader = (
      <AppointmentsUpcomingListHeader
        count={upcomingFiltered.length}
        sort={upcomingSort}
        onSort={setUpcomingSort}
      />
    );

    if (!upcomingFiltered.length && useRemoteList && stats.upcoming > 0) {
      return (
        <div className="space-y-3 lg:space-y-4">
          {upcomingSummaryBlock}
          {upcomingToolbarBlock}
          <div className="rounded-[12px] bg-[#FFF4F6] px-4 py-5 text-center">
            <p className="text-[15px] font-semibold text-[#111827]">Записи загружаются…</p>
            <button type="button" className={`${apptPinkBtn} mt-3`} onClick={() => void remote.reload()}>
              Обновить список
            </button>
          </div>
        </div>
      );
    }

    if (upcomingInitialLoading) {
      return (
        <div className="space-y-3 lg:space-y-4">
          {upcomingSummaryBlock}
          {upcomingToolbarBlock}
          {listLoadingBlock}
        </div>
      );
    }

    if (!upcomingFiltered.length) {
      if (upcomingRows.length > 0 || stats.upcoming > 0) {
        return (
          <div className="space-y-3 lg:space-y-4">
            {upcomingSummaryBlock}
            {upcomingToolbarBlock}
            {upcomingView === 'list' ? upcomingListHeader : null}
            <AppointmentsEmptyState
              title="Ничего не найдено"
              text="Попробуйте изменить поиск или фильтры"
              picture="searchEmpty"
            />
          </div>
        );
      }

      if (upcomingView === 'calendar') {
        return (
          <div className="space-y-3 lg:space-y-4">
            {upcomingSummaryBlock}
            {upcomingToolbarBlock}
            <AppointmentsUpcomingCalendar
              appointments={upcomingFiltered}
              nearestId={nearest?.id}
              onOpen={(a) => onOpenDetail(a, 'upcoming')}
            />
          </div>
        );
      }

      return (
        <div className="space-y-3 lg:space-y-4">
          {upcomingSummaryBlock}
          {upcomingToolbarBlock}
          <AppointmentsEmptyState
            title="Предстоящих записей нет"
            text="Подтверждённые записи появятся здесь после того, как вы примете заявку"
            illustrationSrc={APPOINTMENTS_REQUESTS_EMPTY_ILLUSTRATION_SRC}
            detail={{
              title: 'Предстоящие записи',
              illustrationSrc: APPOINTMENTS_REQUESTS_EMPTY_ILLUSTRATION_SRC,
              paragraphs: [
                'После подтверждения заявки запись переходит во вкладку «Предстоящие».',
                'Здесь видны ближайшие визиты — можно открыть карточку, начать или завершить визит.',
              ],
            }}
            action={
              stats.requests > 0 ? (
                <button type="button" onClick={() => setTab('requests')} className={apptPinkBtn}>
                  Перейти к заявкам ({stats.requests})
                </button>
              ) : (
                <Link to={ADMIN_SCHEDULE_PATH} className={`${apptPinkBtn} w-full`}>
                  Открыть расписание
                </Link>
              )
            }
          />
        </div>
      );
    }

    if (upcomingView === 'calendar') {
      return (
        <div className="space-y-3 lg:space-y-4">
          {upcomingSummaryBlock}
          {upcomingToolbarBlock}
          <AppointmentsUpcomingCalendar
            appointments={upcomingFiltered}
            nearestId={nearest?.id}
            onOpen={(a) => onOpenDetail(a, 'upcoming')}
          />
          {listPagination}
        </div>
      );
    }

    return (
      <div className="space-y-3 lg:space-y-4">
        {upcomingSummaryBlock}
        {upcomingToolbarBlock}
        {upcomingListHeader}

        {nearest && !isRequiresAttentionAppointment(nearest) ? (
          <section>
            <ul className={apptListGap}>
              <li>
                <AppointmentsUpcomingRow
                  appointment={nearest}
                  onOpen={() => onOpenDetail(nearest, 'upcoming')}
                  nearest
                />
              </li>
            </ul>
          </section>
        ) : null}

        {attentionRows.length ? (
          <section>
            <h3 className={`${apptGroupLabel} !text-[#B91C1C] before:bg-[#F47C8C]`}>
              Требуют внимания
            </h3>
            <ul className={`mt-2 ${apptListGap}`}>
              {attentionRows.map((a) => (
                <li key={a.id}>
                  <AppointmentsUpcomingRow appointment={a} onOpen={() => onOpenDetail(a, 'upcoming')} overdue />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {upcomingGroups.map((group) => (
          <section key={group.dayIso}>
            <h3 className={apptMonthLabel}>{group.label}</h3>
            <ul className={apptListGap}>
              {group.items.map((a) => (
                <li key={a.id}>
                  <AppointmentsUpcomingRow appointment={a} onOpen={() => onOpenDetail(a, 'upcoming')} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        {listPagination}
      </div>
    );
  };

  const renderHistory = () => {
    if (listErrorBlock) return listErrorBlock;

    if (!historyRows.length && !historyInitialLoading && stats.history === 0) {
      return (
        <AppointmentsEmptyState
          title="Истории записей пока нет"
          text="Завершённые и отменённые записи появятся здесь"
        />
      );
    }

    const historyMobileHeader = tabSummaryCopy('history', stats);

    const historyExportMenuDesktop = (
      <AppointmentsHistoryExportMenu
        rows={historySortedForExport}
        summary={historySummary}
        filtersLabel={historyExportFiltersLabel}
        disabled={historySummaryLoading}
        onSuccess={(format) =>
          showToast(format === 'word' ? 'Отчёт Word скачан' : 'Таблица Excel скачана')
        }
        onError={showErrorToast}
      />
    );

    const historyExportMenuMobile = (
      <AppointmentsHistoryExportMenu
        rows={historySortedForExport}
        summary={historySummary}
        filtersLabel={historyExportFiltersLabel}
        disabled={historySummaryLoading}
        compact
        onSuccess={(format) =>
          showToast(format === 'word' ? 'Отчёт Word скачан' : 'Таблица Excel скачана')
        }
        onError={showErrorToast}
      />
    );

    const historySummaryBlock = (
      <AppointmentsHistorySummary
        completedCount={historySummary.completedCount}
        earnedTotal={historySummary.earnedTotal}
        cancelledCount={historySummary.cancelledCount}
        earnedTrend={historyEarnedTrend}
        earnedTrendPercent={historyEarnedTrendPercent}
        loading={historySummaryLoading}
        mobileHeader={{
          title: historyMobileHeader.title,
          subtitle: historyMobileHeader.subtitle,
        }}
      />
    );

    const historyToolbarFiltersActive =
      historyService !== 'all' || historySort !== 'newest';

    const historyToolbarBlock = (
      <AppointmentsHistoryToolbar
        search={historySearch}
        onSearch={setHistorySearch}
        status={historyStatus}
        onStatus={setHistoryStatus}
        period={historyPeriod}
        onPeriod={setHistoryPeriod}
        filtersActive={historyToolbarFiltersActive}
        filterOpen={filterOpen}
        onOpenFilters={() => setFilterOpen(true)}
        exportMenu={
          <>
            <div className="lg:hidden">{historyExportMenuMobile}</div>
            <div className="hidden lg:block">{historyExportMenuDesktop}</div>
          </>
        }
      />
    );

    const historyListHeader = (
      <AppointmentsHistoryListHeader
        count={historyFiltered.length}
        sort={historySort}
        onSort={setHistorySort}
      />
    );

    if (historyInitialLoading) {
      return (
        <div className="space-y-3 lg:space-y-4">
          {historySummaryBlock}
          {historyToolbarBlock}
          {listLoadingBlock}
        </div>
      );
    }

    if (!historyFiltered.length) {
      return (
        <div className="space-y-3 lg:space-y-4">
          {historySummaryBlock}
          {historyToolbarBlock}
          {historyListHeader}
          <AppointmentsEmptyState
            title="Ничего не найдено"
            text="Измените поиск, статус, услугу или период"
            picture="searchEmpty"
          />
        </div>
      );
    }

    return (
      <div className="space-y-3 lg:space-y-4">
        {historySummaryBlock}
        {historyToolbarBlock}
        {historyListHeader}

        {historyAttentionRows.length ? (
          <section>
            <h3 className={`${apptGroupLabel} !text-[#B91C1C] before:bg-[#F47C8C]`}>
              Требуют внимания
            </h3>
            <ul className={`mt-2 ${apptListGap}`}>
              {historyAttentionRows.map((a) => (
                <li key={a.id}>
                  <AppointmentsHistoryRow
                    appointment={a}
                    attention
                    onOpen={() => onOpenDetail(a, 'history')}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {historyGroups.map((group) => (
          <section key={group.monthKey}>
            <h3 className={apptMonthLabel}>{group.label}</h3>
            <ul className={apptListGap}>
              {group.items.map((a) => (
                <li key={a.id}>
                  <AppointmentsHistoryRow appointment={a} onOpen={() => onOpenDetail(a, 'history')} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        {listPagination}
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
            className="inline-flex shrink-0 rounded-[10px] bg-[#F47C8C] px-3 py-1.5 text-[12px] font-bold text-white transition hover:opacity-95 active:scale-[0.98]"
          >
            Мой тариф
          </Link>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EBEBEB]">
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
          onReset={resetFilters}
        />
      ) : null}
    </>
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
      className={`-mx-4 min-w-0 space-y-4 px-4 ${APPOINTMENTS_TAB_BAR_SCROLL_PAD} lg:hidden ${APPOINTMENTS_PAGE_BG}`}
    >
      {showTabSummaryHeader ? null : <AppointmentsPageHeader tab={tab} stats={stats} />}
      {billingBanner}
      {tabPanels}
    </section>
  );

  const desktopBody = (
    <div className={`${appointmentsShellCard} space-y-6`}>
      <AdminDesktopSectionTabsShell>
        <AppointmentsSectionTabs active={tab} onChange={setTab} counts={stats} />
      </AdminDesktopSectionTabsShell>
      <div className="min-w-0 space-y-6">
        {showTabSummaryHeader ? null : <AppointmentsPageHeader tab={tab} stats={stats} />}
        {billingBanner}
        <div
          className={
            usePremiumTabShell
              ? 'min-w-0 max-lg:overflow-hidden max-lg:rounded-[16px] max-lg:bg-white max-lg:ring-1 max-lg:ring-[#EEEEEE] lg:bg-transparent lg:ring-0'
              : appointmentsTabPanelShell
          }
        >
          <div
            className={
              usePremiumTabShell
                ? 'space-y-4 max-lg:p-4 max-lg:sm:p-5 lg:space-y-5 lg:p-0'
                : `space-y-4 lg:space-y-5 ${appointmentsDesktopCardPad}`
            }
          >
            {tabPanels}
          </div>
        </div>
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
