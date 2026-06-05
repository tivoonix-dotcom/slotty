import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  HiArrowTopRightOnSquare,
  HiBuildingOffice2,
  HiCheck,
  HiHomeModern,
  HiTruck,
} from 'react-icons/hi2';
import { buildYandexMapWidgetUrl, buildYandexMapsRouteUrl } from '../../../../features/appointments/model/demoAppointments';
import { sanitizeAtHomeRoomInput } from '../../../../features/profile/lib/masterAddressValidation';
import type { MasterLocation } from '../../../../features/profile/model/masterLocation';
import { makeYandexMapsPointUrl } from '../../../../shared/lib/yandexMapsExternal';
import { searchAddress } from '../../../../shared/lib/location/nominatimGeocode';
import { AdminToast } from '../../shared/AdminToast';
import { useAdminToast } from '../../shared/useAdminToast';
import { AppointmentsEmptyState } from '../../appointments/AppointmentsEmptyState';
import {
  splitReferenceLabelToStreetBuilding,
  splitReferenceLabelToStreetBuildingLenient,
} from '../../../master-onboarding/OnboardingAddressMap';
import { LocationPickerModalField } from '../../../../shared/ui/location/LocationPickerModalField';
import { SettingsErrorState, SettingsSkeleton, SettingsStatusBadge } from '../../settings/workspace/settingsUi';
import { settingsCabinetStack } from '../../settings/workspace/settingsCabinetUi';
import { settingsPinkBtn } from '../../settings/workspace/settingsWorkspaceTheme';
import {
  cabinetCard,
  cabinetCardPad,
  cabinetInsetShell,
  cabinetOutlineBtn,
  sheetFieldClass,
  sheetLabelClass,
  sheetSegmentClass,
} from '../adminProfileCabinetTheme';
import type { MasterDraft } from '../../../../features/profile/lib/demoMasterStorage';
import {
  afterBookingPreviewRows,
  buildLocationFromForm,
  buildPublicPreviewLine,
  computeAddressChecklist,
  formFingerprint,
  formStateFromLocation,
  hasVerifiedMapPoint,
  locationFingerprint,
  MASTER_CABINET_CITY,
  previewLocationFromForm,
  resolveMapPointStatus,
  streetDisplayLine,
  validateAddressForm,
  type AddressFormState,
  type AddressVisitFormat,
} from './addressFormModel';

const VISIT_FORMATS: Array<{
  id: AddressVisitFormat;
  label: string;
  Icon: typeof HiBuildingOffice2;
  disabled?: boolean;
}> = [
  { id: 'studio', label: 'В студии', Icon: HiBuildingOffice2 },
  { id: 'at_home', label: 'На дому', Icon: HiHomeModern },
  { id: 'client_visit', label: 'Выезд', Icon: HiTruck, disabled: true },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[12px] font-medium text-[#DC2626]">{message}</p>;
}

function Block({
  title,
  children,
  last,
  inset = true,
}: {
  title?: string;
  children: ReactNode;
  last?: boolean;
  inset?: boolean;
}) {
  return (
    <div className={last ? '' : 'mb-4'}>
      {title ? (
        <h3 className="mb-2 px-0.5 text-[14px] font-semibold text-[#111827]">{title}</h3>
      ) : null}
      {inset ? <div className={`${cabinetInsetShell} p-4 sm:p-5`}>{children}</div> : children}
    </div>
  );
}

type Props = {
  draft: MasterDraft;
  cabinetLoading?: boolean;
  saving?: boolean;
  onSave: (location: MasterDraft['location']) => Promise<void>;
};

export function AdminProfileAddressPage({ draft, cabinetLoading, saving = false, onSave }: Props) {
  const { toast, showToast, showErrorToast, clearToast } = useAdminToast();
  const loc = draft.location;

  const [form, setForm] = useState<AddressFormState>(() => formStateFromLocation(loc));
  const [savedFingerprint, setSavedFingerprint] = useState(() => formFingerprint(formStateFromLocation(loc)));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mapScriptOk, setMapScriptOk] = useState(false);
  const [addressPinnedToMap, setAddressPinnedToMap] = useState(() => hasVerifiedMapPoint(formStateFromLocation(loc)));
  const [geocodeBusy, setGeocodeBusy] = useState(false);

  const locationSyncFingerprint = useMemo(() => locationFingerprint(loc), [loc]);

  useEffect(() => {
    const next = formStateFromLocation(loc);
    setForm(next);
    setSavedFingerprint(formFingerprint(next));
    setFieldErrors({});
    setSubmitAttempted(false);
    setSaveError(null);
    setAddressPinnedToMap(hasVerifiedMapPoint(next));
  }, [locationSyncFingerprint]);

  const dirty = formFingerprint(form) !== savedFingerprint;
  const isHome = form.visitType === 'at_home';
  const isStudio = form.visitType === 'studio';
  const previewLoc = useMemo(() => previewLocationFromForm(loc, form), [form, loc]);
  const publicPreview = buildPublicPreviewLine(previewLoc);
  const checklist = computeAddressChecklist(form, { mapScriptOk, addressPinnedToMap });
  const mapStatus = resolveMapPointStatus(form, mapScriptOk, addressPinnedToMap);
  const pendingChecklist = checklist.filter((item) => !item.done && item.id !== 'ready');
  const hasMap = hasVerifiedMapPoint(form);

  const showErr = (key: string) => (submitAttempted ? fieldErrors[key] : undefined);

  const patchForm = useCallback((patch: Partial<AddressFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaveError(null);
  }, []);

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const onStreetLineChange = useCallback(
    (value: string) => {
      setAddressPinnedToMap(false);
      clearFieldError('street');
      clearFieldError('coords');
      if (value === '') {
        patchForm({ street: '', building: 'б/н' });
        return;
      }
      const { street, building } = splitReferenceLabelToStreetBuildingLenient(value);
      patchForm({ street, building });
    },
    [clearFieldError, patchForm],
  );

  const handleSave = async () => {
    if (form.visitType === 'client_visit') return;
    setSubmitAttempted(true);
    const errs = validateAddressForm(form, { mapScriptOk, addressPinnedToMap });
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaveError(null);
    try {
      await onSave(buildLocationFromForm(loc, form));
      setSavedFingerprint(formFingerprint(form));
      setSubmitAttempted(false);
      showToast('Сохранено');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось сохранить';
      setSaveError(msg);
      showErrorToast(msg);
    }
  };

  const handleDiscard = () => {
    const reset = formStateFromLocation(loc);
    setForm(reset);
    setFieldErrors({});
    setSubmitAttempted(false);
    setSaveError(null);
    setAddressPinnedToMap(hasVerifiedMapPoint(reset));
  };

  const findByAddress = async () => {
    const query = streetDisplayLine(form).trim();
    if (query.length < 3) {
      setFieldErrors((prev) => ({ ...prev, street: 'Укажите улицу и дом' }));
      setSubmitAttempted(true);
      return;
    }
    setGeocodeBusy(true);
    try {
      const hits = await searchAddress(`${MASTER_CABINET_CITY}, ${query}`);
      const hit = hits[0];
      if (!hit) {
        setFieldErrors((prev) => ({ ...prev, coords: 'Адрес не найден' }));
        setSubmitAttempted(true);
        return;
      }
      const { street, building } = splitReferenceLabelToStreetBuilding(hit.cleanAddress);
      patchForm({ street, building, lat: hit.latitude, lng: hit.longitude });
      setAddressPinnedToMap(true);
      clearFieldError('street');
      clearFieldError('coords');
    } catch {
      showErrorToast('Не удалось найти адрес');
    } finally {
      setGeocodeBusy(false);
    }
  };

  const mapWidgetSrc = useMemo(() => {
    if (!hasMap) return null;
    const line = publicPreview || streetDisplayLine(form) || MASTER_CABINET_CITY;
    return buildYandexMapWidgetUrl({
      addressShort: line,
      location: {
        visitType: isHome ? 'at_home' : 'studio',
        street: form.street,
        building: form.building,
        lat: form.lat,
        lng: form.lng,
      },
    });
  }, [form, hasMap, isHome, publicPreview]);

  const yandexMapsUrl = hasMap
    ? makeYandexMapsPointUrl(form.lat!, form.lng!)
    : `https://yandex.by/maps/?text=${encodeURIComponent(publicPreview || streetDisplayLine(form) || MASTER_CABINET_CITY)}`;

  const routePreviewUrl = buildYandexMapsRouteUrl({
    addressShort: publicPreview || streetDisplayLine(form),
    location: previewLoc,
  });

  const mapActions = (
    <div className="flex w-full flex-col gap-2">
      <LocationPickerModalField
        value={streetDisplayLine(form)}
        latitude={form.lat ?? null}
        longitude={form.lng ?? null}
        city={MASTER_CABINET_CITY}
        onChange={(next) => {
          const { street, building } = splitReferenceLabelToStreetBuilding(next.address);
          patchForm({ street, building, lat: next.latitude, lng: next.longitude });
          setAddressPinnedToMap(true);
          clearFieldError('street');
          clearFieldError('coords');
        }}
        onInputChange={onStreetLineChange}
        onMapAvailabilityChange={setMapScriptOk}
        inputClassName={sheetFieldClass}
        triggerLabel="Изменить точку"
        triggerClassName={cabinetOutlineBtn}
        modalTitle="Точка на карте"
        modalSubtitle="Подсказка или метка на карте."
        coordsError={showErr('coords')}
        summaryClassName="hidden"
      />
      <button
        type="button"
        disabled={geocodeBusy}
        onClick={() => void findByAddress()}
        className={cabinetOutlineBtn}
      >
        {geocodeBusy ? 'Поиск…' : 'Найти по адресу'}
      </button>
      <a href={yandexMapsUrl} target="_blank" rel="noopener noreferrer" className={cabinetOutlineBtn}>
        <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
        Открыть в Яндекс.Картах
      </a>
    </div>
  );

  if (cabinetLoading) {
    return (
      <div className={settingsCabinetStack}>
        <SettingsSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className={`w-full min-w-0 space-y-4 ${dirty ? 'pb-28 lg:pb-20' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#111827]">Адрес</h1>
          {mapStatus === 'verified' ? (
            <SettingsStatusBadge tone="success">На карте</SettingsStatusBadge>
          ) : (
            <SettingsStatusBadge tone="warning">Нужна метка</SettingsStatusBadge>
          )}
        </div>
        <button
          type="button"
          disabled={!dirty || saving || form.visitType === 'client_visit'}
          onClick={() => void handleSave()}
          className={`hidden min-h-9 sm:inline-flex ${settingsPinkBtn}`}
        >
          {saving ? '…' : 'Сохранить'}
        </button>
      </div>

      {saveError ? <SettingsErrorState message={saveError} onRetry={() => void handleSave()} /> : null}

      <div className={`${cabinetCard} ${cabinetCardPad}`}>
        <Block title="Формат">
          <div
            className="grid grid-cols-1 gap-1.5 rounded-[10px] bg-[#F5F5F5] p-1.5 sm:grid-cols-3"
            role="group"
            aria-label="Формат приёма"
          >
            {VISIT_FORMATS.map(({ id, label, Icon, disabled }) => (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  patchForm({ visitType: id });
                  setFieldErrors({});
                  setSubmitAttempted(false);
                }}
                className={`flex min-h-11 w-full items-center justify-start gap-2.5 px-3 sm:min-h-10 sm:justify-center sm:gap-1.5 sm:px-2 ${sheetSegmentClass(form.visitType === id)} disabled:opacity-45`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="text-[14px] font-semibold leading-none sm:text-[13px]">{label}</span>
                {disabled ? (
                  <span className="ml-auto rounded-full bg-[#EBEBEB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9CA3AF] sm:ml-0 sm:hidden">
                    Скоро
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          {form.visitType === 'client_visit' ? (
            <p className="mt-3 hidden text-center text-[13px] text-[#9CA3AF] sm:block">Скоро</p>
          ) : null}
        </Block>

        {form.visitType !== 'client_visit' ? (
          <>
            <Block title="Адрес для каталога">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className={sheetLabelClass}>Город</span>
                    <p className="rounded-[10px] bg-[#EBEBEB] px-4 py-3 text-[15px] font-medium text-[#111827]">
                      {MASTER_CABINET_CITY}
                    </p>
                  </div>
                  {isHome ? (
                    <label className="block">
                      <span className={sheetLabelClass}>Район</span>
                      <input
                        value={form.district}
                        onChange={(e) => patchForm({ district: e.target.value })}
                        className={sheetFieldClass}
                        placeholder="Необязательно"
                      />
                    </label>
                  ) : null}
                </div>

                {isStudio ? (
                  <label className="block">
                    <span className={sheetLabelClass}>
                      Салон / студия <span className="text-[#F47C8C]">*</span>
                    </span>
                    <input
                      value={form.salonName}
                      onChange={(e) => {
                        patchForm({ salonName: e.target.value });
                        clearFieldError('salonName');
                      }}
                      className={sheetFieldClass}
                      placeholder="Nail Studio"
                    />
                    <FieldError message={showErr('salonName')} />
                  </label>
                ) : null}

                <label className="block">
                  <span className={sheetLabelClass}>
                    Улица и дом <span className="text-[#F47C8C]">*</span>
                  </span>
                  <input
                    value={streetDisplayLine(form)}
                    onChange={(e) => onStreetLineChange(e.target.value)}
                    className={sheetFieldClass}
                    placeholder="улица Рафиева, 45"
                  />
                  <FieldError message={showErr('street')} />
                  {publicPreview.trim() ? (
                    <p className="mt-1.5 text-[12px] text-[#9CA3AF]">
                      В каталоге: <span className="text-[#374151]">{publicPreview}</span>
                    </p>
                  ) : null}
                </label>
              </div>
            </Block>

            <Block title="Карта" inset={false}>
              {hasMap && mapWidgetSrc ? (
                <div className="space-y-3">
                  <div className={`${cabinetInsetShell} overflow-hidden`}>
                    <iframe
                      title="Карта"
                      src={mapWidgetSrc}
                      className="block h-[200px] w-full border-0 sm:h-[220px]"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  {mapActions}
                  <FieldError message={showErr('coords')} />
                </div>
              ) : (
                <AppointmentsEmptyState
                  picture="searchEmpty"
                  title="Метка не выбрана"
                  text="Укажите адрес и поставьте точку на карте"
                  hint="Клиент увидит примерное место после сохранения"
                  action={mapActions}
                />
              )}
            </Block>

            <Block title="После записи">
              {isHome ? (
                <div className="mb-3 grid grid-cols-2 gap-1.5 rounded-[10px] bg-[#F5F5F5] p-1.5">
                  <button
                    type="button"
                    onClick={() => patchForm({ showExactAddressAfterBooking: false })}
                    className={sheetSegmentClass(!form.showExactAddressAfterBooking)}
                  >
                    Сразу
                  </button>
                  <button
                    type="button"
                    onClick={() => patchForm({ showExactAddressAfterBooking: true })}
                    className={sheetSegmentClass(form.showExactAddressAfterBooking)}
                  >
                    После записи
                  </button>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ['entrance', 'Подъезд', '2', isHome],
                    ['floor', 'Этаж', '3', isHome],
                    ['room', isHome ? 'Квартира' : 'Кабинет', '42', isHome],
                    ['intercom', 'Домофон', '342', isHome],
                  ] as const
                ).map(([key, label, placeholder, required]) => (
                  <label key={key} className="block">
                    <span className={sheetLabelClass}>
                      {label}
                      {required ? <span className="text-[#F47C8C]"> *</span> : null}
                    </span>
                    <input
                      value={form[key]}
                      onChange={(e) => {
                        const raw = e.target.value;
                        patchForm({
                          [key]:
                            key === 'room' && isHome
                              ? sanitizeAtHomeRoomInput(raw)
                              : raw.slice(0, key === 'room' ? 80 : 120),
                        });
                        clearFieldError(key);
                      }}
                      className={sheetFieldClass}
                      placeholder={placeholder}
                    />
                    <FieldError message={showErr(key)} />
                  </label>
                ))}
              </div>

              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className={sheetLabelClass}>Как пройти</span>
                  <textarea
                    value={form.directions}
                    onChange={(e) => {
                      patchForm({ directions: e.target.value });
                      clearFieldError('directions');
                    }}
                    rows={2}
                    className={`${sheetFieldClass} resize-none leading-relaxed`}
                    placeholder="5 подъезд, 3 этаж"
                  />
                  <FieldError message={showErr('directions')} />
                </label>
                <label className="block">
                  <span className={sheetLabelClass}>Комментарий</span>
                  <textarea
                    value={form.clientNote}
                    onChange={(e) => {
                      patchForm({ clientNote: e.target.value });
                      clearFieldError('clientNote');
                    }}
                    rows={2}
                    className={`${sheetFieldClass} resize-none leading-relaxed`}
                    placeholder="Необязательно"
                  />
                  <FieldError message={showErr('clientNote')} />
                </label>
              </div>
            </Block>

            <Block title="Для клиента" last>
              <ClientPreview location={previewLoc} routeUrl={routePreviewUrl} />
              {pendingChecklist.length > 0 ? (
                <ul className="mt-4 space-y-1.5 border-t border-[#EEEEEE] pt-4">
                  {pendingChecklist.map((item) => (
                    <li key={item.id} className="text-[13px] leading-snug text-[#6B7280]">
                      {item.hint ?? item.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 flex items-center gap-1.5 border-t border-[#EEEEEE] pt-4 text-[13px] font-semibold text-[#16A34A]">
                  <HiCheck className="h-4 w-4 shrink-0" aria-hidden />
                  Готово для клиентов
                </p>
              )}
            </Block>
          </>
        ) : null}
      </div>

      {dirty ? (
        <div
          className="fixed inset-x-0 bottom-0 z-50 border-t border-[#EAECEF] bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_16px_rgba(17,24,39,0.06)] backdrop-blur-sm max-lg:mb-[5.75rem]"
          role="region"
          aria-label="Несохранённые изменения"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] text-[#6B7280]">Есть изменения</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={saving}
                className="min-h-9 rounded-[10px] px-3 text-[13px] font-semibold text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-50"
              >
                Отменить
              </button>
              <button
                type="button"
                disabled={saving || form.visitType === 'client_visit'}
                onClick={() => void handleSave()}
                className={`min-h-9 ${settingsPinkBtn}`}
              >
                {saving ? '…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminToast toast={toast} onDismiss={clearToast} />
    </div>
  );
}

function ClientPreview({ location, routeUrl }: { location: MasterLocation; routeUrl: string }) {
  const publicLine = buildPublicPreviewLine(location);
  const afterRows = afterBookingPreviewRows(location);

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="divide-y divide-[#F0F0F0]">
        <div className="pb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">До записи</p>
          <p className="mt-2 text-[15px] font-semibold leading-snug text-[#111827]">
            {publicLine.trim() || 'Адрес не указан'}
          </p>
        </div>
        <div className="pt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">После записи</p>
          {afterRows.length ? (
            <ul className="mt-3 space-y-2.5">
              {afterRows.slice(0, 5).map((row) => (
                <li
                  key={`${row.label}-${row.value}`}
                  className={
                    row.label === 'Адрес'
                      ? 'text-[14px] font-semibold leading-snug text-[#111827]'
                      : 'flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4'
                  }
                >
                  {row.label !== 'Адрес' ? (
                    <>
                      <span className="text-[13px] font-medium text-[#9CA3AF]">{row.label}</span>
                      <span className="text-[14px] font-semibold leading-snug text-[#111827] sm:text-right">
                        {row.value}
                      </span>
                    </>
                  ) : (
                    row.value
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[14px] text-[#9CA3AF]">Заполните поля выше</p>
          )}
        </div>
      </div>
      <a
        href={routeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cabinetOutlineBtn}
      >
        Построить маршрут
      </a>
    </div>
  );
}
