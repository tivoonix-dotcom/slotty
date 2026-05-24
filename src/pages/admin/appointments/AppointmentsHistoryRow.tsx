import { HiCheck, HiChevronRight, HiXMark } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { apptCardInteractive, apptChevron, apptPriceAccent } from './adminAppointmentsTheme';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import { formatAppointmentPrice, formatCardDateTime, historyStatusLabel } from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  onOpen: () => void;
};

function StatusBadge({ status }: { status: DemoMasterAppointment['status'] }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-bold text-[#16A34A] ring-1 ring-[#BBF7D0]/80">
        <HiCheck className="h-3 w-3" aria-hidden />
        {historyStatusLabel(status)}
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FEF2F2] px-2.5 py-1 text-[11px] font-bold text-[#EF4444] ring-1 ring-[#FECACA]/80">
      <HiXMark className="h-3 w-3" aria-hidden />
      {historyStatusLabel(status)}
    </span>
  );
}

export function AppointmentsHistoryRow({ appointment, onOpen }: Props) {
  const priceClass =
    appointment.status === 'completed' ? apptPriceAccent : 'font-bold tabular-nums text-[#111827]';

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${apptCardInteractive} flex w-full items-center gap-3 p-4 text-left`}
    >
      <AppointmentsClientAvatar name={appointment.clientName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[16px] font-bold text-[#111827]">{appointment.clientName}</p>
          <StatusBadge status={appointment.status} />
        </div>
        <p className="mt-0.5 text-[14px] font-medium leading-snug text-[#6B7280]">
          {appointment.serviceTitle}
        </p>
        <p className="mt-1.5 text-[13px] font-semibold text-[#9CA3AF]">
          {formatCardDateTime(appointment.date, appointment.time)}
        </p>
        <p className={`mt-1 text-[15px] ${priceClass}`}>
          {formatAppointmentPrice(appointment.priceByn)}
        </p>
      </div>
      <HiChevronRight className={apptChevron} aria-hidden />
    </button>
  );
}
