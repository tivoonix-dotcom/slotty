import { useMemo, useState } from 'react';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminFormSheetSection } from '../shared/AdminFormSheetLayout';
import { adminSheetBodyPad, adminSheetPinkBtn } from '../shared/adminCabinetSheetTheme';
import {
  createTemplatePayload,
  DUPLICATE_WINDOW_TEMPLATE_MSG,
  isDuplicateWindowTemplate,
} from './windowTemplateStorage';
import type { WindowTemplate } from './scheduleTypes';
import { labelClass, scheduleInput } from './scheduleUi';

const DURATION_OPTIONS = [
  { value: '30', label: '30 мин' },
  { value: '40', label: '40 мин' },
  { value: '60', label: '1 час' },
  { value: '90', label: '1 ч 30 мин' },
  { value: '120', label: '2 часа' },
  { value: '150', label: '2 ч 30 мин' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  services: MasterOnboardingService[];
  templates: WindowTemplate[];
  onSave: (template: WindowTemplate) => void;
};

export function CreateTemplateModal({ open, onClose, services, templates, onSave }: Props) {
  const [serviceId, setServiceId] = useState('');
  const [duration, setDuration] = useState('120');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const serviceOptions = useMemo(
    () => services.map((s) => ({ value: s.id, label: s.title })),
    [services],
  );

  const handleSave = () => {
    setError(null);
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) {
      setError('Выберите услугу');
      return;
    }
    const minutes = Number(duration);
    if (!Number.isFinite(minutes) || minutes < 10) {
      setError('Укажите длительность');
      return;
    }
    if (isDuplicateWindowTemplate(templates, { serviceId: svc.id, durationMinutes: minutes })) {
      setError(DUPLICATE_WINDOW_TEMPLATE_MSG);
      return;
    }
    const tpl = createTemplatePayload(svc.id, svc.title, minutes, title, templates.length);
    onSave(tpl);
    setServiceId('');
    setDuration('120');
    setTitle('');
    onClose();
  };

  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      title="Создать шаблон"
      subtitle="Быстро добавляйте окна для частых услуг"
      badge="Шаблон окна"
      footer={
        <button type="button" className={adminSheetPinkBtn} onClick={handleSave}>
          Сохранить шаблон
        </button>
      }
    >
      <div className={adminSheetBodyPad}>
        <AdminFormSheetSection title="Параметры шаблона">
          <div className="space-y-3">
            <div>
              <p className={labelClass}>Услуга</p>
              <SlottySelect
                className="mt-1.5 w-full"
                tone="admin"
                value={serviceId}
                onChange={setServiceId}
                options={serviceOptions.length ? serviceOptions : [{ value: '', label: 'Нет услуг' }]}
                aria-label="Услуга"
              />
            </div>
            <div>
              <p className={labelClass}>Длительность</p>
              <SlottySelect
                className="mt-1.5 w-full"
                tone="admin"
                value={duration}
                onChange={setDuration}
                options={DURATION_OPTIONS}
                aria-label="Длительность"
              />
            </div>
            <div>
              <p className={labelClass}>Название шаблона (необязательно)</p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Маникюр · 2 часа"
                className={`${scheduleInput} mt-1.5`}
              />
            </div>
            {error ? (
              <p className="rounded-[16px] bg-[#FFF1F4] px-4 py-3 text-[13px] font-semibold text-[#DC2626]">
                {error}
              </p>
            ) : null}
          </div>
        </AdminFormSheetSection>
      </div>
    </AdminBottomSheet>
  );
}
