import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';
import { SlottyDatePicker } from '../../../shared/ui/SlottyDatePicker';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminFormSheetSection } from '../shared/AdminFormSheetLayout';
import {
  adminSheetBodyPad,
  adminSheetGhostBtn,
  adminSheetPinkBtn,
  adminSheetSecondaryBtn,
} from '../shared/adminCabinetSheetTheme';
import { adminFormSheetHighlight } from '../shared/adminFormSheetTheme';
import type { ScheduleWindowView, WindowTemplate } from './scheduleTypes';
import {
  addMinutesToTime,
  durationMinutesBetween,
  formatDurationRu,
} from './scheduleUtils';
import { mergeScheduleTimeSelectOptions } from './scheduleTimeSelectOptions';
import { dangerBtnClass, labelClass } from './scheduleUi';

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
  const locked = booked;

  const applyTemplate = (tplId: string) => {
    if (locked) return;
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    setServiceId(tpl.serviceId);
    setEndTime(addMinutesToTime(startTime, tpl.durationMinutes));
  };

  const handleSave = () => {
    if (locked) return;
    const sid = serviceId.trim() && isUuid(serviceId.trim()) ? serviceId.trim() : null;
    onSave({ dateIso, startTime, endTime, serviceId: sid });
  };

  const statusLabel =
    booked ? 'Записан клиент' : w.status === 'free' ? 'Свободно' : 'Недоступно';

  return (
    <AdminBottomSheet
      open={open}
      onClose={onClose}
      title="Окно записи"
      subtitle="Время, услуга и статус слота"
      badge={statusLabel}
      footer={
        locked ? (
          <button type="button" className={adminSheetGhostBtn} onClick={onClose}>
            Закрыть
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className={adminSheetPinkBtn}
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? 'Сохранение…' : 'Сохранить изменения'}
            </button>
            {!confirmDelete ? (
              <button
                type="button"
                className={dangerBtnClass}
                disabled={locked}
                onClick={() => setConfirmDelete(true)}
              >
                Удалить окно
              </button>
            ) : (
              <>
                <button type="button" className={adminSheetPinkBtn} disabled={saving} onClick={onDelete}>
                  {saving ? 'Удаление…' : 'Подтвердить удаление'}
                </button>
                <button
                  type="button"
                  className={adminSheetSecondaryBtn}
                  onClick={() => setConfirmDelete(false)}
                >
                  Отмена
                </button>
              </>
            )}
          </div>
        )
      }
    >
      <div className={`${adminSheetBodyPad} space-y-5 lg:space-y-6`}>
        <AdminFormSheetSection title="Текущее окно">
          <div className={adminFormSheetHighlight}>
            <p className="text-[18px] font-black tracking-[-0.04em] text-[#111827] lg:text-[20px]">
              {w.serviceName}
            </p>
            <p className="mt-2 text-[14px] font-semibold text-[#6B7280]">
              {w.dateIso.split('-').reverse().join('.')} · {w.startTime}–{w.endTime}
            </p>
            {booked && w.clientName ? (
              <p className="mt-3 text-[15px] font-bold text-[#111827]">
                {w.clientName}
                {w.clientPhone ? ` · ${w.clientPhone}` : ''}
              </p>
            ) : null}
          </div>
        </AdminFormSheetSection>

        {locked ? (
          <p className="rounded-[20px] border border-[#FDE8ED] bg-[#FFF1F4] px-4 py-3 text-[13px] font-semibold leading-relaxed text-[#9B2C2C]">
            На это окно уже есть запись. Изменить время или услугу нельзя — отмените запись в разделе «Заявки».
          </p>
        ) : null}

        <div className={locked ? 'pointer-events-none space-y-5 opacity-45 lg:space-y-6' : 'space-y-5 lg:space-y-6'}>
          <AdminFormSheetSection title="Параметры">
            <div className="space-y-3">
              <div>
                <p className={labelClass}>Дата</p>
                <SlottyDatePicker className="mt-1.5 w-full" tone="admin" value={dateIso} onChange={setDateIso} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className={labelClass}>С</p>
                  <SlottySelect
                    className="mt-1.5 w-full"
                    tone="admin"
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
                    tone="admin"
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
                  tone="admin"
                  value={serviceId}
                  onChange={setServiceId}
                  options={serviceOptions}
                  aria-label="Услуга"
                />
              </div>
            </div>
          </AdminFormSheetSection>

          {templates.length > 0 && !locked ? (
            <AdminFormSheetSection title="Быстро из шаблона" description="Подставить длительность и услугу">
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t.id)}
                    className="rounded-full border border-[#FDE8ED] bg-[#FFF1F4] px-3.5 py-2 text-[12px] font-bold text-[#ff5f7a] transition hover:bg-[#FFE4EA] active:scale-[0.98]"
                  >
                    {t.serviceName} · {formatDurationRu(t.durationMinutes)}
                  </button>
                ))}
              </div>
            </AdminFormSheetSection>
          ) : null}
        </div>

        {services.length === 0 ? (
          <p className="text-center text-[13px] text-[#6B7280]">
            <Link to={ADMIN_SERVICES_PATH} className="font-bold text-[#ff5f7a]">
              Добавьте услуги
            </Link>
          </p>
        ) : null}
      </div>
    </AdminBottomSheet>
  );
}
