import { HiCheck, HiXMark } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { apptCard, apptOutlineBtn, apptPinkBtn } from './adminAppointmentsTheme';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import { formatAppointmentPrice, formatCardDateTime } from './appointmentsFormat';

type Props = {
  appointment: DemoMasterAppointment;
  onConfirm: () => void;
  onReject: () => void;
};

export function AppointmentsRequestCard({ appointment, onConfirm, onReject }: Props) {
  return (
    <article className={`${apptCard} p-4`}>
      <div className="flex items-start gap-3">
        <AppointmentsClientAvatar name={appointment.clientName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[17px] font-bold tracking-[-0.03em] text-[#111827]">
              {appointment.clientName}
            </p>
            <span className="shrink-0 rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-bold text-[#F47C8C]">
              Новая заявка
            </span>
          </div>
          <p className="mt-1 text-[14px] font-medium leading-snug text-[#6B7280]">
            {appointment.serviceTitle}
          </p>
          <p className="mt-2 text-[13px] font-semibold text-[#374151]">
            {formatCardDateTime(appointment.date, appointment.time)}
          </p>
          <p className="mt-2 text-[17px] font-bold tabular-nums text-[#111827]">
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
