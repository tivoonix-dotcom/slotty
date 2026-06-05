import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi2';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { ADMIN_SERVICES_PATH, getMasterAdminAppointmentsPath } from '../../../app/paths';
import { SlottyDatePicker } from '../../../shared/ui/SlottyDatePicker';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { AdminFormSheetLayout, AdminFormSheetSection } from '../shared/AdminFormSheetLayout';
import { catalogSheetSecondaryBtn } from '../shared/adminCatalogSheetTheme';
import {
  scheduleSheetDangerBtn,
  scheduleSheetPrimaryBtnFull,
  scheduleSheetSecondaryBtn,
  scheduleSheetSummaryPanel,
} from './adminScheduleTheme';
import { ScheduleSheetNotice } from './ScheduleSheetNotice';
import { labelClass } from './scheduleUi';
import type { ScheduleWindowView, WindowTemplate } from './scheduleTypes';
import {
  addMinutesToTime,
  durationMinutesBetween,
  formatDurationRu,
  isScheduleWindowBooked,
} from './scheduleUtils';
import { mergeScheduleTimeSelectOptions } from './scheduleTimeSelectOptions';

type Props = {
  open: boolean;
  window: ScheduleWindowView | null;
  appointments?: DemoMasterAppointment[];
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
  appointments = [],
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

  const booked = isScheduleWindowBooked(w, appointments);
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

  const footer = locked ? (
    <button type="button" className={catalogSheetSecondaryBtn} onClick={onClose}>
      Закрыть
    </button>
  ) : (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className={scheduleSheetPrimaryBtnFull}
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? 'Сохранение…' : 'Сохранить изменения'}
      </button>
      {!confirmDelete ? (
        <button
          type="button"
          className={scheduleSheetDangerBtn}
          disabled={locked}
          onClick={() => setConfirmDelete(true)}
        >
          Удалить окно
        </button>
      ) : (
        <>
          <button type="button" className={scheduleSheetDangerBtn} disabled={saving} onClick={onDelete}>
            {saving ? 'Удаление…' : 'Подтвердить удаление'}
          </button>
          <button type="button" className={scheduleSheetSecondaryBtn} onClick={() => setConfirmDelete(false)}>
            Отмена
          </button>
        </>
      )}
    </div>
  );

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      title="Окно записи"
      subtitle="Время, услуга и статус слота"
      badge={statusLabel}
      accent="schedule"
      footer={footer}
    >
      <AdminFormSheetLayout>
        <AdminFormSheetSection title="Текущее окно" variant="catalog">
          <div className={scheduleSheetSummaryPanel}>
            <p className="text-[16px] font-bold leading-snug tracking-[-0.02em] text-[#111827] sm:text-[17px]">
              {w.serviceName}
            </p>
            <p className="mt-1.5 text-[13px] font-semibold text-[#6B7280] sm:text-[14px]">
              {w.dateIso.split('-').reverse().join('.')} · {w.startTime}–{w.endTime}
            </p>
            {booked && w.clientName ? (
              <p className="mt-2.5 text-[14px] font-bold text-[#111827]">
                {w.clientName}
                {w.clientPhone ? ` · ${w.clientPhone}` : ''}
              </p>
            ) : null}
          </div>
        </AdminFormSheetSection>

        {locked ? (
          <ScheduleSheetNotice
            variant="warning"
            action={
              <Link
                to={getMasterAdminAppointmentsPath({ tab: 'requests' })}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#3B4CCA] transition hover:opacity-80"
              >
                Перейти в заявки
                <HiArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
          >
            На это окно уже есть запись. Изменить или удалить окно нельзя — сначала отмените запись в разделе
            «Заявки».
          </ScheduleSheetNotice>
        ) : null}

        <div className={locked ? 'pointer-events-none space-y-4 opacity-45' : 'space-y-4'}>
          <AdminFormSheetSection title="Параметры" variant="catalog">
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
            <AdminFormSheetSection
              title="Быстро из шаблона"
              description="Подставить длительность и услугу"
              variant="catalog"
            >
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t.id)}
                    className="rounded-full border border-[#D8DCF5] bg-[#EEF0FC] px-3.5 py-2 text-[12px] font-bold text-[#3B4CCA] transition hover:bg-[#E0E4F8] active:scale-[0.98]"
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
            <Link to={ADMIN_SERVICES_PATH} className="font-bold text-[#3B4CCA]">
              Добавьте услуги
            </Link>
          </p>
        ) : null}
      </AdminFormSheetLayout>
    </AdminBottomSheet>
  );
}
