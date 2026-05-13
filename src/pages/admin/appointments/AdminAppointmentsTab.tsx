import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_BILLING_PATH } from '../../../app/paths';
import {
  canCreateMoreAppointments,
  countAppointmentsInCurrentMonth,
  getCurrentMasterPlan,
  getPlanLimits,
  isFreeAppointmentLimitAlmostReached,
} from '../../../features/billing/model/masterPlans';
import {
  appointmentStatusLabel,
  type DemoMasterAppointment,
  type DemoAppointmentStatus,
} from '../../../features/master/model/demoMasterAppointments';
import { NothingFoundCard } from '../../../shared/ui/NothingFoundCard';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';

type SubTab = 'new' | 'confirmed' | 'history';

type Props = {
  appointments: DemoMasterAppointment[];
  onChangeAppointments: (rows: DemoMasterAppointment[]) => void | Promise<void>;
  onOpenDetail: (appointment: DemoMasterAppointment) => void;
};

type ActionState =
  | { open: false }
  | {
      open: true;
      title: string;
      text: string;
      buttonLabel: string;
      nextStatus: DemoAppointmentStatus;
      appointment: DemoMasterAppointment;
    };

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconDone({ className }: { className?: string }) {
  return (
    <svg className={className} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 12.5 11.2 15 16 9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function updateStatus(
  rows: DemoMasterAppointment[],
  id: string,
  status: DemoAppointmentStatus,
): DemoMasterAppointment[] {
  return rows.map((row) => (row.id === id ? { ...row, status } : row));
}

function statusClassName(status: DemoAppointmentStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-[#FFF4E8] text-[#B66A24]';
    case 'confirmed':
      return 'bg-[#EAFBF2] text-[#2F8A5B]';
    case 'completed':
      return 'bg-[#EEF2FF] text-[#5B63B7]';
    case 'cancelled':
      return 'bg-[#F3F1F1] text-neutral-500';
    default:
      return 'bg-[#F3F1F1] text-neutral-500';
  }
}

function formatMoney(value: number): string {
  return `${value} BYN`;
}

function tabEmptyText(tab: SubTab): { title: string; text: string } {
  if (tab === 'new') {
    return {
      title: 'Новых заявок нет',
      text: 'Когда клиент отправит заявку на запись, она появится здесь.',
    };
  }

  if (tab === 'confirmed') {
    return {
      title: 'Подтвержденных записей нет',
      text: 'Подтверждайте новые заявки, чтобы видеть ближайшие визиты.',
    };
  }

  return {
    title: 'История пока пустая',
    text: 'Завершенные и отмененные записи будут храниться здесь.',
  };
}

function StatCard({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-[24px] bg-[#F1EFEF] px-4 py-3.5">
      <p className="text-[22px] font-semibold leading-none tracking-[-0.055em] text-neutral-950">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] font-medium leading-snug text-neutral-500">
        {label}
      </p>
    </div>
  );
}

function IconActionButton({
  label,
  icon,
  onClick,
  variant = 'neutral',
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'neutral' | 'muted';
}) {
  const className =
    variant === 'primary'
      ? 'bg-[#E29595] text-white shadow-[0_10px_26px_rgba(226,149,149,0.24)]'
      : variant === 'muted'
        ? 'bg-white text-neutral-400 shadow-[inset_0_0_0_1px_rgba(17,17,17,0.05)]'
        : 'bg-[#F1EFEF] text-neutral-800';

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-[0.96] ${className}`}
    >
      {icon}
    </button>
  );
}

function AppointmentCard({
  appointment,
  onOpenDetail,
  onConfirm,
  onReject,
  onComplete,
  onCancel,
}: {
  appointment: DemoMasterAppointment;
  onOpenDetail: (appointment: DemoMasterAppointment) => void;
  onConfirm: (appointment: DemoMasterAppointment) => void;
  onReject: (appointment: DemoMasterAppointment) => void;
  onComplete: (appointment: DemoMasterAppointment) => void;
  onCancel: (appointment: DemoMasterAppointment) => void;
}) {
  return (
    <article className="rounded-[30px] bg-white p-4 shadow-[0_12px_34px_rgba(17,17,17,0.045)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[19px] font-semibold tracking-[-0.045em] text-neutral-950">
            {appointment.clientName}
          </p>

          <p className="mt-1 text-[15px] font-medium leading-snug text-neutral-600">
            {appointment.serviceTitle}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${statusClassName(
            appointment.status,
          )}`}
        >
          {appointmentStatusLabel(appointment.status)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-4">
        <div>
          <p className="text-[15px] font-semibold text-neutral-900">
            {appointment.date} · {appointment.time}
          </p>

          {appointment.contact ? (
            <p className="mt-1 truncate text-[14px] leading-snug text-neutral-400">
              {appointment.contact}
            </p>
          ) : (
            <p className="mt-1 text-[14px] leading-snug text-neutral-400">
              Контакт не указан
            </p>
          )}
        </div>

        <p className="text-right text-[18px] font-semibold tabular-nums tracking-[-0.04em] text-neutral-950">
          {formatMoney(appointment.priceByn)}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[26px] bg-[#F1EFEF] p-2">
        <div className="flex gap-2">
          <IconActionButton
            label="Подробнее"
            icon={<IconEye />}
            onClick={() => onOpenDetail(appointment)}
          />

          {appointment.status === 'pending' ? (
            <>
              <IconActionButton
                label="Принять заявку"
                icon={<IconCheck />}
                onClick={() => onConfirm(appointment)}
                variant="primary"
              />

              <IconActionButton
                label="Отклонить заявку"
                icon={<IconClose />}
                onClick={() => onReject(appointment)}
                variant="muted"
              />
            </>
          ) : null}

          {appointment.status === 'confirmed' ? (
            <>
              <IconActionButton
                label="Завершить запись"
                icon={<IconDone />}
                onClick={() => onComplete(appointment)}
                variant="primary"
              />

              <IconActionButton
                label="Отменить запись"
                icon={<IconClose />}
                onClick={() => onCancel(appointment)}
                variant="muted"
              />
            </>
          ) : null}
        </div>

        <p className="pr-2 text-[12px] font-medium text-neutral-400">
          {appointment.status === 'pending'
            ? 'ожидает'
            : appointment.status === 'confirmed'
              ? 'активна'
              : 'архив'}
        </p>
      </div>
    </article>
  );
}

export function AdminAppointmentsTab({
  appointments,
  onChangeAppointments,
  onOpenDetail,
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>('new');
  const [actionState, setActionState] = useState<ActionState>({ open: false });
  const [actionApiError, setActionApiError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const stats = useMemo(() => {
    const pending = appointments.filter((appointment) => appointment.status === 'pending').length;
    const confirmed = appointments.filter((appointment) => appointment.status === 'confirmed').length;
    const completed = appointments.filter((appointment) => appointment.status === 'completed').length;
    const cancelled = appointments.filter((appointment) => appointment.status === 'cancelled').length;

    return {
      pending,
      confirmed,
      history: completed + cancelled,
    };
  }, [appointments]);

  const billingPlan = getCurrentMasterPlan();
  const monthlyApptCount = useMemo(() => countAppointmentsInCurrentMonth(appointments), [appointments]);
  const freeApptCap = getPlanLimits('free').maxMonthlyAppointments ?? 20;
  const atFreeApptLimit = billingPlan.plan === 'free' && !canCreateMoreAppointments('free', monthlyApptCount);
  const almostFreeAppt = billingPlan.plan === 'free' && isFreeAppointmentLimitAlmostReached(monthlyApptCount);

  const filtered = useMemo(() => {
    if (subTab === 'new') {
      return appointments.filter((appointment) => appointment.status === 'pending');
    }

    if (subTab === 'confirmed') {
      return appointments.filter((appointment) => appointment.status === 'confirmed');
    }

    return appointments.filter(
      (appointment) => appointment.status === 'completed' || appointment.status === 'cancelled',
    );
  }, [appointments, subTab]);

  const sortedFiltered = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const left = `${a.date} ${a.time}`;
        const right = `${b.date} ${b.time}`;
        return left.localeCompare(right, 'ru');
      }),
    [filtered],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const openAction = useCallback(
    ({
      appointment,
      title,
      text,
      buttonLabel,
      nextStatus,
    }: {
      appointment: DemoMasterAppointment;
      title: string;
      text: string;
      buttonLabel: string;
      nextStatus: DemoAppointmentStatus;
    }) => {
      setActionApiError(null);
      setActionState({
        open: true,
        appointment,
        title,
        text,
        buttonLabel,
        nextStatus,
      });
    },
    [],
  );

  const closeAction = useCallback(() => {
    setActionApiError(null);
    setActionState({ open: false });
  }, []);

  const applyAction = useCallback(async () => {
    if (!actionState.open) return;

    const { appointment, nextStatus } = actionState;
    const nextRows = updateStatus(appointments, appointment.id, nextStatus);

    setActionApiError(null);
    try {
      await Promise.resolve(onChangeAppointments(nextRows));

      if (nextStatus === 'confirmed') {
        showToast('Запись подтверждена');
        setSubTab('confirmed');
      }

      if (nextStatus === 'completed') {
        showToast('Запись завершена');
        setSubTab('history');
      }

      if (nextStatus === 'cancelled') {
        showToast('Запись отменена');
        setSubTab('history');
      }

      setActionState({ open: false });
    } catch (e) {
      setActionApiError(e instanceof Error ? e.message : 'Не удалось обновить запись');
    }
  }, [actionState, appointments, onChangeAppointments, showToast]);

  const tabs: Array<{ id: SubTab; label: string; count: number }> = [
    { id: 'new', label: 'Новые', count: stats.pending },
    { id: 'confirmed', label: 'Активные', count: stats.confirmed },
    { id: 'history', label: 'История', count: stats.history },
  ];

  const empty = tabEmptyText(subTab);

  return (
    <div className="space-y-4">
      <section className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
        <div className="rounded-[30px] bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Клиенты
          </p>

          <h2 className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.065em] text-neutral-950">
            Записи
          </h2>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <StatCard value={stats.pending} label="новые" />
            <StatCard value={stats.confirmed} label="активные" />
            <StatCard value={stats.history} label="история" />
          </div>
        </div>
      </section>

      {toast ? (
        <div className="rounded-full bg-[#EAFBF2] px-5 py-3 text-center text-[14px] font-semibold text-[#2F8A5B] shadow-[0_10px_28px_rgba(17,17,17,0.04)]">
          {toast}
        </div>
      ) : null}

      {billingPlan.plan === 'free' ? (
        <section
          className={`rounded-[30px] px-4 py-4 shadow-[0_10px_28px_rgba(17,17,17,0.05)] ${
            atFreeApptLimit ? 'bg-[#FDE8E8]' : almostFreeAppt ? 'bg-[#FFF4E8]' : 'bg-white'
          }`}
        >
          <p className="text-[14px] font-semibold text-neutral-900">Записи в этом месяце (Free)</p>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
            {monthlyApptCount} / {freeApptCap}
            {atFreeApptLimit ? ' — лимит Free исчерпан, откройте Pro.' : almostFreeAppt ? ' — почти лимит Free.' : ''}
          </p>
          <Link
            to={ADMIN_BILLING_PATH}
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-[#E29595] px-4 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(226,149,149,0.22)]"
          >
            Мой тариф
          </Link>
          <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
            В демо-режиме лимит считается на этом устройстве.
          </p>
        </section>
      ) : null}

      <section className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
        <div className="grid grid-cols-3 gap-1.5 rounded-[28px] bg-white/65 p-1.5 backdrop-blur-xl">
          {tabs.map((tab) => {
            const active = subTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-semibold transition active:scale-[0.98] ${
                  active
                    ? 'bg-[#E29595] text-white shadow-[0_10px_24px_rgba(226,149,149,0.24)]'
                    : 'text-neutral-700'
                }`}
              >
                <span className="truncate">{tab.label}</span>

                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                    active ? 'bg-white/25 text-white' : 'bg-white text-neutral-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {sortedFiltered.length === 0 ? (
        <NothingFoundCard title={empty.title} text={empty.text} />
      ) : (
        <ul className="flex flex-col gap-3 rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
          {sortedFiltered.map((appointment) => (
            <li key={appointment.id}>
              <AppointmentCard
                appointment={appointment}
                onOpenDetail={onOpenDetail}
                onConfirm={(item) =>
                  openAction({
                    appointment: item,
                    title: 'Принять заявку?',
                    text: `Клиент ${item.clientName} увидит, что запись подтверждена.`,
                    buttonLabel: 'Принять',
                    nextStatus: 'confirmed',
                  })
                }
                onReject={(item) =>
                  openAction({
                    appointment: item,
                    title: 'Отклонить заявку?',
                    text: `Заявка клиента ${item.clientName} будет перенесена в историю как отмененная.`,
                    buttonLabel: 'Отклонить',
                    nextStatus: 'cancelled',
                  })
                }
                onComplete={(item) =>
                  openAction({
                    appointment: item,
                    title: 'Завершить визит?',
                    text: `Запись клиента ${item.clientName} будет отмечена как завершенная.`,
                    buttonLabel: 'Завершить',
                    nextStatus: 'completed',
                  })
                }
                onCancel={(item) =>
                  openAction({
                    appointment: item,
                    title: 'Отменить запись?',
                    text: `Клиент ${item.clientName} увидит, что визит отменен.`,
                    buttonLabel: 'Отменить',
                    nextStatus: 'cancelled',
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}

      <AdminBottomSheet
        open={actionState.open}
        onClose={closeAction}
        title={actionState.open ? actionState.title : ''}
      >
        {actionState.open ? (
          <>
            <div className="rounded-[28px] bg-[#F1EFEF] px-4 py-4">
              <p className="text-[17px] font-semibold tracking-[-0.04em] text-neutral-950">
                {actionState.appointment.clientName}
              </p>

              <p className="mt-1 text-[14px] leading-relaxed text-neutral-600">
                {actionState.appointment.serviceTitle}
              </p>

              <p className="mt-3 text-[14px] font-semibold text-neutral-900">
                {actionState.appointment.date} · {actionState.appointment.time}
              </p>

              <p className="mt-1 text-[14px] font-semibold text-neutral-900">
                {formatMoney(actionState.appointment.priceByn)}
              </p>
            </div>

            <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">
              {actionState.text}
            </p>

            {actionApiError ? (
              <p className="mt-4 rounded-[20px] bg-[#FFF0F0] px-4 py-3 text-[14px] font-semibold text-[#9B2C2C]">
                {actionApiError}
              </p>
            ) : null}

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={closeAction}
                className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
              >
                Назад
              </button>

              <button
                type="button"
                onClick={() => void applyAction()}
                className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
              >
                {actionState.buttonLabel}
              </button>
            </div>
          </>
        ) : null}
      </AdminBottomSheet>
    </div>
  );
}