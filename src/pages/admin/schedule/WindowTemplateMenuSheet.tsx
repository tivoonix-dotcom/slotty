import { useEffect, useState } from 'react';
import { HiTrash } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { catalogSheetSecondaryBtn, catalogSheetTitle } from '../shared/adminCatalogSheetTheme';
import { scheduleSheetPrimaryBtn } from './adminScheduleTheme';
import { sheetSectionClass, sheetSectionTitleClass } from '../profile/adminProfileCabinetTheme';
import type { WindowTemplate } from './scheduleTypes';
import { formatDurationRu, templateDisplayLabel } from './scheduleUtils';
import { WindowTemplateCard } from './WindowTemplateCard';

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
        variant="catalog"
        open={open}
        onClose={handleClose}
        title="Удалить шаблон?"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" className={catalogSheetSecondaryBtn} onClick={() => setConfirming(false)}>
              Отмена
            </button>
            <button
              type="button"
              className={`${scheduleSheetPrimaryBtn} !bg-[#EF4444] hover:!opacity-95`}
              onClick={() => {
                onDelete();
                handleClose();
              }}
            >
              Удалить шаблон
            </button>
          </div>
        }
      >
        <p className="text-[14px] font-medium leading-relaxed text-[#6B7280]">
          Быстрый выбор исчезнет из списка. Если форма нового окна уже открыта — услуга и
          длительность ({duration}) останутся как были.
        </p>
      </AdminBottomSheet>
    );
  }

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={handleClose}
      headerContent={
        <div className="min-w-0 pr-2">
          <h2 id="admin-sheet-title" className={`${catalogSheetTitle} min-w-0 break-words`}>
            {label}
          </h2>
          <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
            {template.serviceName} · {duration}
          </p>
        </div>
      }
      footer={
        <button type="button" onClick={handleClose} className={`${catalogSheetSecondaryBtn} w-full`}>
          Закрыть
        </button>
      }
    >
      <div className="space-y-4">
        <WindowTemplateCard
          template={template}
          selected={false}
          onSelect={() => {}}
          hideMenu
        />

        <section className={sheetSectionClass}>
          <p className={sheetSectionTitleClass}>Управление</p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={`${scheduleSheetPrimaryBtn} mt-3 w-full !bg-[#FEF2F2] !text-[#EF4444] hover:!opacity-95`}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <HiTrash className="h-5 w-5" aria-hidden />
              Удалить шаблон
            </span>
          </button>
        </section>
      </div>
    </AdminBottomSheet>
  );
}
