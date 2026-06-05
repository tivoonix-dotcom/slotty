import { useState } from 'react';
import {
  BOOKING_CLIENT_REPORT_REASONS,
  submitBookingClientReport,
  type BookingClientReportReason,
} from '../../../features/appointments/api/bookingClientReportApi';
import { AdminBottomSheet } from './AdminBottomSheet';
import {
  catalogSheetField,
  catalogSheetLabel,
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from './adminCatalogSheetTheme';

type Props = {
  open: boolean;
  appointmentId: string;
  clientName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function MasterClientReportSheet({
  open,
  appointmentId,
  clientName,
  onClose,
  onSuccess,
}: Props) {
  const [reasonCode, setReasonCode] = useState<BookingClientReportReason>('client_misconduct');
  const [reasonText, setReasonText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await submitBookingClientReport(appointmentId, {
        reasonCode,
        reasonText: reasonText.trim() || null,
      });
      onSuccess();
      onClose();
      setReasonText('');
      setReasonCode('client_misconduct');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить жалобу');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      title="Пожаловаться на клиента"
      footer={
        <div className="flex w-full flex-col gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={catalogSheetSecondaryBtn}>
            Отмена
          </button>
          <button type="button" onClick={() => void submit()} disabled={busy || (reasonCode === 'other' && reasonText.trim().length < 10)} className={catalogSheetPrimaryBtn}>
            {busy ? 'Отправка…' : 'Отправить жалобу'}
          </button>
        </div>
      }
    >
      <p className="text-[14px] leading-relaxed text-[#6B7280]">
        Жалоба на клиента{' '}
        <span className="font-semibold text-[#111827]">{clientName}</span> попадёт в админку SLOTTY. Мы
        проверим информацию и при необходимости примем меры.
      </p>

      <fieldset className="mt-5 space-y-2">
        <legend className={catalogSheetLabel}>Причина</legend>
        {BOOKING_CLIENT_REPORT_REASONS.map((item) => (
          <label
            key={item.code}
            className={`flex cursor-pointer items-start gap-3 rounded-[12px] border px-3 py-2.5 text-[14px] transition ${
              reasonCode === item.code
                ? 'border-[#111827] bg-[#F8F7F7] text-[#111827]'
                : 'border-[#EEEEEE] bg-white text-[#374151] hover:border-[#D1D5DB]'
            }`}
          >
            <input
              type="radio"
              name="client-report-reason"
              value={item.code}
              checked={reasonCode === item.code}
              onChange={() => setReasonCode(item.code)}
              className="mt-1 accent-[#111827]"
            />
            <span>{item.label}</span>
          </label>
        ))}
      </fieldset>

      <label className="mt-4 block">
        <span className={catalogSheetLabel}>
          {reasonCode === 'other' ? 'Опишите проблему *' : 'Комментарий (необязательно)'}
        </span>
        <textarea
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={
            reasonCode === 'other'
              ? 'Расскажите, что произошло…'
              : 'Дополнительные детали для модерации…'
          }
          className={`${catalogSheetField} mt-2 min-h-[5rem] resize-none`}
        />
      </label>

      {error ? (
        <p className="mt-3 rounded-[10px] bg-[#FEF2F2] px-3 py-2 text-[13px] font-semibold text-[#EF4444]">
          {error}
        </p>
      ) : null}
    </AdminBottomSheet>
  );
}
