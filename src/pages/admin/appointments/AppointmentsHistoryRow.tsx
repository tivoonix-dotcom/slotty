import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { resolveClientDisplayName } from './appointmentDetailHelpers';
import {
  apptBadgeCancelled,
  apptBadgeCompleted,
  apptCardBody,
  apptCardShell,
  apptHistoryAttentionCard,
  apptMetaMuted,
  apptPriceText,
  apptTimeStrip,
  apptTimeStripCancelled,
  apptTimeStripCompleted,
} from './adminAppointmentsTheme';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import { AppointmentsCardDetailFooter } from './AppointmentsCardDetailFooter';
import {
  formatAppointmentPrice,
  formatCardDateTime,
  formatDurationMinutes,
  historyStatusLabel,
} from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  onOpen: () => void;
  attention?: boolean;
};

function statusBadgeClass(status: DemoMasterAppointment['status']): string {
  if (status === 'completed') return apptBadgeCompleted;
  return apptBadgeCancelled;
}

function timeStripClass(status: DemoMasterAppointment['status']): string {
  if (status === 'completed') return apptTimeStripCompleted;
  return apptTimeStripCancelled;
}

export function AppointmentsHistoryRow({ appointment, onOpen, attention }: Props) {
  const displayName = resolveClientDisplayName(appointment);
  const dateLabel = formatCardDateTime(appointment.date, appointment.time);
  const dateShort = dateLabel.split(' · ')[0] ?? dateLabel;
  const shellClass = attention ? apptHistoryAttentionCard : apptCardShell;

  return (
    <article className={shellClass}>
      <div className={apptCardBody}>
        <div className={`${apptTimeStrip} ${timeStripClass(appointment.status)}`}>
          <span className="text-[15px] font-bold tabular-nums leading-none">{appointment.time}</span>
          <span className="max-w-full px-1 text-[10px] font-medium leading-tight opacity-90">
            {dateShort}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-start gap-3 p-3.5 sm:p-4">
          <AppointmentsClientAvatar
            name={displayName}
            phone={appointment.contact}
            photoUrl={appointment.clientAvatarUrl}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-[16px] font-bold tracking-[-0.02em] text-[#111827]">
                {displayName}
              </p>
              <span className={`shrink-0 ${statusBadgeClass(appointment.status)}`}>
                {historyStatusLabel(appointment.status)}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug text-[#6B7280]">
              {appointment.serviceTitle}
            </p>
            <p className={`mt-1.5 text-[13px] ${apptMetaMuted}`}>
              {formatDurationMinutes(appointment.durationMinutes, appointment.serviceTitle)} · {dateLabel}
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
