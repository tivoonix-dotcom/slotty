import { HiChevronRight } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  apptBadgeNew,
  apptChevron,
  apptHighlightCard,
  apptMetaAccent,
  apptPriceAccent,
} from './adminAppointmentsTheme';
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
      className={`${apptHighlightCard} group w-full p-4 text-left transition active:scale-[0.99]`}
    >
      <span className={`inline-flex ${apptBadgeNew}`}>Ближайшая запись</span>
      <div className="mt-3 flex items-start gap-3">
        <AppointmentsClientAvatar name={appointment.clientName} size="lg" variant="gradient" />
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-black tracking-[-0.03em] text-[#111827]">
            {appointment.clientName}
          </p>
          <p className="mt-1 text-[14px] font-semibold text-[#6B7280]">{appointment.serviceTitle}</p>
          <p className={`mt-2 text-[13px] ${apptMetaAccent}`}>
            {formatCardDateTime(appointment.date, appointment.time)}
          </p>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            {estimateDurationLabel(appointment.serviceTitle)} · {formatVisitPlace(appointment.addressShort)}
          </p>
          <p className={`mt-2 text-[18px] ${apptPriceAccent}`}>
            {formatAppointmentPrice(appointment.priceByn)}
          </p>
        </div>
        <HiChevronRight className={`mt-1 ${apptChevron}`} aria-hidden />
      </div>
    </button>
  );
}
