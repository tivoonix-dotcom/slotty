import type { FC, ReactNode } from 'react';
import { HiBellAlert, HiCalendarDays, HiCheck, HiChevronRight, HiEnvelope } from 'react-icons/hi2';
import {
  apptCardShellInteractive,
  apptHistoryKpiTileOverlay,
} from '../admin/appointments/adminAppointmentsTheme';
import {
  NOTIFICATIONS_KPI_BG,
  notifCardShell,
  notifCardShellRead,
  notifCardShellUnread,
  notifDetailNarrative,
  notifFilterBadgeActive,
  notifFilterBadgeIdle,
  notifFilterChip,
  notifFilterChipActive,
  notifFilterChipIdle,
  notifFilterScroll,
  notifFooterPrimary,
  notifHeroSubtitle,
  notifIconFallback,
  notifListToolbar,
  notifTimeGroupLabel,
} from '../admin/notifications/adminNotificationsTheme';
import { MASTER_LANDING_DEMO_MASTER_EMAIL } from './masterLandingDemoPersona';

const DEMO_SCROLL_HIDE =
  'overflow-y-auto overflow-x-hidden overscroll-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

const CLIENT = 'Анна Смирнова';
const SERVICE = 'Маникюр с покрытием';
const WHEN = 'Завтра, 16:00';
const WHEN_RANGE = 'Завтра, 16:00–17:00';
const PRICE = '45 BYN';
const PHONE = '+375 29 456-78-90';

const DEMO_DELIVERY_CHANNELS = [
  { id: 'cabinet', label: 'Кабинет' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'email', label: 'Email', icon: HiEnvelope },
] as const;

function DemoNotificationDeliveryTags({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-1 ${compact ? 'mt-1' : 'mt-1.5'}`} aria-hidden>
      {DEMO_DELIVERY_CHANNELS.map((channel) => {
        const Icon = 'icon' in channel ? channel.icon : null;
        return (
          <span
            key={channel.id}
            className="inline-flex items-center gap-0.5 rounded-full bg-[#F6F7FB] px-1.5 py-0.5 text-[8px] font-semibold text-[#6B7280] ring-1 ring-[#EBEBEB] sm:text-[9px]"
          >
            {Icon ? <Icon className="h-2.5 w-2.5 shrink-0 text-[#F47C8C]" aria-hidden /> : null}
            {channel.label}
          </span>
        );
      })}
    </div>
  );
}

type DemoKpiProps = {
  label: string;
  value: string;
  bg?: string;
};

function DemoKpiTile({ label, value, bg }: DemoKpiProps) {
  return (
    <article className="relative flex min-h-[3.75rem] overflow-hidden rounded-[10px] p-2 sm:min-h-[4rem] sm:rounded-[12px] sm:p-2.5">
      {bg ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center"
            style={{ backgroundImage: `url(${bg})` }}
            aria-hidden
          />
          <div className={apptHistoryKpiTileOverlay} aria-hidden />
        </>
      ) : (
        <div className="absolute inset-0 bg-[#F5F5F5]" aria-hidden />
      )}
      <div className="relative z-10 flex w-full flex-col justify-between">
        <p className="text-[8px] font-semibold leading-tight text-[#6B7280] sm:text-[9px]">{label}</p>
        <p className="text-[16px] font-black tabular-nums leading-none tracking-[-0.04em] text-[#111827] sm:text-[18px]">
          {value}
        </p>
      </div>
    </article>
  );
}

type DemoNotificationCardProps = {
  title: string;
  subtitle: string;
  time: string;
  unread?: boolean;
  dataAttr?: string;
  pressed?: boolean;
  icon?: ReactNode;
  showDeliveryChannels?: boolean;
};

function DemoNotificationCard({
  title,
  subtitle,
  time,
  unread = false,
  dataAttr,
  pressed,
  icon,
  showDeliveryChannels = false,
}: DemoNotificationCardProps) {
  return (
    <article
      data-master-demo={dataAttr}
      className={[
        apptCardShellInteractive,
        unread ? notifCardShellUnread : notifCardShellRead,
        pressed ? 'scale-[0.99]' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex min-w-0 flex-1">
        <div
          className={`flex w-[3.25rem] shrink-0 items-center justify-center self-stretch py-2.5 sm:w-[3.5rem] ${
            unread ? 'bg-[#FFF1F4]' : 'bg-[#EBEBEB]'
          }`}
        >
          <span
            className={`${notifIconFallback} h-8 w-8 sm:h-9 sm:w-9 ${
              unread ? 'bg-[#FFF1F4] text-[#F47C8C]' : 'bg-[#EBEBEB] text-[#6B7280]'
            }`}
            aria-hidden
          >
            {icon ?? <HiCalendarDays className="h-4 w-4" aria-hidden />}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1.5 p-2.5 sm:gap-2 sm:p-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`min-w-0 line-clamp-2 text-[11px] leading-snug sm:text-[12px] ${
                  unread ? 'font-bold text-[#111827]' : 'font-semibold text-[#6B7280]'
                }`}
              >
                {title}
              </p>
              <time className="shrink-0 text-[9px] font-medium tabular-nums text-[#9CA3AF] sm:text-[10px]">
                {time}
              </time>
            </div>
            <p
              className={`mt-0.5 line-clamp-1 text-[10px] leading-snug sm:text-[11px] ${
                unread ? 'text-[#6B7280]' : 'text-[#9CA3AF]'
              }`}
            >
              {subtitle}
            </p>
            {showDeliveryChannels ? <DemoNotificationDeliveryTags compact /> : null}
          </div>
          <span className="inline-flex shrink-0 self-end pb-0.5 text-[#9CA3AF]" aria-hidden>
            <HiChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}

function DemoNotificationsFilterBar({
  totalCount,
  actionCount,
  appointmentsCount,
}: {
  totalCount: number;
  actionCount: number;
  appointmentsCount: number;
}) {
  const chips = [
    { id: 'all', label: 'Все', count: totalCount },
    { id: 'action_required', label: 'Действия', count: actionCount },
    { id: 'appointments', label: 'Записи', count: appointmentsCount },
    { id: 'reminders', label: 'Напоминания', count: 0 },
    { id: 'reviews', label: 'Отзывы', count: 0 },
    { id: 'cancellations', label: 'Отмены', count: 0 },
    { id: 'system', label: 'Системные', count: 0 },
  ] as const;

  return (
    <div className={notifListToolbar}>
      <div className={`${notifFilterScroll} !gap-0.5`} aria-hidden>
        {chips.map((chip) => {
          const active = chip.id === 'all';
          const showBadge = chip.count > 0 && (active || chip.id === 'action_required');
          return (
            <div
              key={chip.id}
              className={`${notifFilterChip} !px-2 !py-1 !text-[10px] sm:!text-[11px] ${
                active ? notifFilterChipActive : notifFilterChipIdle
              }`}
            >
              <span>{chip.label}</span>
              {showBadge ? (
                <span
                  className={`${active ? notifFilterBadgeActive : notifFilterBadgeIdle} !text-[9px]`}
                >
                  {chip.count}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DemoEmptyState() {
  return (
    <section className={notifCardShell}>
      <div className="flex flex-col items-center px-4 py-6 text-center sm:px-5 sm:py-7">
        <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#EBEBEB] text-[#6B7280]">
          <HiBellAlert className="h-6 w-6" aria-hidden />
        </span>
        <h3 className="mt-3 text-[13px] font-black tracking-[-0.04em] text-[#111827] sm:text-[14px]">
          Пока тихо
        </h3>
        <p className="mt-1.5 max-w-[16rem] text-[10px] leading-relaxed text-[#6B7280] sm:text-[11px]">
          Когда появятся новости о записях и кабинете, они окажутся здесь.
        </p>
      </div>
    </section>
  );
}

type MasterLandingNotificationsHubProps = {
  showIncoming: boolean;
  showConfirmed: boolean;
  selectedIncoming: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
};

export const MasterLandingNotificationsHub: FC<MasterLandingNotificationsHubProps> = ({
  showIncoming,
  showConfirmed,
  selectedIncoming,
  scrollRef,
}) => {
  const actionCount = showIncoming && !showConfirmed ? 1 : 0;
  const unreadCount = showIncoming || showConfirmed ? 1 : 0;
  const todayCount = showIncoming || showConfirmed ? 1 : 0;
  const readCount = showConfirmed ? 1 : 0;
  const totalNotifications = (showIncoming ? 1 : 0) + (showConfirmed ? 1 : 0);
  const hasNotifications = showIncoming || showConfirmed;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[inherit] bg-[#f6f7fb]">
      <div ref={scrollRef} className={`min-h-0 flex-1 ${DEMO_SCROLL_HIDE} p-2.5 sm:p-3`}>
        <div className="space-y-2.5 sm:space-y-3">
          <header className="min-w-0">
            <h2 className="text-[13px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[14px]">
              Уведомления
            </h2>
            <p className={`${notifHeroSubtitle} !mt-0.5 !text-[10px] sm:!text-[11px]`}>
              В кабинет, Telegram и на почту
            </p>
          </header>

          {hasNotifications ? (
            <div className="flex w-full min-w-0 justify-end">
              <DemoNotificationsFilterBar
                totalCount={totalNotifications}
                actionCount={actionCount}
                appointmentsCount={totalNotifications}
              />
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
            <DemoKpiTile label="Действия" value={String(actionCount)} bg={NOTIFICATIONS_KPI_BG.actionRequired} />
            <DemoKpiTile label="Новые" value={String(unreadCount)} bg={NOTIFICATIONS_KPI_BG.unread} />
            <DemoKpiTile label="Сегодня" value={String(todayCount)} bg={NOTIFICATIONS_KPI_BG.today} />
            <DemoKpiTile label="Прочитано" value={String(readCount)} bg={NOTIFICATIONS_KPI_BG.read} />
          </div>

          {!showIncoming && !showConfirmed ? <DemoEmptyState /> : null}

          {showIncoming || showConfirmed ? (
            <section>
              <h3 className={`${notifTimeGroupLabel} !text-[10px] sm:!text-[11px]`}>Сегодня</h3>
              <div className="mt-1.5 space-y-1.5 sm:space-y-2">
                <div
                  className={`overflow-hidden transition-all duration-500 ease-out ${
                    showIncoming ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
                  }`}
                >
                  <DemoNotificationCard
                    dataAttr="notif-incoming"
                    title="Новая заявка"
                    subtitle={`${SERVICE} · ${WHEN}`}
                    time="сейчас"
                    unread={!selectedIncoming}
                    pressed={selectedIncoming}
                    showDeliveryChannels
                  />
                </div>

                <div
                  className={`overflow-hidden transition-all duration-500 ease-out ${
                    showConfirmed ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
                  }`}
                >
                  <DemoNotificationCard
                    title="Запись подтверждена"
                    subtitle={`${CLIENT} · ${SERVICE}`}
                    time="сейчас"
                    unread={false}
                    icon={<HiCheck className="h-4 w-4" aria-hidden />}
                  />
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
};

type MasterLandingDemoNotificationToastProps = {
  visible: boolean;
};

/** Всплывающее уведомление о новой записи — появляется до карточки в ленте. */
export const MasterLandingDemoNotificationToast: FC<MasterLandingDemoNotificationToastProps> = ({
  visible,
}) => (
  <div
    className={`pointer-events-none absolute inset-x-2.5 top-2.5 z-20 sm:inset-x-3 sm:top-3 ${
      visible
        ? 'translate-y-0 scale-100 opacity-100'
        : '-translate-y-3 scale-[0.96] opacity-0'
    } transition-all duration-500 ease-out`}
    aria-hidden
  >
    <div className="overflow-hidden rounded-[12px] bg-white shadow-[0_14px_40px_rgba(17,24,39,0.14)] ring-1 ring-[#FDE8ED]">
      <div className="flex min-w-0">
        <div className="flex w-9 shrink-0 items-center justify-center bg-[#FFF1F4] text-[#F47C8C]">
          <HiCalendarDays className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 px-2.5 py-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold leading-snug text-[#111827] sm:text-[12px]">Новая заявка</p>
            <span className="shrink-0 text-[9px] font-medium text-[#9CA3AF]">сейчас</span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#6B7280] sm:text-[11px]">
            {CLIENT} · {SERVICE} · {WHEN}
          </p>
          <DemoNotificationDeliveryTags compact />
        </div>
      </div>
    </div>
  </div>
);

type MasterLandingNotificationDetailProps = {
  confirmed: boolean;
  confirmPressed?: boolean;
};

export const MasterLandingNotificationDetail: FC<MasterLandingNotificationDetailProps> = ({
  confirmed,
  confirmPressed,
}) => (
  <div className="space-y-2.5">
    <p className={`${notifDetailNarrative} !text-[11px] sm:!text-[12px]`}>
      {CLIENT} отправил заявку на «{SERVICE}» на {WHEN}. Примите или отклоните заявку.
    </p>

    <span className="inline-flex rounded-full bg-[#FFF1F4] px-2 py-0.5 text-[9px] font-bold text-[#F47C8C] ring-1 ring-[#FDE8ED]">
      {confirmed ? 'Подтверждена' : 'Ожидает подтверждения'}
    </span>

    <div className="rounded-[10px] bg-white px-3 py-2.5 ring-1 ring-[#EEEEEE]">
      <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">Куда пришло</p>
      <DemoNotificationDeliveryTags />
      <p className="mt-1.5 text-[10px] font-medium leading-snug text-[#6B7280] sm:text-[11px]">
        Дубликат отправлен на{' '}
        <span className="font-semibold text-[#111827]">{MASTER_LANDING_DEMO_MASTER_EMAIL}</span>
      </p>
    </div>

    <div className="rounded-[10px] bg-[#F5F5F5] px-3 py-3">
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[11px] font-bold text-[#F47C8C]">
          АС
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[13px]">{CLIENT}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#F47C8C] sm:text-[11px]">{PHONE}</p>
        </div>
      </div>

      <div className="mt-2.5 rounded-[10px] bg-white px-3 py-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">Дата и время</p>
        <p className="mt-0.5 text-[13px] font-black leading-snug tracking-[-0.03em] text-[#111827] sm:text-[14px]">
          {WHEN_RANGE}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#E5E7EB] pt-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">Услуга</p>
            <p className="mt-0.5 text-[11px] font-bold text-[#111827]">{SERVICE}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">Цена</p>
            <p className="mt-0.5 text-[12px] font-black tabular-nums text-[#111827]">{PRICE}</p>
          </div>
        </div>
      </div>
    </div>

    {!confirmed ? (
      <div
        data-master-demo-confirm
        className={`${notifFooterPrimary} !min-h-9 !px-3 !text-[11px] sm:!text-[12px] ${
          confirmPressed ? 'scale-[0.98] opacity-95' : ''
        }`}
      >
        <HiCheck className="h-3.5 w-3.5" aria-hidden />
        Подтвердить заявку
      </div>
    ) : (
      <p className="text-center text-[11px] font-semibold text-[#16A34A]">Клиент получит уведомление</p>
    )}
  </div>
);
