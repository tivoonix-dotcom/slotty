import { useEffect, useId, useRef, useState } from 'react';
import { HiArrowDownTray, HiChevronDown, HiDocumentText, HiTableCells } from 'react-icons/hi2';
import { useAuth } from '../../../features/auth/AuthProvider';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { apptFilterBtn, apptFilterBtnActive, apptTrayLabel } from './adminAppointmentsTheme';
import {
  downloadHistoryAppointmentsExcelReport,
  downloadHistoryAppointmentsWordReport,
  type HistoryExportSummary,
} from './exportHistoryAppointmentsReport';

type Props = {
  rows: DemoMasterAppointment[];
  summary: HistoryExportSummary;
  filtersLabel: string;
  disabled?: boolean;
  onSuccess?: (format: 'word' | 'excel') => void;
  onError?: (message: string) => void;
  /** Как кнопка фильтра — только иконка. */
  compact?: boolean;
};

type ExportFormat = 'word' | 'excel';

const OPTIONS: Array<{
  id: ExportFormat;
  label: string;
  hint: string;
  icon: typeof HiDocumentText;
  ext: string;
}> = [
  {
    id: 'word',
    label: 'Word',
    hint: 'Отчёт с логотипом и таблицей',
    icon: HiDocumentText,
    ext: 'docx',
  },
  {
    id: 'excel',
    label: 'Excel',
    hint: 'Таблица для анализа',
    icon: HiTableCells,
    ext: 'xls',
  },
];

export function AppointmentsHistoryExportMenu({
  rows,
  summary,
  filtersLabel,
  disabled = false,
  onSuccess,
  onError,
  compact = false,
}: Props) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const masterName = profile?.full_name?.trim() || 'Мастер';
  const empty = rows.length === 0;
  const active = open || Boolean(busy);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    window.visualViewport?.addEventListener('scroll', onScroll);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
      window.visualViewport?.removeEventListener('scroll', onScroll);
    };
  }, [open]);

  const runExport = async (format: ExportFormat) => {
    if (empty || disabled || busy) return;
    setBusy(format);
    setOpen(false);
    try {
      const params = { masterName, rows, summary, filtersLabel };
      if (format === 'word') {
        await downloadHistoryAppointmentsWordReport(params);
      } else {
        downloadHistoryAppointmentsExcelReport(params);
      }
      onSuccess?.(format);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Не удалось сформировать файл');
    } finally {
      setBusy(null);
    }
  };

  const countLabel =
    rows.length === 1 ? '1 запись' : rows.length < 5 ? `${rows.length} записи` : `${rows.length} записей`;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled || Boolean(busy) || empty}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={listId}
        aria-label={compact ? (busy ? 'Готовим файл…' : 'Экспорт истории') : undefined}
        title={empty ? 'Нет записей для экспорта' : busy ? 'Готовим файл…' : 'Экспорт'}
        onClick={() => setOpen((v) => !v)}
        className={
          compact
            ? `${apptFilterBtn} ${active ? apptFilterBtnActive : ''}`
            : `inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-semibold transition active:scale-[0.98] sm:text-[14px] ${
                active ? 'bg-[#F47C8C] text-white' : 'bg-[#EBEBEB] text-[#374151]'
              }`
        }
      >
        <HiArrowDownTray className={`shrink-0 ${compact ? 'h-5 w-5' : 'h-4 w-4'} ${busy ? 'animate-pulse' : ''}`} aria-hidden />
        {!compact ? <span>{busy ? 'Готовим…' : 'Экспорт'}</span> : null}
        {!compact ? (
          <HiChevronDown
            className={`h-4 w-4 shrink-0 opacity-80 transition ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        ) : null}
      </button>

      {open ? (
        <div
          id={listId}
          role="menu"
          aria-label="Формат экспорта"
          className="absolute right-0 z-40 mt-2 w-[min(16.5rem,calc(100vw-2rem))] rounded-[16px] bg-[#F5F5F5] p-2"
        >
          <div className="px-2 pb-2 pt-1">
            <p className={apptTrayLabel}>Скачать отчёт</p>
            <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{countLabel} · с учётом фильтров</p>
          </div>

          <div className="space-y-1.5">
            {OPTIONS.map(({ id, label, hint, icon: Icon, ext }) => (
              <button
                key={id}
                type="button"
                role="menuitem"
                disabled={Boolean(busy)}
                onClick={() => void runExport(id)}
                className="flex w-full items-center gap-3 rounded-[12px] bg-white px-3 py-3 text-left transition active:scale-[0.99] disabled:opacity-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#F47C8C]">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-[14px] font-bold text-[#111827]">{label}</span>
                    <span className="text-[11px] font-semibold text-[#9CA3AF]">.{ext}</span>
                  </span>
                  <span className="mt-0.5 block text-[12px] font-medium leading-snug text-[#6B7280]">{hint}</span>
                </span>
              </button>
            ))}
          </div>

          <p className="px-2 pb-1 pt-2 text-[11px] font-medium leading-snug text-[#9CA3AF]">
            Дата, клиент, услуга, статус и сумма
          </p>
        </div>
      ) : null}
    </div>
  );
}
