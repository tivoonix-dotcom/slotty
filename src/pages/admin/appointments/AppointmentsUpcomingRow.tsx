import { HiChevronRight } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  apptBadgeConfirmed,
  apptCardInteractive,
  apptChevron,
  apptMetaAccent,
  apptPriceAccent,
} from './adminAppointmentsTheme';
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
      className={`${apptCardInteractive} flex w-full items-center gap-3 p-4 text-left`}
    >
      <AppointmentsClientAvatar name={appointment.clientName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[16px] font-bold text-[#111827]">{appointment.clientName}</p>
          <span className={`shrink-0 ${apptBadgeConfirmed}`}>Подтверждена</span>
        </div>
        <p className="mt-0.5 text-[14px] font-medium leading-snug text-[#6B7280]">
          {appointment.serviceTitle}
        </p>
        <p className="mt-1.5 text-[13px] font-semibold text-[#374151]">
          <span className={apptMetaAccent}>{appointment.time}</span>
          {' · '}
          {estimateDurationLabel(appointment.serviceTitle)} · {formatVisitPlace(appointment.addressShort)}
        </p>
        <p className={`mt-1 text-[15px] ${apptPriceAccent}`}>
          {formatAppointmentPrice(appointment.priceByn)}
        </p>
      </div>
      <HiChevronRight className={apptChevron} aria-hidden />
    </button>
  );
}
