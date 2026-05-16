import {
  appointmentStatusLabel,
  type DemoMasterAppointment,
} from '../../../features/master/model/demoMasterAppointments';
import { formatBynRu, formatDdMmYyyy } from '../overview/overviewFormat';
import { apptOutlineBtn, apptPinkBtn } from '../appointments/adminAppointmentsTheme';
import { formatVisitPlace, estimateDurationLabel } from '../appointments/appointmentsFormat';
import { AdminBottomSheet } from './AdminBottomSheet';

type Props = {
  appointment: DemoMasterAppointment | null;
  onClose: () => void;
  /** Локальное обновление демо-записи. TODO (Supabase): PATCH appointment, валидация слота. */
  onUpdateAppointment?: (next: DemoMasterAppointment) => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-[14px] leading-snug">
      <span className="shrink-0 text-[#6B7280]">{label}</span>
      <span className="min-w-0 flex-1 text-right font-semibold text-[#111827]">{value}</span>
    </div>
  );
}

export function AdminAppointmentDetailSheet({ appointment, onClose, onUpdateAppointment }: Props) {
  const patch = (next: DemoMasterAppointment) => {
    onUpdateAppointment?.(next);
    onClose();
  };

  return (
    <AdminBottomSheet open={Boolean(appointment)} onClose={onClose} title="Запись">
      {appointment ? (
        <div className="space-y-3 pb-2">
          <div className="space-y-2.5 rounded-[20px] border border-[#EAECEF] bg-[#FAFAFA] p-4">
            <Row label="Клиент" value={appointment.clientName} />
            <Row label="Услуга" value={appointment.serviceTitle} />
            <Row label="Дата" value={formatDdMmYyyy(appointment.date)} />
            <Row label="Время" value={appointment.timeLabel ?? appointment.time} />
            <Row
              label="Длительность"
              value={estimateDurationLabel(appointment.serviceTitle)}
            />
            <Row label="Формат" value={formatVisitPlace(appointment.addressShort)} />
            <Row label="Адрес" value={appointment.addressShort?.trim() || 'Не указан'} />
            <Row label="Стоимость" value={formatBynRu(appointment.priceByn)} />
            <Row label="Статус" value={appointmentStatusLabel(appointment.status)} />
            {appointment.contact ? <Row label="Контакт" value={appointment.contact} /> : null}
          </div>

          {appointment.status === 'pending' && onUpdateAppointment ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => patch({ ...appointment, status: 'confirmed' })}
                className={apptPinkBtn}
              >
                Подтвердить
              </button>
              <button
                type="button"
                onClick={() => patch({ ...appointment, status: 'cancelled' })}
                className={apptOutlineBtn}
              >
                Отклонить
              </button>
            </div>
          ) : null}

          {appointment.status === 'confirmed' && onUpdateAppointment ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => patch({ ...appointment, status: 'completed' })}
                className={apptPinkBtn}
              >
                Завершить визит
              </button>
              <button
                type="button"
                onClick={() => patch({ ...appointment, status: 'cancelled' })}
                className={apptOutlineBtn}
              >
                Отменить запись
              </button>
            </div>
          ) : null}

          <button type="button" onClick={onClose} className={apptOutlineBtn}>
            Закрыть
          </button>
        </div>
      ) : null}
    </AdminBottomSheet>
  );
}
