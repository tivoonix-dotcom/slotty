import { useEffect, useState } from 'react';
import type { DemoMasterAppointment, DemoAppointmentStatus } from '../../../features/master/model/demoMasterAppointments';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { apptPinkBtn, apptOutlineBtn } from './adminAppointmentsTheme';
import { formatAppointmentPrice } from './appointmentsFormat';

export type AppointmentActionKind = 'confirm' | 'reject' | 'complete' | 'cancel';

export type AppointmentActionConfig = {
  kind: AppointmentActionKind;
  title: string;
  text: string;
  buttonLabel: string;
  nextStatus: DemoAppointmentStatus;
  appointment: DemoMasterAppointment;
};

type Props = {
  config: AppointmentActionConfig | null;
  apiError: string | null;
  onClose: () => void;
  onConfirm: (rejectReason?: string) => void;
};

export function AppointmentsActionSheet({ config, apiError, onClose, onConfirm }: Props) {
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!config) setRejectReason('');
  }, [config]);

  const showRejectReason = config?.kind === 'reject';

  return (
    <AdminBottomSheet open={Boolean(config)} onClose={onClose} title={config?.title ?? ''}>
      {config ? (
        <>
          <div className="rounded-[20px] border border-[#EAECEF] bg-[#FAFAFA] px-4 py-4">
            <p className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">
              {config.appointment.clientName}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-[#6B7280]">
              {config.appointment.serviceTitle}
            </p>
            <p className="mt-3 text-[14px] font-semibold text-[#374151]">
              {config.appointment.date} · {config.appointment.time}
            </p>
            <p className="mt-1 text-[16px] font-bold text-[#111827]">
              {formatAppointmentPrice(config.appointment.priceByn)}
            </p>
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-[#6B7280]">{config.text}</p>

          {showRejectReason ? (
            <label className="mt-4 block">
              <span className="text-[13px] font-semibold text-[#6B7280]">
                Причина отклонения (необязательно)
              </span>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Например: нет свободного окна в это время"
                className="mt-2 w-full resize-none rounded-[16px] border border-[#EAECEF] bg-white px-4 py-3 text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#F9A8B4] focus:ring-2 focus:ring-[#FFF1F4]"
              />
            </label>
          ) : null}

          {apiError ? (
            <p className="mt-4 rounded-[16px] bg-[#FEF2F2] px-4 py-3 text-[14px] font-semibold text-[#EF4444]">
              {apiError}
            </p>
          ) : null}

          <div className="mt-6 flex gap-2">
            <button type="button" onClick={onClose} className={apptOutlineBtn}>
              Назад
            </button>
            <button
              type="button"
              onClick={() => onConfirm(showRejectReason ? rejectReason.trim() : undefined)}
              className={apptPinkBtn}
            >
              {config.buttonLabel}
            </button>
          </div>
        </>
      ) : null}
    </AdminBottomSheet>
  );
}
