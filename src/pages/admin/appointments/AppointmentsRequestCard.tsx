import { HiCheck, HiXMark } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  apptBadgeNew,
  apptMetaAccent,
  apptOutlineBtn,
  apptPinkBtn,
  apptPriceAccent,
  apptRequestCard,
} from './adminAppointmentsTheme';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import { formatAppointmentPrice, formatCardDateTime } from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  onConfirm: () => void;
  onReject: () => void;
};

export function AppointmentsRequestCard({ appointment, onConfirm, onReject }: Props) {
  return (
    <article className={`${apptRequestCard} p-4 pl-5`}>
      <div className="flex items-start gap-3">
        <AppointmentsClientAvatar name={appointment.clientName} variant="gradient" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[17px] font-black tracking-[-0.03em] text-[#111827]">
              {appointment.clientName}
            </p>
            <span className={`shrink-0 ${apptBadgeNew}`}>Новая</span>
          </div>
          <p className="mt-1 text-[14px] font-semibold leading-snug text-[#6B7280]">
            {appointment.serviceTitle}
          </p>
          <p className={`mt-2 text-[13px] ${apptMetaAccent}`}>
            {formatCardDateTime(appointment.date, appointment.time)}
          </p>
          <p className={`mt-2 text-[17px] ${apptPriceAccent}`}>
            {formatAppointmentPrice(appointment.priceByn)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onReject} className={apptOutlineBtn}>
          <HiXMark className="h-4 w-4" aria-hidden />
          Отклонить
        </button>
        <button type="button" onClick={onConfirm} className={apptPinkBtn}>
          <HiCheck className="h-4 w-4" aria-hidden />
          Подтвердить
        </button>
      </div>
    </article>
  );
}
