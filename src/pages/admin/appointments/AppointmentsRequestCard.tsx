import { HiCheck, HiPhoto, HiXMark } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  apptBadgeNew,
  apptCardActions,
  apptCardBody,
  apptCardShell,
  apptMetaMuted,
  apptOutlineBtn,
  apptPinkBtn,
  apptPriceText,
  apptTimeStrip,
  apptTimeStripNew,
} from './adminAppointmentsTheme';
import { AppointmentsClientSummary } from './AppointmentsClientSummary';
import { formatAppointmentPrice, formatCardDateTime } from './appointmentsFormat';
import { AppointmentsCardDetailFooter } from './AppointmentsCardDetailFooter';
import { PendingDeadlineHint, isPendingConfirmDisabled } from './PendingDeadlineHint';

type Props = {
  appointment: DemoMasterAppointment;
  onConfirm: () => void;
  onReject: () => void;
  onOpenDetail: () => void;
};

export function AppointmentsRequestCard({
  appointment,
  onConfirm,
  onReject,
  onOpenDetail,
}: Props) {
  const dateTime = formatCardDateTime(appointment.date, appointment.time);
  const confirmDisabled = isPendingConfirmDisabled(
    appointment.dbStatus ?? appointment.status,
    appointment.pendingExpiresAt,
  );

  return (
    <article className={apptCardShell}>
      <div className={apptCardBody}>
        <div className={`${apptTimeStrip} ${apptTimeStripNew}`}>
          <span className="text-[11px] font-semibold uppercase tracking-wide opacity-90">Новая</span>
          <span className="text-[15px] font-bold tabular-nums leading-none">{appointment.time}</span>
          <span className="max-w-full px-1 text-[10px] font-medium leading-tight opacity-80">
            {dateTime.split(' · ')[0] ?? dateTime}
          </span>
        </div>

        <div className="min-w-0 flex-1 p-3.5 sm:p-4">
          <AppointmentsClientSummary appointment={appointment} compact />
          <div className="mt-3">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-[14px] font-medium leading-snug text-[#6B7280]">
                {appointment.serviceTitle}
              </p>
              <span className={`shrink-0 lg:hidden ${apptBadgeNew}`}>Новая</span>
            </div>
              {appointment.clientReferencePhotoUrl ? (
                <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#F47C8C]">
                  <HiPhoto className="h-3.5 w-3.5" aria-hidden />
                  Есть фото-референс
                </p>
              ) : null}
              <p className={`mt-2 hidden text-[13px] lg:block ${apptMetaMuted}`}>{dateTime}</p>
              <p className={`mt-2 text-[16px] ${apptPriceText}`}>
                {formatAppointmentPrice(appointment.priceByn)}
              </p>
              <PendingDeadlineHint pendingExpiresAt={appointment.pendingExpiresAt} className="mt-2" />
          </div>
        </div>
      </div>

      <div className={apptCardActions}>
        <button type="button" onClick={onReject} className={apptOutlineBtn}>
          <HiXMark className="h-4 w-4" aria-hidden />
          Отклонить
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          className={`${apptPinkBtn} disabled:opacity-50`}
        >
          <HiCheck className="h-4 w-4" aria-hidden />
          Подтвердить
        </button>
      </div>
      <AppointmentsCardDetailFooter onClick={onOpenDetail} />
    </article>
  );
}
