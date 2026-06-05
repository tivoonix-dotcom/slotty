import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  apptBadgeConfirmed,
  apptCardBody,
  apptCardShell,
  apptMetaMuted,
  apptPriceText,
  apptTimeStrip,
  apptTimeStripDefault,
} from './adminAppointmentsTheme';
import { resolveClientDisplayName } from './appointmentDetailHelpers';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import { AppointmentsCardDetailFooter } from './AppointmentsCardDetailFooter';
import { estimateDurationLabel, formatAppointmentPrice, formatVisitPlace } from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  onOpen: () => void;
  overdue?: boolean;
};

export function AppointmentsUpcomingRow({ appointment, onOpen, overdue }: Props) {
  const displayName = resolveClientDisplayName(appointment);

  return (
    <article className={apptCardShell}>
      <div className={apptCardBody}>
        <div className={`${apptTimeStrip} ${overdue ? 'bg-[#FEE2E2] text-[#B91C1C]' : apptTimeStripDefault}`}>
          <span className="text-[15px] font-bold tabular-nums leading-none">{appointment.time}</span>
          <span className="text-[11px] font-medium opacity-80">{overdue ? 'не закрыта' : 'запись'}</span>
        </div>

        <div className="flex min-w-0 flex-1 items-start gap-3 p-3.5 sm:p-4">
          <AppointmentsClientAvatar
            name={displayName}
            phone={appointment.contact}
            photoUrl={appointment.clientAvatarUrl}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-[16px] font-bold text-[#111827]">{displayName}</p>
              <span
                className={`shrink-0 ${overdue ? 'rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-bold text-[#B91C1C]' : apptBadgeConfirmed}`}
              >
                {overdue ? 'Визит не закрыт' : 'Подтверждена'}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug text-[#6B7280]">
              {appointment.serviceTitle}
            </p>
            <p className={`mt-1.5 text-[13px] ${apptMetaMuted}`}>
              {estimateDurationLabel(appointment.serviceTitle)} ·{' '}
              {formatVisitPlace(appointment.addressShort)}
            </p>
            <p className={`mt-1 text-[15px] ${apptPriceText}`}>
              {formatAppointmentPrice(appointment.priceByn)}
            </p>
          </div>
        </div>
      </div>
      <AppointmentsCardDetailFooter onClick={onOpen} />
    </article>
  );
}
