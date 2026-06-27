import type { FC, RefObject } from 'react';
import { HiArchiveBox, HiCalendarDays, HiCheck, HiChevronRight, HiInbox, HiXMark } from 'react-icons/hi2';
import { ADMIN_SEGMENT_NAV_MOBILE } from '../admin/adminCabinetLayout';
import { adminMobileSegmentTabClass } from '../admin/shared/adminMobileTabBarTheme';
import {
  apptBadgeConfirmed,
  apptBadgeNew,
  apptCardActionsCompact,
  apptCardDetailLink,
  apptCardMetricDuration,
  apptCardMetricPrice,
  apptCardShell,
  apptCompactOutlineBtn,
  apptCompactPinkBtn,
  apptDetailSectionLabel,
  apptGroupLabel,
  apptHistoryKpiTileOverlay,
  apptTimeStrip,
  apptTimeStripDate,
  apptTimeStripDefault,
  apptTimeStripNew,
  apptTimeStripTime,
} from '../admin/appointments/adminAppointmentsTheme';
import {
  adminSectionTabIconClass,
  adminSectionTabIconToneClass,
  adminSectionTabIndicatorClass,
  adminSectionTabLabelClass,
  adminSectionTabsNavClass,
  adminSectionTabTextClass,
} from '../admin/shared/adminSectionTabsTheme';
import { useLandingDemoLayout } from './masterLandingDemoShared';

const CLIENT = 'Анна Смирнова';
const SERVICE = 'Маникюр с покрытием';
const TIME = '16:00';
const DATE_SHORT = '13 июн';
const DATE_LONG = '13 июня, пятница';
const WHEN_RANGE = '16:00 — 17:00';
const PRICE = '45 BYN';
const DURATION = '1 ч';
const PLACE = 'В салоне';
const PHONE = '+375 29 456-78-90';

type DemoTab = 'requests' | 'upcoming';

const TABS: Array<{
  id: DemoTab;
  label: string;
  Icon: typeof HiInbox;
}> = [
  { id: 'requests', label: 'Заявки', Icon: HiInbox },
  { id: 'upcoming', label: 'Предстоящие', Icon: HiCalendarDays },
];

function DemoSectionTabs({
  active,
  requestCount,
  upcomingCount,
  placement = 'top',
}: {
  active: DemoTab;
  requestCount: number;
  upcomingCount: number;
  placement?: 'top' | 'bottom';
}) {
  const countFor = (id: DemoTab) => (id === 'requests' ? requestCount : upcomingCount);
  const { mobile } = useLandingDemoLayout();
  const atBottom = mobile || placement === 'bottom';

  const tabItems = (
    <>
      {TABS.map((tab) => {
        const selected = active === tab.id;
        const Icon = tab.Icon;
        const n = countFor(tab.id);

        if (atBottom) {
          return (
            <div key={tab.id} className={`relative ${adminMobileSegmentTabClass(selected, 'brand')}`}>
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span className="max-w-full truncate text-[9px] font-bold leading-none">{tab.label}</span>
              {n > 0 ? (
                <span className="absolute right-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F47C8C] px-1 text-[8px] font-black text-white">
                  {n}
                </span>
              ) : null}
            </div>
          );
        }

        return (
          <span key={tab.id} className={adminSectionTabTextClass(selected)}>
            <Icon
              className={`${adminSectionTabIconClass} ${adminSectionTabIconToneClass(selected)}`}
              aria-hidden
            />
            <span className={adminSectionTabLabelClass}>{tab.label}</span>
            {n > 0 ? (
              <span
                className={`min-w-[1.125rem] rounded-full px-1 py-0.5 text-[9px] font-black tabular-nums sm:min-w-[1.25rem] sm:px-1.5 sm:text-[10px] ${
                  selected ? 'bg-[#F47C8C] text-white' : 'bg-[#EBEBEB] text-[#6B7280]'
                }`}
              >
                {n}
              </span>
            ) : null}
            {selected ? <span className={adminSectionTabIndicatorClass()} aria-hidden /> : null}
          </span>
        );
      })}
      {!atBottom ? (
        <span className={`${adminSectionTabTextClass(false)} opacity-40`} aria-hidden>
          <HiArchiveBox className={`${adminSectionTabIconClass} text-[#9CA3AF]`} />
          <span className={adminSectionTabLabelClass}>История</span>
        </span>
      ) : null}
    </>
  );

  if (atBottom) {
    return (
      <nav
        className={`${ADMIN_SEGMENT_NAV_MOBILE} relative shrink-0`}
        style={{ minHeight: '2.75rem' }}
        aria-label="Разделы записей"
      >
        {tabItems}
        <div className={adminMobileSegmentTabClass(false, 'brand')}>
          <HiArchiveBox className="h-[18px] w-[18px] shrink-0 opacity-40" aria-hidden />
          <span className="max-w-full truncate text-[9px] font-bold leading-none opacity-40">История</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`${adminSectionTabsNavClass} shrink-0 !px-2.5 sm:!px-3`} aria-label="Разделы записей">
      {tabItems}
    </nav>
  );
}

function DemoRequestCard({ confirmPressed }: { confirmPressed?: boolean }) {
  return (
    <article className={apptCardShell}>
      <div className="flex min-w-0 flex-1">
        <div className={`${apptTimeStrip} ${apptTimeStripNew} w-[3.25rem] sm:w-[3.5rem]`}>
          <span className="text-[8px] font-semibold leading-none sm:text-[9px]">Новая</span>
          <span className={`${apptTimeStripTime} !text-[13px] sm:!text-[14px]`}>{TIME}</span>
          <span className={`${apptTimeStripDate} !text-[8px] sm:!text-[9px]`}>{DATE_SHORT}</span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 flex-1 items-start gap-2 p-2.5 sm:gap-2.5 sm:p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[10px] font-bold text-[#F47C8C]">
              АС
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold leading-snug text-[#111827] sm:text-[12px]">{CLIENT}</p>
              <div className="mt-1">
                <span className={`${apptBadgeNew} !px-2 !py-0.5 !text-[9px]`}>Новая</span>
              </div>
              <p className="mt-1.5 text-[10px] font-medium leading-snug text-[#6B7280] sm:text-[11px]">{SERVICE}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className={`${apptCardMetricPrice} !text-[13px] sm:!text-[14px]`}>{PRICE}</span>
                <span className={`${apptCardDetailLink} !text-[10px] sm:!text-[11px]`}>
                  Подробнее
                  <HiChevronRight className="h-3 w-3" aria-hidden />
                </span>
              </div>
            </div>
          </div>

          <div className={`${apptCardActionsCompact} border-t border-[#F3F4F6]`}>
            <span className={`${apptCompactOutlineBtn} !text-[10px] sm:!text-[11px]`}>
              <HiXMark className="h-3 w-3" aria-hidden />
              Отклонить
            </span>
            <span
              data-master-demo-confirm-request
              className={`${apptCompactPinkBtn} !text-[10px] sm:!text-[11px] ${
                confirmPressed ? 'scale-[0.98] opacity-90' : ''
              }`}
            >
              <HiCheck className="h-3 w-3" aria-hidden />
              Подтвердить
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function DemoUpcomingCard({ detailsPressed }: { detailsPressed?: boolean }) {
  return (
    <article className={apptCardShell}>
      <div className="flex min-w-0 flex-1">
        <div className={`${apptTimeStrip} ${apptTimeStripDefault} w-[3.25rem] sm:w-[3.5rem]`}>
          <span className={`${apptTimeStripTime} !text-[13px] sm:!text-[14px]`}>{TIME}</span>
          <span className={`${apptTimeStripDate} !text-[8px] sm:!text-[9px]`}>{DATE_SHORT}</span>
        </div>

        <div className="flex min-w-0 flex-1 items-start gap-2 p-2.5 sm:gap-2.5 sm:p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[10px] font-bold text-[#F47C8C]">
            АС
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold leading-snug text-[#111827] sm:text-[12px]">{CLIENT}</p>
            <div className="mt-1">
              <span className={`${apptBadgeConfirmed} !px-2 !py-0.5 !text-[9px]`}>Подтверждена</span>
            </div>
            <p className="mt-1.5 text-[10px] font-medium leading-snug text-[#6B7280] sm:text-[11px]">{SERVICE}</p>
            <p className="mt-0.5 text-[9px] font-medium text-[#9CA3AF] sm:text-[10px]">{PLACE}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className={`${apptCardMetricPrice} !text-[13px] sm:!text-[14px]`}>{PRICE}</span>
                <span className={`${apptCardMetricDuration} !text-[10px] sm:!text-[11px]`}>{DURATION}</span>
              </div>
              <span
                data-master-demo-appointment-details
                className={`${apptCardDetailLink} !text-[10px] sm:!text-[11px] ${
                  detailsPressed ? 'scale-[0.98] opacity-80' : ''
                }`}
              >
                Подробнее
                <HiChevronRight className="h-3 w-3" aria-hidden />
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export const MasterLandingAppointmentDetail: FC = () => (
  <div className="space-y-2.5">
    <span className="inline-flex rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[9px] font-bold text-[#16A34A] ring-1 ring-[#BBF7D0]">
      Подтверждена
    </span>

    <div className="rounded-[10px] bg-[#F5F5F5] px-3 py-3">
      <p className={`${apptDetailSectionLabel} !text-[9px] sm:!text-[10px]`}>Клиент</p>
      <div className="mt-2 flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[11px] font-bold text-[#F47C8C]">
          АС
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[13px]">{CLIENT}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#F47C8C] sm:text-[11px]">{PHONE}</p>
          <p className="mt-0.5 text-[9px] font-medium text-[#9CA3AF]">Повторный клиент</p>
        </div>
      </div>
    </div>

    <div className="rounded-[10px] bg-[#FFF1F4] px-3 py-3">
      <p className={`${apptDetailSectionLabel} !text-[9px] sm:!text-[10px]`}>Дата и время</p>
      <p className="mt-1 text-[13px] font-black leading-snug tracking-[-0.03em] text-[#111827] sm:text-[14px]">
        {DATE_LONG}
      </p>
      <p className="mt-0.5 text-[12px] font-bold tabular-nums text-[#111827] sm:text-[13px]">{WHEN_RANGE}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#FDE8ED] pt-2">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">Длительность</p>
          <p className="mt-0.5 text-[11px] font-bold text-[#111827]">{DURATION}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">Цена</p>
          <p className="mt-0.5 text-[12px] font-black tabular-nums text-[#111827]">{PRICE}</p>
        </div>
      </div>
    </div>

    <div className="rounded-[10px] bg-white px-3 py-2.5 ring-1 ring-[#EEEEEE]">
      <p className={`${apptDetailSectionLabel} !text-[9px] sm:!text-[10px]`}>Услуга и место</p>
      <p className="mt-1 text-[11px] font-semibold text-[#111827] sm:text-[12px]">{SERVICE}</p>
      <p className="mt-0.5 text-[10px] font-medium text-[#6B7280] sm:text-[11px]">{PLACE} · Минск</p>
    </div>

    <p className="text-[10px] font-medium leading-snug text-[#6B7280] sm:text-[11px]">
      Клиент уже получил подтверждение. Перед визитом можно написать или позвонить из карточки.
    </p>
  </div>
);

type MasterLandingAppointmentsHubProps = {
  activeTab: DemoTab;
  showRequest: boolean;
  showUpcoming: boolean;
  requestPressed?: boolean;
  confirmPressed?: boolean;
  detailsPressed?: boolean;
  scrollRef?: RefObject<HTMLDivElement>;
};

export const MasterLandingAppointmentsHub: FC<MasterLandingAppointmentsHubProps> = ({
  activeTab,
  showRequest,
  showUpcoming,
  requestPressed,
  confirmPressed,
  detailsPressed,
  scrollRef,
}) => {
  const requestCount = showRequest ? 1 : 0;
  const upcomingCount = showUpcoming ? 1 : 0;
  const { mobile } = useLandingDemoLayout();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#F5F5F5]">
      {!mobile ? (
        <DemoSectionTabs active={activeTab} requestCount={requestCount} upcomingCount={upcomingCount} />
      ) : null}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'requests' ? (
          <div className="space-y-2 px-2.5 pb-3 pt-2 sm:px-3 sm:pb-4">
            {showRequest ? (
              <>
                <p className={`${apptGroupLabel} !text-[9px] sm:!text-[10px]`}>Новые заявки</p>
                <DemoRequestCard confirmPressed={requestPressed || confirmPressed} />
              </>
            ) : (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#F5F5F5]">
                  <div className={apptHistoryKpiTileOverlay} aria-hidden />
                  <HiInbox className="relative z-10 h-7 w-7 text-[#D1D5DB]" aria-hidden />
                </div>
                <p className="mt-3 text-[11px] font-bold text-[#111827] sm:text-[12px]">Нет новых заявок</p>
                <p className="mt-1 max-w-[14rem] text-[10px] font-medium text-[#9CA3AF] sm:text-[11px]">
                  Когда клиент запишется, заявка появится здесь
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 px-2.5 pb-3 pt-2 sm:px-3 sm:pb-4">
            {showUpcoming ? (
              <>
                <p className={`${apptGroupLabel} !text-[9px] sm:!text-[10px]`}>Сегодня</p>
                <DemoUpcomingCard detailsPressed={detailsPressed} />
              </>
            ) : (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <HiCalendarDays className="h-8 w-8 text-[#D1D5DB]" aria-hidden />
                <p className="mt-3 text-[11px] font-bold text-[#111827] sm:text-[12px]">Предстоящих записей нет</p>
              </div>
            )}
          </div>
        )}
      </div>

      {mobile ? (
        <DemoSectionTabs active={activeTab} requestCount={requestCount} upcomingCount={upcomingCount} />
      ) : null}
    </div>
  );
};
