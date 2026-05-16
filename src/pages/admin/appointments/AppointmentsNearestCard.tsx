import { HiChevronRight } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { apptCard } from './adminAppointmentsTheme';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import {
  estimateDurationLabel,
  formatAppointmentPrice,
  formatCardDateTime,
  formatVisitPlace,
} from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  onOpen: () => void;
};

export function AppointmentsNearestCard({ appointment, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${apptCard} w-full p-4 text-left transition active:scale-[0.99]`}
    >
      <span className="inline-flex rounded-full bg-[#FFF1F4] px-3 py-1 text-[11px] font-bold text-[#F47C8C]">
        Ближайшая запись
      </span>
      <div className="mt-3 flex items-start gap-3">
        <AppointmentsClientAvatar name={appointment.clientName} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-bold tracking-[-0.03em] text-[#111827]">
            {appointment.clientName}
          </p>
          <p className="mt-1 text-[14px] font-medium text-[#6B7280]">{appointment.serviceTitle}</p>
          <p className="mt-2 text-[13px] font-semibold text-[#374151]">
            {formatCardDateTime(appointment.date, appointment.time)}
          </p>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            {estimateDurationLabel(appointment.serviceTitle)} · {formatVisitPlace(appointment.addressShort)}
          </p>
          <p className="mt-2 text-[18px] font-bold tabular-nums text-[#111827]">
            {formatAppointmentPrice(appointment.priceByn)}
          </p>
        </div>
        <HiChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#9CA3AF]" aria-hidden />
      </div>
    </button>
  );
}
