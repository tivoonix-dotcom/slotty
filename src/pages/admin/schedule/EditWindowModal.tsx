import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';
import { SlottyDatePicker } from '../../../shared/ui/SlottyDatePicker';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import type { ScheduleWindowView, WindowTemplate } from './scheduleTypes';
import {
  addMinutesToTime,
  durationMinutesBetween,
  formatDurationRu,
} from './scheduleUtils';
import { mergeScheduleTimeSelectOptions } from './scheduleTimeSelectOptions';
import { dangerBtnClass, labelClass, primaryBtnClass, secondaryBtnClass } from './scheduleUi';

type Props = {
  open: boolean;
  window: ScheduleWindowView | null;
  onClose: () => void;
  services: MasterOnboardingService[];
  templates: WindowTemplate[];
  saving: boolean;
  onSave: (payload: {
    dateIso: string;
    startTime: string;
    endTime: string;
    serviceId: string | null;
  }) => void;
  onDelete: () => void;
};

export function EditWindowModal({
  open,
  window: w,
  onClose,
  services,
  templates,
  saving,
  onSave,
  onDelete,
}: Props) {
  const [dateIso, setDateIso] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [serviceId, setServiceId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!w) return;
    setDateIso(w.dateIso);
    setStartTime(w.startTime);
    setEndTime(w.endTime);
    setServiceId(w.serviceId ?? '');
    setConfirmDelete(false);
  }, [w]);

  const serviceOptions = useMemo(
    () => [
      { value: '', label: 'Любая услуга' },
      ...services.filter((s) => isUuid(s.id)).map((s) => ({ value: s.id, label: s.title })),
    ],
    [services],
  );

  const mergedTimeOptions = useMemo(
    () => mergeScheduleTimeSelectOptions(startTime, endTime),
    [endTime, startTime],
  );

  if (!w) return null;

  const booked = w.status === 'booked';

  const applyTemplate = (tplId: string) => {
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    setServiceId(tpl.serviceId);
    setEndTime(addMinutesToTime(startTime, tpl.durationMinutes));
  };

  const handleSave = () => {
    const sid = serviceId.trim() && isUuid(serviceId.trim()) ? serviceId.trim() : null;
    onSave({ dateIso, startTime, endTime, serviceId: sid });
  };

  return (
    <AdminBottomSheet open={open} onClose={onClose} title="Окно записи">
      <div className="space-y-4">
        <div className="rounded-[20px] bg-[#F1EFEF] px-4 py-3">
          <p className="text-[15px] font-semibold text-neutral-900">{w.serviceName}</p>
          <p className="mt-1 text-[13px] text-neutral-600">
            {w.dateIso.split('-').reverse().join('.')} · {w.startTime}–{w.endTime}
          </p>
          <p className="mt-2 text-[12px] font-semibold text-neutral-500">
            {booked ? 'Записан клиент' : w.status === 'free' ? 'Свободно' : 'Недоступно'}
          </p>
          {booked && w.clientName ? (
            <p className="mt-1 text-[14px] font-medium text-neutral-800">
              {w.clientName}
              {w.clientPhone ? ` · ${w.clientPhone}` : ''}
            </p>
          ) : null}
        </div>

        <div>
          <p className={labelClass}>Дата</p>
          <SlottyDatePicker className="mt-1.5 w-full" value={dateIso} onChange={setDateIso} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={labelClass}>С</p>
            <SlottySelect
              className="mt-1.5 w-full"
              value={startTime}
              onChange={(v) => {
                setStartTime(v);
                const dur = durationMinutesBetween(startTime, endTime);
                if (dur > 0) setEndTime(addMinutesToTime(v, dur));
              }}
              options={mergedTimeOptions}
              aria-label="Время начала"
            />
          </div>
          <div>
            <p className={labelClass}>По</p>
            <SlottySelect
              className="mt-1.5 w-full"
              value={endTime}
              onChange={setEndTime}
              options={mergedTimeOptions}
              aria-label="Время окончания"
            />
          </div>
        </div>
        <div>
          <p className={labelClass}>Услуга</p>
          <SlottySelect
            className="mt-1.5 w-full"
            value={serviceId}
            onChange={setServiceId}
            options={serviceOptions}
            aria-label="Услуга"
          />
        </div>
        {templates.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                className="rounded-full bg-[#FFF5F5] px-3 py-1.5 text-[12px] font-semibold text-[#C97B7B]"
              >
                {t.serviceName} · {formatDurationRu(t.durationMinutes)}
              </button>
            ))}
          </div>
        ) : null}

        <button type="button" className={primaryBtnClass} disabled={saving} onClick={handleSave}>
          Сохранить изменения
        </button>

        {!confirmDelete ? (
          <button type="button" className={dangerBtnClass} onClick={() => setConfirmDelete(true)}>
            Удалить окно
          </button>
        ) : (
          <div className="space-y-2 rounded-[20px] bg-[#FFF0F0] p-4">
            <p className="text-[13px] font-semibold leading-snug text-[#9B2C2C]">
              {booked
                ? 'На это окно уже записан клиент. Удаление может отменить запись.'
                : 'Удалить это окно? Клиенты больше не смогут записаться на это время.'}
            </p>
            <div className="flex gap-2">
              <button type="button" className={secondaryBtnClass} onClick={() => setConfirmDelete(false)}>
                Отмена
              </button>
              <button type="button" className={dangerBtnClass} disabled={saving} onClick={onDelete}>
                Удалить
              </button>
            </div>
          </div>
        )}

        {services.length === 0 ? (
          <p className="text-center text-[13px] text-neutral-500">
            <Link to={ADMIN_SERVICES_PATH} className="font-semibold text-[#C97B7B]">
              Добавьте услуги
            </Link>
          </p>
        ) : null}
      </div>
    </AdminBottomSheet>
  );
}
