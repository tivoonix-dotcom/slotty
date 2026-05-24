import type { DemoAppointmentRecord, DemoAppointmentTab } from '../../../features/appointments/model/demoAppointments';
import {
  catalogPanelRowClass,
  catalogPanelRowPad,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
} from './clientProfileTheme';
import { formatPriceByn, statusClassName, statusLabelRu } from '../profileFormat';

type Props = {
  row: DemoAppointmentRecord;
  subTab: DemoAppointmentTab;
  onDetails: (row: DemoAppointmentRecord) => void;
  onCancel: (row: DemoAppointmentRecord) => void;
  onReview: (row: DemoAppointmentRecord) => void;
  onDownloadPdf: (row: DemoAppointmentRecord) => void;
};

export function ClientProfileAppointmentRow({
  row,
  subTab,
  onDetails,
  onCancel,
  onReview,
  onDownloadPdf,
}: Props) {
  const when = `${row.dateLabel}, ${row.timeLabel}`;
  const isCancelled = row.status === 'cancelled';

  return (
    <article className={`${catalogPanelRowClass} ${catalogPanelRowPad}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <button
          type="button"
          onClick={() => onDetails(row)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-[16px] font-bold tracking-[-0.02em] text-[#111827]">{row.masterName}</h3>
            <span
              className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${statusClassName(row.status)}`}
            >
              {statusLabelRu(row.status)}
            </span>
          </div>
          <p className="mt-1 text-[14px] font-medium text-[#6B7280]">{row.serviceTitle}</p>
          <p className="mt-1.5 text-[13px] font-semibold text-[#374151]">{when}</p>
          <p className="mt-0.5 text-[13px] text-[#9CA3AF]">{row.addressShort}</p>
        </button>

        <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center xl:flex-col xl:items-end">
          <p className="text-right text-[20px] font-bold tabular-nums tracking-[-0.02em] text-[#111827]">
            {formatPriceByn(row.price)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => onDetails(row)} className={catalogSecondaryBtn}>
              Подробнее
            </button>
            <button
              type="button"
              onClick={() => onDownloadPdf(row)}
              className={catalogSecondaryBtn}
              title="Скачать PDF"
            >
              PDF
            </button>
            {subTab === 'upcoming' ? (
              isCancelled ? (
                <span className={`${catalogSecondaryBtn} cursor-default opacity-50`}>Отменена</span>
              ) : (
                <button type="button" onClick={() => onCancel(row)} className={catalogSecondaryBtn}>
                  Отменить
                </button>
              )
            ) : row.status === 'completed' ? (
              <button type="button" onClick={() => onReview(row)} className={catalogPrimaryBtn}>
                Отзыв
              </button>
            ) : (
              <span className={`${catalogSecondaryBtn} cursor-default opacity-50`}>
                {row.status === 'cancelled' ? 'Отменена' : 'Завершена'}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
