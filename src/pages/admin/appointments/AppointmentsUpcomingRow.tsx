import { HiChevronRight } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { apptCard } from './adminAppointmentsTheme';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import { estimateDurationLabel, formatAppointmentPrice, formatVisitPlace } from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  onOpen: () => void;
};

export function AppointmentsUpcomingRow({ appointment, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${apptCard} flex w-full items-center gap-3 p-4 text-left transition active:scale-[0.99]`}
    >
      <AppointmentsClientAvatar name={appointment.clientName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[16px] font-bold text-[#111827]">{appointment.clientName}</p>
          <span className="shrink-0 rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-bold text-[#16A34A]">
            Подтверждена
          </span>
        </div>
        <p className="mt-0.5 text-[14px] font-medium leading-snug text-[#6B7280]">
          {appointment.serviceTitle}
        </p>
        <p className="mt-1.5 text-[13px] font-semibold text-[#374151]">
          {appointment.time} · {estimateDurationLabel(appointment.serviceTitle)} ·{' '}
          {formatVisitPlace(appointment.addressShort)}
        </p>
        <p className="mt-1 text-[15px] font-bold tabular-nums text-[#111827]">
          {formatAppointmentPrice(appointment.priceByn)}
        </p>
      </div>
      <HiChevronRight className="h-5 w-5 shrink-0 text-[#9CA3AF]" aria-hidden />
    </button>
  );
}
