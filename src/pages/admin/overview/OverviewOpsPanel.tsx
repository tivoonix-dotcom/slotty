import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  HiArrowRight,
  HiCalendarDays,
  HiClipboardDocumentList,
  HiClock,
  HiPlus,
  HiSparkles,
} from 'react-icons/hi2';
import {
  ADMIN_PROFILE_COMPLETION_PATH,
  ADMIN_SCHEDULE_PATH,
  getMasterAdminAppointmentsPath,
  type MasterAppointmentsTabParam,
} from '../../../app/paths';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { resolveDailyHubState } from '../masterReadiness';
import { MasterPublicPreviewLink } from '../shared/MasterPublicPreviewLink';
import { DailyHubStateBanner } from './DailyHubStateBanner';
import { formatAppointmentWhenRu } from './overviewFormat';
import type { OverviewOpsSnapshot } from './overviewOpsSnapshot';
import {
  overviewCard,
  overviewCardPad,
  overviewDesktopCard,
  overviewDesktopCardPad,
  overviewIconCircle,
  overviewPinkBtn,
} from './adminOverviewTheme';
import {
  useOverviewQuickActions,
  type OverviewQuickActionHandlers,
} from './useOverviewQuickActions';
import { OverviewOpsKpiPhotoBackdrop } from './OverviewOpsKpiPhotoBackdrop';
import { OverviewOpsKpiTileFrame } from './OverviewOpsKpiTileFrame';
import { AppointmentsUpcomingRow } from '../appointments/AppointmentsUpcomingRow';

function appointmentsTabForRow(row: DemoMasterAppointment): MasterAppointmentsTabParam | undefined {
  const status = row.dbStatus ?? row.status;
  if (status === 'pending') return undefined;
  if (status === 'confirmed' || status === 'client_arrived' || status === 'in_progress') {
    return 'upcoming';
  }
  return 'history';
}

function appointmentDetailPath(row: DemoMasterAppointment): string {
  return getMasterAdminAppointmentsPath({
    tab: appointmentsTabForRow(row),
    focus: row.id,
  });
}

type Props = {
  ops: OverviewOpsSnapshot;
  profileCompletionPercent?: number;
  profileComplete?: boolean;
  loading?: boolean;
  slotsLoadError?: string | null;
  onOpenAppointment?: (id: string) => void;
  activeServiceCount?: number;
  masterId?: string | null;
  profileReady?: boolean;
  draft: MasterDraft;
  useCabinetApi: boolean;
  appointments: DemoMasterAppointment[];
  onPersistDraft: (next: MasterDraft) => void;
};

function pendingLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} заявок`;
  if (mod10 === 1) return `${n} заявка`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} заявки`;
  return `${n} заявок`;
}

function slotsLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} окон`;
  if (mod10 === 1) return `${n} окно`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} окна`;
  return `${n} окон`;
}

function QuickAction({
  to,
  onClick,
  label,
  icon,
  accent,
}: {
  to?: string;
  onClick?: () => void;
  label: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  const className = `flex min-h-11 w-full flex-col items-center justify-center gap-1.5 rounded-[14px] px-2 py-3 text-center transition active:scale-[0.98] ${
    accent
      ? 'bg-[#FFF1F4] text-[#ff5f7a] ring-1 ring-[#FDE8ED] hover:bg-[#FFE4EA]'
      : 'bg-[#f6f7fb] text-[#111827] hover:bg-[#EEF0F4]'
  }`;

  const content = (
    <>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-[12px] ${
          accent ? 'bg-white text-[#ff5f7a]' : 'bg-white text-[#6B7280]'
        }`}
      >
        {icon}
      </span>
      <span className="text-[12px] font-bold leading-tight">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to ?? '#'} className={className}>
      {content}
    </Link>
  );
}

function OpsMetricTile({
  label,
  value,
  hint,
  to,
  urgent,
  flat = false,
  className = '',
}: {
  label: string;
  value: string;
  hint: string;
  to?: string;
  urgent?: boolean;
  flat?: boolean;
  className?: string;
}) {
  const body = (
    <OverviewOpsKpiTileFrame urgent={urgent} flat={flat}>
      {flat ? null : <OverviewOpsKpiPhotoBackdrop />}
      <div className={flat ? undefined : 'relative z-10'}>
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF] ${
            flat ? '' : 'drop-shadow-sm'
          }`}
        >
          {label}
        </p>
        <p
          className={`mt-1.5 font-black tabular-nums leading-none tracking-[-0.05em] text-[#111827] ${
            flat ? 'text-[22px]' : 'mt-2 text-[26px] drop-shadow-sm lg:text-[28px]'
          }`}
        >
          {value}
        </p>
        <p
          className={`mt-1.5 text-[11px] font-medium leading-snug text-[#6B7280] ${
            flat ? '' : 'mt-2 text-[12px] font-semibold text-[#374151] drop-shadow-sm'
          }`}
        >
          {hint}
        </p>
        {to ? (
          <span
            className={`mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#F47C8C] ${
              flat ? '' : 'mt-3 text-[13px] font-bold text-[#ff5f7a] drop-shadow-sm'
            }`}
          >
            Открыть
            <HiArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        ) : null}
      </div>
    </OverviewOpsKpiTileFrame>
  );

  if (to) {
    return (
      <Link to={to} className={`block min-w-0 transition active:scale-[0.99] ${className}`.trim()}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

function OpsPanelBody({
  ops,
  profileCompletionPercent,
  profileComplete,
  loading,
  slotsLoadError,
  onOpenAppointment,
  surface,
  activeServiceCount = 0,
  masterId,
  profileReady = false,
  quickActions,
}: Props & { surface: 'mobile' | 'desktop'; quickActions: OverviewQuickActionHandlers }) {
  const navigate = useNavigate();
  const activeSlotCount = ops.activeFutureSlotCount;
  const requestsPath = getMasterAdminAppointmentsPath({ tab: 'requests' });
  const todayPath = getMasterAdminAppointmentsPath({ tab: 'upcoming' });

  const hubState = resolveDailyHubState({
    activeServiceCount,
    activeSlotCount,
    pendingCount: ops.pendingCount,
  });
  const bannerState =
    slotsLoadError && hubState === 'no_slots' ? 'default' : hubState;

  const pendingHint =
    ops.pendingCount > 0
      ? 'Нужно подтвердить или отклонить'
      : 'Новых заявок нет';

  const todayHint =
    ops.todayAppointmentsCount > 0
      ? 'Запланировано на сегодня'
      : 'На сегодня визитов нет';

  const slotsHint =
    ops.freeSlotsToday > 0
      ? 'Свободны для записи клиентов'
      : ops.totalSlotsToday > 0
        ? 'Все окна на сегодня заняты'
        : 'Добавьте окна в расписании';

  return (
    <div className="space-y-4">
      {slotsLoadError ? (
        <p className="rounded-[16px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[14px] font-semibold text-[#92400E] lg:rounded-[20px]">
          {slotsLoadError}
        </p>
      ) : null}
      <DailyHubStateBanner
        state={bannerState}
        pendingCount={ops.pendingCount}
        masterId={masterId}
        profileReady={profileReady}
      />

      {!profileComplete && profileCompletionPercent != null ? (
        <Link
          to={ADMIN_PROFILE_COMPLETION_PATH}
          className={`flex items-start gap-3 rounded-[10px] px-4 py-3.5 transition active:scale-[0.99] ${
            surface === 'mobile'
              ? 'bg-[#FFF1F4] hover:bg-[#FFE4EA]'
              : 'rounded-[16px] bg-[#F5F3FF] ring-1 ring-[#E9D5FF] hover:bg-[#EDE9FE] lg:rounded-[20px] lg:px-5'
          }`}
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
              surface === 'mobile' ? 'bg-white text-[#F47C8C]' : 'rounded-[14px] bg-white text-[#A78BFA]'
            }`}
          >
            <HiSparkles className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-[#111827]">
              Профиль заполнен на {profileCompletionPercent}%
            </p>
            <p className="mt-1 text-[12px] font-medium leading-relaxed text-[#6B7280]">
              Дозаполните разделы — так клиенты чаще находят вас в каталоге.
            </p>
          </span>
          <HiArrowRight
            className={`mt-1 h-5 w-5 shrink-0 ${surface === 'mobile' ? 'text-[#F47C8C]' : 'text-[#A78BFA]'}`}
            aria-hidden
          />
        </Link>
      ) : null}

      <div
        className={
          surface === 'desktop'
            ? 'grid gap-2 lg:grid-cols-3 lg:gap-3'
            : 'flex gap-2 overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        }
      >
        <OpsMetricTile
          label="Новые заявки"
          value={loading ? '…' : String(ops.pendingCount)}
          hint={pendingHint}
          to={requestsPath}
          urgent={ops.pendingCount > 0}
          flat={surface === 'mobile'}
          className={surface === 'mobile' ? 'min-w-[72%] shrink-0 snap-center sm:min-w-0 sm:flex-1' : ''}
        />
        <OpsMetricTile
          label="Сегодня"
          value={loading ? '…' : String(ops.todayAppointmentsCount)}
          hint={todayHint}
          to={todayPath}
          flat={surface === 'mobile'}
          className={surface === 'mobile' ? 'min-w-[72%] shrink-0 snap-center sm:min-w-0 sm:flex-1' : ''}
        />
        <OpsMetricTile
          label="Свободно"
          value={loading ? '…' : slotsLabel(ops.freeSlotsToday)}
          hint={slotsHint}
          to={ADMIN_SCHEDULE_PATH}
          flat={surface === 'mobile'}
          className={surface === 'mobile' ? 'min-w-[72%] shrink-0 snap-center sm:min-w-0 sm:flex-1' : ''}
        />
      </div>

      {ops.nearestAppointment ? (
        <AppointmentsUpcomingRow
          appointment={ops.nearestAppointment}
          nearest
          onOpen={() => navigate(appointmentDetailPath(ops.nearestAppointment!))}
        />
      ) : null}

      {ops.todayPreview.length > 0 ? (
        <div className="rounded-[16px] bg-[#f6f7fb] p-4 lg:rounded-[20px] lg:p-5">
          <p className="text-[13px] font-bold text-[#111827]">Записи на сегодня</p>
          <ul className="mt-3 space-y-2">
            {ops.todayPreview.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onOpenAppointment?.(row.id)}
                  className="flex w-full items-center gap-3 rounded-[12px] bg-white px-3 py-2.5 text-left ring-1 ring-[#EEEEEE] transition hover:bg-[#FAFAFA] active:scale-[0.99]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF1F4] text-[13px] font-black tabular-nums text-[#ff5f7a]">
                    {row.time}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-[#111827]">
                      {row.clientName}
                    </span>
                    <span className="block truncate text-[12px] font-medium text-[#6B7280]">
                      {row.serviceTitle}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-[12px] font-semibold text-[#9CA3AF] sm:block">
                    {formatAppointmentWhenRu(row.date, row.time).split(' · ')[0]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-[13px] font-bold text-[#111827]">Быстрые действия</p>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          <QuickAction
            onClick={quickActions.openMonthWizard}
            label="Окна на месяц"
            icon={<HiCalendarDays className="h-5 w-5" aria-hidden />}
            accent
          />
          <QuickAction
            onClick={quickActions.openAddWindow}
            label="Добавить окно"
            icon={<HiPlus className="h-5 w-5" aria-hidden />}
          />
          <QuickAction
            onClick={quickActions.openCreateService}
            label="Создать услугу"
            icon={<HiClipboardDocumentList className="h-5 w-5" aria-hidden />}
          />
          <QuickAction
            to={requestsPath}
            label="Открыть заявки"
            icon={<HiClock className="h-5 w-5" aria-hidden />}
          />
          <div className="col-span-2 flex min-h-11 items-center justify-center rounded-[14px] bg-[#f6f7fb] px-2 lg:col-span-1">
            <MasterPublicPreviewLink masterId={masterId} ready={profileReady} variant="ghost" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OverviewOpsPanel(props: Props) {
  const { handlers: quickActions, modals } = useOverviewQuickActions({
    draft: props.draft,
    useCabinetApi: props.useCabinetApi,
    appointments: props.appointments,
    onPersistDraft: props.onPersistDraft,
  });

  return (
    <>
      <section className="lg:hidden">
        <div className="mb-3 px-0.5">
          <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Сегодня</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">
            Заявки, записи и свободные окна
          </p>
        </div>
        <OpsPanelBody {...props} surface="mobile" quickActions={quickActions} />
      </section>

      <section className={`hidden lg:block ${overviewDesktopCard} ${overviewDesktopCardPad}`}>
        <div className="mb-5 flex items-center gap-3">
          <span className={`${overviewIconCircle} h-12 w-12 rounded-[18px]`}>
            <HiCalendarDays className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.05em] text-[#111827]">Сегодня</h2>
            <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
              Заявки, записи и свободные окна на сегодня
            </p>
          </div>
        </div>
        <OpsPanelBody {...props} surface="desktop" quickActions={quickActions} />
        {props.ops.pendingCount > 0 ? (
          <Link
            to={getMasterAdminAppointmentsPath({ tab: 'requests' })}
            className={`mt-5 inline-flex min-h-11 w-full items-center justify-center text-[14px] font-bold ${overviewPinkBtn}`}
          >
            {pendingLabel(props.ops.pendingCount)} — открыть
          </Link>
        ) : null}
      </section>

      {modals}
    </>
  );
}
