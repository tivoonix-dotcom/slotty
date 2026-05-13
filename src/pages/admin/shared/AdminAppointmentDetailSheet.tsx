import {
  appointmentStatusLabel,
  type DemoMasterAppointment,
} from '../../../features/master/model/demoMasterAppointments';
import { formatBynRu, formatDdMmYyyy } from '../overview/overviewFormat';
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
      <span className="shrink-0 text-neutral-500">{label}</span>
      <span className="min-w-0 flex-1 text-right font-semibold text-neutral-950">{value}</span>
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
          <div className="space-y-2.5 rounded-[22px] bg-[#F1EFEF]/80 p-4">
            <Row label="Клиент" value={appointment.clientName} />
            <Row label="Услуга" value={appointment.serviceTitle} />
            <Row label="Дата" value={formatDdMmYyyy(appointment.date)} />
            <Row label="Время" value={appointment.timeLabel ?? appointment.time} />
            <Row label="Адрес" value={appointment.addressShort?.trim() || '—'} />
            <Row label="Стоимость" value={formatBynRu(appointment.priceByn)} />
            <Row label="Статус" value={appointmentStatusLabel(appointment.status)} />
          </div>

          {appointment.status === 'pending' && onUpdateAppointment ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  // TODO (Supabase): подтверждение записи на сервере
                  patch({ ...appointment, status: 'confirmed' });
                }}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
              >
                Подтвердить
              </button>
              <button
                type="button"
                onClick={() => {
                  // TODO (Supabase): отклонение / отмена с уведомлением клиенту
                  patch({ ...appointment, status: 'cancelled' });
                }}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-800 transition active:scale-[0.98]"
              >
                Отклонить
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-800 transition active:scale-[0.98]"
          >
            Закрыть
          </button>
        </div>
      ) : null}
    </AdminBottomSheet>
  );
}
