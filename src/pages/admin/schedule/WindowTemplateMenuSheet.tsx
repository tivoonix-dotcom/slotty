import { useEffect, useState } from 'react';
import { HiTrash, HiXMark } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { adminSheetGhostBtn, adminSheetPinkBtn } from '../shared/adminCabinetSheetTheme';
import type { WindowTemplate } from './scheduleTypes';
import { formatDurationRu, templateDisplayLabel } from './scheduleUtils';

type Props = {
  open: boolean;
  template: WindowTemplate | null;
  onClose: () => void;
  onDelete: () => void;
};

export function WindowTemplateMenuSheet({ open, template, onClose, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  if (!template) return null;

  const label = templateDisplayLabel(template);
  const duration = formatDurationRu(template.durationMinutes);

  const handleClose = () => {
    setConfirming(false);
    onClose();
  };

  if (confirming) {
    return (
      <AdminBottomSheet
        open={open}
        onClose={handleClose}
        title="Удалить шаблон?"
        subtitle={`${label} · ${duration}`}
        badge="Шаблон окна"
      >
        <div className="space-y-4 pb-2">
          <p className="text-[14px] font-semibold leading-relaxed text-[#6B7280]">
            Быстрый выбор исчезнет из списка. Если форма нового окна уже открыта — услуга и
            длительность (например, {duration}) останутся как были, ничего не сбросится.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={adminSheetGhostBtn} onClick={() => setConfirming(false)}>
              Отмена
            </button>
            <button
              type="button"
              className={`${adminSheetPinkBtn} bg-[#EF4444] from-[#EF4444] to-[#DC2626] shadow-[0_8px_22px_rgba(239,68,68,0.28)]`}
              onClick={() => {
                onDelete();
                handleClose();
              }}
            >
              Удалить шаблон
            </button>
          </div>
        </div>
      </AdminBottomSheet>
    );
  }

  return (
    <AdminBottomSheet open={open} onClose={handleClose} title={label} subtitle={`${template.serviceName} · ${duration}`} badge="Шаблон окна">
      <div className="space-y-0.5 pb-2">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex w-full items-center gap-3 rounded-[16px] px-2 py-2.5 text-left transition active:scale-[0.98] hover:bg-[#FAFAFA]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FEF2F2] text-[#EF4444]">
            <HiTrash className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-[15px] font-semibold text-[#EF4444]">Удалить шаблон</span>
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="flex w-full items-center gap-3 rounded-[16px] px-2 py-2.5 text-left transition active:scale-[0.98] hover:bg-[#FAFAFA]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] text-[#F47C8C]">
            <HiXMark className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-[15px] font-semibold text-[#111827]">Закрыть</span>
        </button>
      </div>
    </AdminBottomSheet>
  );
}
