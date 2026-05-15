import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import type {
  MasterCertificate,
  MasterDraft,
  MasterPortfolioItem,
  MasterSchedule,
} from '../../../features/profile/lib/demoMasterStorage';
import {
  buildWeeklyMasterSchedule,
  validateWeeklySchedule,
  WEEKDAY_LABELS_SHORT,
} from '../../../features/master/model/masterDraftStorage';
import { mergeScheduleTimeSelectOptions } from '../schedule/scheduleTimeSelectOptions';
import type { MasterVisitType } from '../../../features/profile/model/masterLocation';
import { masterVisitTypeLabel } from '../../../features/profile/model/masterLocation';
import { defaultMasterAvatarUrl } from '../../../features/master/model/masterDraftStorage';
import { BY } from 'country-flag-icons/react/1x1';
import {
  canAddContactChannel,
  contactRowsFromDraft,
  contactsToLegacyContactLine,
  validateContactValue,
  type ContactType,
  type MasterContactRow,
} from '../../../features/master-onboarding/model/masterContacts';
import {
  isOptionalBelarusPhoneValid,
  normalizeBelarusPhone,
  sanitizeBelarusPhoneInput,
} from '../../../features/master-onboarding/model/belarusPhone';
import { getMasterDisplayNameQualityError } from '../../../shared/lib/masterDisplayNamePolicy';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { fetchServiceCategories, type ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { MasterProfileContactsBlock } from '../../master-onboarding/MasterProfileContactsBlock';
import {
  OnboardingAddressMap,
  splitReferenceLabelToStreetBuilding,
  splitReferenceLabelToStreetBuildingLenient,
} from '../../master-onboarding/OnboardingAddressMap';

const FALLBACK_CATEGORIES = [
  'Маникюр',
  'Барберы',
  'Брови и ресницы',
  'Массаж',
  'Фитнес',
  'Тату',
] as const;

const VISIT_TYPES: MasterVisitType[] = ['studio', 'at_home'];

const PAYMENT_OPTIONS = ['Наличные', 'Карта', 'Перевод', 'Онлайн позже'] as const;

function fieldClass(): string {
  return 'mt-1.5 w-full rounded-[22px] bg-[#F1EFEF] px-4 py-3.5 text-[16px] text-neutral-900 outline-none ring-0 placeholder:text-neutral-400';
}

function newEntityId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type SheetSaveResult = void | Promise<void>;

const PORTFOLIO_TITLE_MAX = 300;
const PORTFOLIO_DESC_MAX = 5000;

function validatePortfolioFields(
  imageUrl: string,
  title: string,
  description: string,
  uploadingImage: boolean,
): Record<string, string> {
  const errs: Record<string, string> = {};
  const u = imageUrl.trim();

  if (uploadingImage) {
    errs.image = 'Дождитесь окончания загрузки фото';
  } else if (!u) {
    errs.image = 'Загрузите фото работы';
  } else if (u.startsWith('blob:')) {
    errs.image = 'Выберите фото снова или дождитесь загрузки';
  }

  const t = title.trim();
  if (t.length > PORTFOLIO_TITLE_MAX) errs.title = `Не больше ${PORTFOLIO_TITLE_MAX} символов`;
  if (t.length > 0 && t.length < 2) errs.title = 'От 2 символов или оставьте пустым';

  if (description.length > PORTFOLIO_DESC_MAX) errs.description = `Не больше ${PORTFOLIO_DESC_MAX} символов`;

  return errs;
}

function SheetFooter({
  onCancel,
  onSave,
  saveLabel = 'Сохранить',
  savingLabel = 'Сохранение…',
  saving = false,
}: {
  onCancel: () => void;
  onSave: () => SheetSaveResult;
  saveLabel?: string;
  savingLabel?: string;
  saving?: boolean;
}) {
  return (
    <div className="mt-8 flex gap-3 pb-1">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98] disabled:opacity-50"
      >
        Отмена
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          void Promise.resolve(onSave());
        }}
        className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? savingLabel : saveLabel}
      </button>
    </div>
  );
}

function hasAtLeastOneValidMessengerContact(rows: MasterContactRow[]): boolean {
  return rows.some((r) => r.value.trim() && validateContactValue(r.type, r.value) === null);
}

/** Основная информация + фото профиля (с API: файл после выбора уходит на сервер). */
export function SheetMainInfo({
  draft,
  onSave,
  onCancel,
  uploadHeroPhoto,
}: {
  draft: MasterDraft;
  onSave: (patch: Partial<MasterDraft>) => SheetSaveResult;
  onCancel: () => void;
  /** Если задано — после выбора файла изображение загружается на сервер, в профиль попадает https URL. */
  uploadHeroPhoto?: (imageDataUrl: string) => Promise<string>;
}) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(draft.photoUrl ?? '');
  const [name, setName] = useState(draft.name);
  const [catalogCategories, setCatalogCategories] = useState<ServiceCategoryDto[]>([]);
  const [categoryId, setCategoryId] = useState(() => draft.primaryCategoryId ?? '');
  const [phone, setPhone] = useState(draft.phone ?? '');
  const [clientContacts, setClientContacts] = useState<MasterContactRow[]>(() => contactRowsFromDraft(draft));
  const [description, setDescription] = useState(draft.description);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [photoUploadErr, setPhotoUploadErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchServiceCategories()
      .then((list) => {
        if (!cancelled) setCatalogCategories(list);
      })
      .catch(() => {
        if (!cancelled) setCatalogCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolveCategoryId = useCallback(
    (d: MasterDraft, list: ServiceCategoryDto[]) => {
      if (d.primaryCategoryId && list.some((c) => c.id === d.primaryCategoryId)) {
        return d.primaryCategoryId;
      }
      const byCode = d.primaryCategoryCode
        ? list.find((c) => c.code === d.primaryCategoryCode)?.id
        : undefined;
      if (byCode) return byCode;
      const byName = list.find((c) => c.name === d.category)?.id;
      if (byName) return byName;
      return list[0]?.id ?? '';
    },
    [],
  );

  useEffect(() => {
    setPhotoUrl(draft.photoUrl ?? '');
    setName(draft.name);
    setCategoryId(resolveCategoryId(draft, catalogCategories));
    setPhone(draft.phone ?? '');
    setClientContacts(contactRowsFromDraft(draft));
    setDescription(draft.description);
    setFieldErrors({});
    setSubmitAttempted(false);
    setPhotoUploadErr(null);
  }, [draft, catalogCategories, resolveCategoryId]);

  const categoryOptions = useMemo(() => {
    if (catalogCategories.length) {
      return catalogCategories.map((c) => ({ value: c.id, label: c.name }));
    }
    const legacy = draft.category === 'Другое' ? FALLBACK_CATEGORIES[0] : draft.category;
    return Array.from(new Set([legacy, ...FALLBACK_CATEGORIES])).map((c) => ({
      value: c,
      label: c,
    }));
  }, [catalogCategories, draft.category]);

  const onPhotoChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !file.type.startsWith('image/')) return;
      setPhotoUploadErr(null);
      const reader = new FileReader();
      reader.onload = () => {
        void (async () => {
          const r = reader.result;
          if (typeof r !== 'string') return;
          try {
            if (uploadHeroPhoto) {
              const url = await uploadHeroPhoto(r);
              setPhotoUrl(url);
            } else {
              setPhotoUrl(r);
            }
          } catch (err) {
            setPhotoUploadErr(err instanceof Error ? err.message : 'Не удалось загрузить фото');
          }
        })();
      };
      reader.readAsDataURL(file);
    },
    [uploadHeroPhoto],
  );

  const preview = photoUrl.trim() || defaultMasterAvatarUrl(name || draft.name);

  const save = async () => {
    setSubmitAttempted(true);
    const errs: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName) errs.name = 'Укажите имя';
    else {
      const nameQuality = getMasterDisplayNameQualityError(trimmedName);
      if (nameQuality) errs.name = nameQuality;
    }
    if (phone.trim() && !isOptionalBelarusPhoneValid(phone)) {
      errs.phone = 'Укажите мобильный номер РБ (+375 …)';
    }
    const hasPhone = Boolean(normalizeBelarusPhone(phone));
    const hasMessenger = hasAtLeastOneValidMessengerContact(clientContacts);
    if (!hasPhone && !hasMessenger) {
      errs.contactReachability = 'Укажите телефон или хотя бы один мессенджер';
    } else if (!hasMessenger) {
      errs.contactReachability = 'Добавьте хотя бы один контакт (Telegram, Instagram и т.д.)';
    }
    for (const row of clientContacts) {
      if (!row.value.trim()) continue;
      const fmt = validateContactValue(row.type, row.value);
      if (fmt) errs[row.id] = fmt;
    }
    const picked =
      catalogCategories.find((c) => c.id === categoryId) ??
      catalogCategories.find((c) => c.name === categoryId);
    if (catalogCategories.length && !picked) {
      errs.category = 'Выберите категорию';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    const contacts = clientContacts
      .filter((r) => r.value.trim())
      .map((r) => ({ type: r.type, value: r.value.trim() }));
    const contactLine = contactsToLegacyContactLine(contacts) ?? '';

    setSaving(true);
    setFieldErrors({});
    try {
      await onSave({
        name: trimmedName,
        category: picked?.name ?? (typeof categoryId === 'string' ? categoryId : draft.category),
        primaryCategoryId: picked?.id,
        primaryCategoryCode: picked?.code,
        phone: normalizeBelarusPhone(phone) ?? undefined,
        contact: contactLine,
        contacts,
        description: description.trim(),
        photoUrl: photoUrl.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[26px] bg-[#F1EFEF] p-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Фото в профиле</p>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onPhotoChange}
        />
        <div className="relative mx-auto mt-3 w-full max-w-[320px]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
            <img
              src={preview}
              alt=""
              className="h-full w-full object-cover"
              decoding="async"
              onError={(ev) => {
                (ev.target as HTMLImageElement).src = defaultMasterAvatarUrl(name || 'Мастер');
              }}
            />
          </div>
          <div className="absolute bottom-2 right-2 flex flex-wrap justify-end gap-1.5">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="rounded-full bg-[#E29595] px-3 py-2 text-[12px] font-semibold text-white shadow-md ring-2 ring-white transition active:scale-[0.97]"
            >
              Сменить
            </button>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          {photoUploadErr ? <p className="text-center text-[12px] font-medium text-red-600">{photoUploadErr}</p> : null}
          <p className="text-center text-[12px] leading-snug text-neutral-500">
            JPG или PNG. Так фото будет выглядеть на карточке в каталоге.
          </p>
        </div>
      </div>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Имя / название мастера *</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.name;
              return next;
            });
          }}
          className={fieldClass()}
        />
        {submitAttempted && fieldErrors.name ? (
          <p className="mt-1.5 text-[12px] font-medium text-red-600">{fieldErrors.name}</p>
        ) : null}
      </label>

      <label className="block">
        <span id="sheet-main-cat" className="text-[13px] font-semibold text-neutral-500">
          Категория
        </span>
        <SlottySelect
          className="mt-1.5 w-full"
          value={categoryId || categoryOptions[0]?.value || ''}
          onChange={setCategoryId}
          options={categoryOptions}
          aria-labelledby="sheet-main-cat"
        />
      </label>

      <label className="block">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-neutral-500">
          Телефон
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white"
            aria-hidden
          >
            <BY title="Беларусь" className="h-full w-full object-cover" />
          </span>
        </span>
        <input
          value={phone}
          onChange={(e) => {
            setPhone(sanitizeBelarusPhoneInput(e.target.value));
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.phone;
              delete next.contactReachability;
              return next;
            });
          }}
          className={fieldClass()}
          placeholder="+375 29 000-00-00"
          inputMode="tel"
          autoComplete="tel"
          maxLength={19}
        />
        {submitAttempted && fieldErrors.phone ? (
          <p className="mt-1.5 text-[12px] font-medium text-red-600">{fieldErrors.phone}</p>
        ) : null}
      </label>

      <MasterProfileContactsBlock
        rows={clientContacts}
        onAdd={(type: ContactType) => {
          if (!canAddContactChannel(clientContacts, type)) return;
          setClientContacts((prev) => [
            ...prev,
            { id: newEntityId(), type, value: '' },
          ]);
        }}
        onChange={(id, value) => {
          setClientContacts((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)));
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[id];
            delete next.contactReachability;
            return next;
          });
        }}
        onRemove={(id) => {
          setClientContacts((prev) => prev.filter((r) => r.id !== id));
        }}
        onBlurRow={() => {}}
        rowErrors={fieldErrors}
        showRowError={(id) => submitAttempted && Boolean(fieldErrors[id])}
      />
      {submitAttempted && fieldErrors.contactReachability ? (
        <p className="rounded-[18px] bg-[#FFF4E8] px-3 py-2 text-[12px] font-semibold leading-snug text-[#B66A24]">
          {fieldErrors.contactReachability}
        </p>
      ) : null}

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">О себе</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={fieldClass()} />
      </label>

      <SheetFooter onCancel={onCancel} onSave={save} saving={saving} />
    </div>
  );
}

export function SheetExperience({
  draft,
  onSave,
  onCancel,
}: {
  draft: MasterDraft;
  onSave: (experience: string) => SheetSaveResult;
  onCancel: () => void;
}) {
  const [experience, setExperience] = useState(draft.experience ?? '');
  useEffect(() => {
    setExperience(draft.experience ?? '');
  }, [draft]);

  const save = () => {
    onSave(experience.trim());
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Опыт работы</span>
        <textarea
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          rows={6}
          placeholder="Например: Работаю мастером с 2021 года, специализируюсь на аппаратном маникюре."
          className={fieldClass()}
        />
      </label>
      <SheetFooter onCancel={onCancel} onSave={save} />
    </div>
  );
}

/** В кабинете город зафиксирован (MVP по Беларуси). */
const MASTER_CABINET_CITY = 'Минск';

export function SheetAddress({
  draft,
  onSave,
  onCancel,
}: {
  draft: MasterDraft;
  onSave: (location: MasterDraft['location']) => SheetSaveResult;
  onCancel: () => void;
}) {
  const loc = draft.location;

  /** Не синхронизировать форму при каждом новом объекте draft — иначе сбрасывается смена «На дому» ↔ «Салон». */
  const locationSyncFingerprint = useMemo(() => {
    const l = draft.location;
    return [
      l.visitType,
      l.street,
      l.building,
      l.buildingDetail ?? '',
      l.salonName ?? '',
      l.entrance ?? '',
      l.floor ?? '',
      l.room ?? '',
      l.intercom ?? '',
      l.landmark ?? '',
      l.directions ?? '',
      l.clientNote ?? '',
      l.lat ?? '',
      l.lng ?? '',
      l.showExactAddressAfterBooking === true ? '1' : '0',
    ].join('\x1e');
  }, [draft.location]);

  const [visitType, setVisitType] = useState<MasterVisitType>(loc.visitType);
  const [street, setStreet] = useState(loc.street);
  const [building, setBuilding] = useState(loc.building);
  const [salonName, setSalonName] = useState(loc.salonName?.trim() ?? '');
  const [buildingDetail, setBuildingDetail] = useState(loc.buildingDetail?.trim() ?? '');
  const [showExactAddressAfterBooking, setShowExactAddressAfterBooking] = useState(
    loc.showExactAddressAfterBooking === true,
  );
  const [entrance, setEntrance] = useState(loc.entrance ?? '');
  const [floor, setFloor] = useState(loc.floor ?? '');
  const [room, setRoom] = useState(loc.room ?? '');
  const [intercom, setIntercom] = useState(loc.intercom ?? '');
  const [landmark, setLandmark] = useState(loc.landmark ?? '');
  const [directions, setDirections] = useState(loc.directions ?? '');
  const [clientNote, setClientNote] = useState(loc.clientNote ?? '');
  const [lat, setLat] = useState<number | undefined>(loc.lat);
  const [lng, setLng] = useState<number | undefined>(loc.lng);

  useEffect(() => {
    const l = draft.location;
    setVisitType(l.visitType);
    setStreet(l.street);
    setBuilding(l.building);
    setSalonName(l.salonName?.trim() ?? '');
    setBuildingDetail(l.buildingDetail?.trim() ?? '');
    setShowExactAddressAfterBooking(l.showExactAddressAfterBooking === true);
    setEntrance(l.entrance ?? '');
    setFloor(l.floor ?? '');
    setRoom(l.room ?? '');
    setIntercom(l.intercom ?? '');
    setLandmark(l.landmark ?? '');
    setDirections(l.directions ?? '');
    setClientNote(l.clientNote ?? '');
    setLat(l.lat);
    setLng(l.lng);
  }, [locationSyncFingerprint]);

  const onStreetLineChange = useCallback((value: string) => {
    if (value === '') {
      setStreet('');
      setBuilding('б/н');
      return;
    }
    const { street: s, building: b } = splitReferenceLabelToStreetBuildingLenient(value);
    setStreet(s);
    setBuilding(b);
  }, []);

  const save = () => {
    const isHome = visitType === 'at_home';
    onSave({
      ...draft.location,
      visitType,
      city: MASTER_CABINET_CITY,
      street: street.trim(),
      building: building.trim() || 'б/н',
      salonName: !isHome ? salonName.trim() || undefined : undefined,
      buildingDetail: isHome ? buildingDetail.trim() || undefined : undefined,
      district: undefined,
      showExactAddressAfterBooking: isHome ? showExactAddressAfterBooking : undefined,
      entrance: entrance.trim() || undefined,
      floor: floor.trim() || undefined,
      room: room.trim() || undefined,
      intercom: intercom.trim() || undefined,
      landmark: landmark.trim() || undefined,
      directions: directions.trim() || undefined,
      clientNote: clientNote.trim() || undefined,
      ...(typeof lat === 'number' &&
      Number.isFinite(lat) &&
      typeof lng === 'number' &&
      Number.isFinite(lng)
        ? { lat, lng }
        : { lat: undefined, lng: undefined }),
    });
  };

  const roomLabel = visitType === 'at_home' ? 'Квартира / офис' : 'Кабинет';

  return (
    <div className="space-y-4">
      <p className="text-[13px] font-semibold text-neutral-500">Тип приёма</p>
      <div className="flex flex-col gap-2">
        {VISIT_TYPES.map((vt) => (
          <button
            key={vt}
            type="button"
            onClick={() => setVisitType(vt)}
            className={`min-h-11 rounded-full px-3 text-[14px] font-semibold transition active:scale-[0.98] ${
              visitType === vt ? 'bg-[#E29595] text-white shadow-[0_8px_22px_rgba(226,149,149,0.25)]' : 'bg-[#F1EFEF] text-neutral-900'
            }`}
          >
            {masterVisitTypeLabel(vt)}
          </button>
        ))}
      </div>

      {visitType === 'studio' ? (
        <p className="text-[12px] leading-snug text-neutral-500">
          Приём в салоне или студии: укажите название точки и адрес для клиентов.
        </p>
      ) : null}

      <div className="rounded-[22px] bg-[#F1EFEF] px-4 py-3 ring-1 ring-black/[0.04]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Город</p>
        <p className="mt-1 text-[15px] font-semibold text-neutral-900">{MASTER_CABINET_CITY}</p>
      </div>

      {visitType === 'studio' ? (
        <label className="block">
          <span className="text-[13px] font-semibold text-neutral-500">Название салона или студии</span>
          <input
            value={salonName}
            onChange={(e) => setSalonName(e.target.value)}
            className={fieldClass()}
            placeholder="Например, Nail Studio"
          />
        </label>
      ) : null}

      <div className="space-y-2 overflow-visible">
        <p className="text-[13px] font-semibold text-neutral-500">Карта</p>
        {visitType === 'studio' ? (
          <p className="text-[12px] leading-snug text-neutral-500">
            Поставьте метку у входа в салон — так проще найти вас на месте.
          </p>
        ) : null}
        <OnboardingAddressMap
          key={`${visitType}-${draft.masterId ?? 'local'}-${locationSyncFingerprint}`}
          city={MASTER_CABINET_CITY}
          visitType={visitType}
          street={street}
          onStreetChange={onStreetLineChange}
          inputLabel="Адрес"
          inputPlaceholder="Начните вводить — подсказки под полем. Точку можно уточнить на карте."
          suppressSuggestUntilFocus
          initialLat={lat ?? null}
          initialLng={lng ?? null}
          onPick={(res) => {
            const { street: s, building: b } = splitReferenceLabelToStreetBuilding(res.addressLine);
            setStreet(s);
            setBuilding(b);
            setLat(res.lat);
            setLng(res.lng);
          }}
        />
      </div>

      {visitType === 'at_home' ? (
        <div className="rounded-[26px] bg-[#F1EFEF] p-4">
            <p className="text-[13px] font-semibold text-neutral-500">Адрес в каталоге до записи</p>
            <p className="mt-1 text-[12px] leading-snug text-neutral-500">
              Улица из поля выше видна всем. Корпус, подъезд, этаж и квартира — только в деталях ниже.
            </p>
            <div
              className="mt-3 grid grid-cols-1 gap-2 rounded-[22px] bg-white/80 p-1.5 sm:grid-cols-2"
              role="radiogroup"
              aria-label="Когда показывать полный адрес"
            >
              <button
                type="button"
                role="radio"
                aria-checked={!showExactAddressAfterBooking}
                onClick={() => setShowExactAddressAfterBooking(false)}
                className={`min-h-11 rounded-full px-3 text-[14px] font-semibold leading-snug transition active:scale-[0.98] ${
                  !showExactAddressAfterBooking
                    ? 'bg-[#E29595] text-white shadow-[0_8px_20px_rgba(226,149,149,0.22)]'
                    : 'text-neutral-600'
                }`}
              >
                Видно сразу
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={showExactAddressAfterBooking}
                onClick={() => setShowExactAddressAfterBooking(true)}
                className={`min-h-11 rounded-full px-3 text-[14px] font-semibold leading-snug transition active:scale-[0.98] ${
                  showExactAddressAfterBooking
                    ? 'bg-[#E29595] text-white shadow-[0_8px_20px_rgba(226,149,149,0.22)]'
                    : 'text-neutral-600'
                }`}
              >
                Только после записи
              </button>
            </div>
          </div>
      ) : null}

      {visitType === 'at_home' ? (
        <label className="block">
          <span className="text-[13px] font-semibold text-neutral-500">Корпус / строение</span>
          <input
            value={buildingDetail}
            onChange={(e) => setBuildingDetail(e.target.value)}
            className={fieldClass()}
            placeholder="При необходимости"
          />
        </label>
      ) : null}

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Вход / подъезд</span>
        <input value={entrance} onChange={(e) => setEntrance(e.target.value)} className={fieldClass()} />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Этаж</span>
        <input value={floor} onChange={(e) => setFloor(e.target.value)} className={fieldClass()} />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">{roomLabel}</span>
        <input value={room} onChange={(e) => setRoom(e.target.value)} className={fieldClass()} />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Домофон / ресепшен</span>
        <input value={intercom} onChange={(e) => setIntercom(e.target.value)} className={fieldClass()} />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Ориентир</span>
        <input value={landmark} onChange={(e) => setLandmark(e.target.value)} className={fieldClass()} />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Как пройти</span>
        <textarea value={directions} onChange={(e) => setDirections(e.target.value)} rows={3} className={fieldClass()} />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Комментарий для клиента</span>
        <textarea value={clientNote} onChange={(e) => setClientNote(e.target.value)} rows={2} className={fieldClass()} />
      </label>

      <SheetFooter onCancel={onCancel} onSave={save} />
    </div>
  );
}

export function SheetRules({
  draft,
  onSave,
  onCancel,
}: {
  draft: MasterDraft;
  onSave: (patch: Pick<MasterDraft, 'bookingRules' | 'cancellationPolicy' | 'paymentMethods' | 'paymentNote'>) => SheetSaveResult;
  onCancel: () => void;
}) {
  const [bookingRules, setBookingRules] = useState(draft.bookingRules ?? '');
  const [cancellationPolicy, setCancellationPolicy] = useState(draft.cancellationPolicy ?? '');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(draft.paymentMethods ?? []);
  const [paymentNote, setPaymentNote] = useState(draft.paymentNote ?? '');

  useEffect(() => {
    setBookingRules(draft.bookingRules ?? '');
    setCancellationPolicy(draft.cancellationPolicy ?? '');
    setPaymentMethods(draft.paymentMethods ?? []);
    setPaymentNote(draft.paymentNote ?? '');
  }, [draft]);

  const togglePayment = (label: string) => {
    setPaymentMethods((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  };

  const save = () => {
    onSave({
      bookingRules: bookingRules.trim() || undefined,
      cancellationPolicy: cancellationPolicy.trim() || undefined,
      paymentMethods,
      paymentNote: paymentNote.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Правила записи</span>
        <textarea value={bookingRules} onChange={(e) => setBookingRules(e.target.value)} rows={4} className={fieldClass()} />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Правила отмены</span>
        <textarea value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} rows={4} className={fieldClass()} />
      </label>

      <div>
        <p className="text-[13px] font-semibold text-neutral-500">Способы оплаты</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PAYMENT_OPTIONS.map((opt) => {
            const on = paymentMethods.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => togglePayment(opt)}
                className={`rounded-full px-4 py-2.5 text-[14px] font-semibold transition active:scale-[0.98] ${
                  on ? 'bg-[#E29595] text-white shadow-[0_8px_22px_rgba(226,149,149,0.22)]' : 'bg-[#F1EFEF] text-neutral-800'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Комментарий по оплате</span>
        <textarea value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} rows={2} className={fieldClass()} />
      </label>

      <SheetFooter onCancel={onCancel} onSave={save} />
    </div>
  );
}

export function SheetSchedule({
  draft,
  onSave,
  onCancel,
}: {
  draft: MasterDraft;
  onSave: (schedule: MasterSchedule) => SheetSaveResult;
  onCancel: () => void;
}) {
  const [workDays, setWorkDays] = useState<number[]>(() => [...draft.schedule.workDays]);
  const [startTime, setStartTime] = useState(draft.schedule.startTime);
  const [endTime, setEndTime] = useState(draft.schedule.endTime);
  const [error, setError] = useState<string | null>(null);

  const timeSelectOptions = useMemo(
    () => mergeScheduleTimeSelectOptions(startTime, endTime),
    [startTime, endTime],
  );

  useEffect(() => {
    setWorkDays([...draft.schedule.workDays]);
    setStartTime(draft.schedule.startTime);
    setEndTime(draft.schedule.endTime);
    setError(null);
  }, [draft.schedule]);

  const toggleDay = (day: number) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
    setError(null);
  };

  const save = () => {
    const validation = validateWeeklySchedule(workDays, startTime, endTime);
    if (validation) {
      setError(validation);
      return;
    }
    onSave(buildWeeklyMasterSchedule(workDays, startTime, endTime));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[13px] font-semibold text-neutral-500">Рабочие дни</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAY_LABELS_SHORT.map((label, day) => {
            const on = workDays.includes(day);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(day)}
                className={`min-h-11 min-w-[3rem] rounded-full px-4 text-[14px] font-semibold transition active:scale-[0.98] ${
                  on
                    ? 'bg-[#E29595] text-white shadow-[0_8px_22px_rgba(226,149,149,0.22)]'
                    : 'bg-[#F1EFEF] text-neutral-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[13px] font-semibold text-neutral-500">С</span>
          <SlottySelect
            className="mt-1.5 w-full"
            value={startTime}
            onChange={(value) => {
              setStartTime(value);
              setError(null);
            }}
            options={timeSelectOptions}
            aria-label="Время начала"
          />
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold text-neutral-500">До</span>
          <SlottySelect
            className="mt-1.5 w-full"
            value={endTime}
            onChange={(value) => {
              setEndTime(value);
              setError(null);
            }}
            options={timeSelectOptions}
            aria-label="Время окончания"
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-[14px] font-medium text-red-700">{error}</p>
      ) : null}

      <SheetFooter onCancel={onCancel} onSave={save} />
    </div>
  );
}

export function SheetCertificate({
  draft,
  certificateId,
  onSave,
  onCancel,
  uploadImage,
}: {
  draft: MasterDraft;
  certificateId: string | null;
  onSave: (list: MasterCertificate[]) => SheetSaveResult;
  onCancel: () => void;
  uploadImage?: (file: File) => Promise<string>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const list = draft.certificates ?? [];
  const existing = certificateId ? list.find((c) => c.id === certificateId) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [issuer, setIssuer] = useState(existing?.issuer ?? '');
  const [year, setYear] = useState(existing?.year ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  useEffect(() => {
    const ex = certificateId ? (draft.certificates ?? []).find((c) => c.id === certificateId) : undefined;
    setTitle(ex?.title ?? '');
    setIssuer(ex?.issuer ?? '');
    setYear(ex?.year ?? '');
    setDescription(ex?.description ?? '');
    setImageUrl(ex?.imageUrl ?? '');
    setUploadErr(null);
  }, [certificateId, draft]);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setUploadErr(null);

    if (uploadImage) {
      const preview = URL.createObjectURL(file);
      const rollbackUrl =
        (certificateId ? (draft.certificates ?? []).find((c) => c.id === certificateId) : undefined)?.imageUrl ?? '';
      setImageUrl(preview);
      setUploadingImage(true);
      void uploadImage(file)
        .then((url) => {
          URL.revokeObjectURL(preview);
          setImageUrl(url);
        })
        .catch((err: unknown) => {
          URL.revokeObjectURL(preview);
          setImageUrl(rollbackUrl);
          setUploadErr(err instanceof Error ? err.message : 'Не удалось загрузить фото');
        })
        .finally(() => setUploadingImage(false));
      return;
    }

    const preview = URL.createObjectURL(file);
    setImageUrl(preview);
    const reader = new FileReader();
    reader.onload = () => {
      URL.revokeObjectURL(preview);
      const r = reader.result;
      if (typeof r === 'string') setImageUrl(r);
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    const trimmedTitle = title.trim();
    const trimmedIssuer = issuer.trim();
    if (!trimmedTitle || !trimmedIssuer || uploadingImage) return;
    const id = certificateId ?? newEntityId();
    const nextItem: MasterCertificate = {
      id,
      title: trimmedTitle,
      issuer: trimmedIssuer,
      year: year.trim() || undefined,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    };
    const nextList = certificateId
      ? list.map((c) => (c.id === certificateId ? nextItem : c))
      : [...list, nextItem];
    onSave(nextList);
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Название сертификата *</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass()} />
      </label>
      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Школа / организация *</span>
        <input value={issuer} onChange={(e) => setIssuer(e.target.value)} className={fieldClass()} />
      </label>
      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Год</span>
        <input value={year} onChange={(e) => setYear(e.target.value)} className={fieldClass()} placeholder="2024" />
      </label>
      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Описание</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={fieldClass()} />
      </label>

      <div className="rounded-[26px] bg-[#F1EFEF] p-4">
        <p className="text-[13px] font-semibold text-neutral-500">Фото сертификата</p>
        <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={onFile} disabled={uploadingImage} />
        {imageUrl ? (
          <div className="mt-3 overflow-hidden rounded-[22px] bg-white">
            <img src={imageUrl} alt="" className="max-h-48 w-full object-contain" decoding="async" />
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="mt-3 w-full rounded-full bg-white py-3 text-[14px] font-semibold text-neutral-900 shadow-sm transition active:scale-[0.99] disabled:opacity-60"
        >
          {imageUrl ? 'Заменить фото' : 'Загрузить фото'}
        </button>
        {uploadErr ? <p className="mt-2 text-center text-[12px] font-medium text-red-600">{uploadErr}</p> : null}
      </div>

      <SheetFooter
        onCancel={onCancel}
        onSave={save}
        saving={uploadingImage}
        savingLabel="Загрузка фото…"
      />
    </div>
  );
}

export function SheetPortfolio({
  draft,
  itemId,
  onSave,
  onCancel,
  uploadImage,
}: {
  draft: MasterDraft;
  itemId: string | null;
  onSave: (list: MasterPortfolioItem[]) => SheetSaveResult;
  onCancel: () => void;
  uploadImage?: (file: File) => Promise<string>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const list = draft.portfolio ?? [];
  const existing = itemId ? list.find((p) => p.id === itemId) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const ex = itemId ? (draft.portfolio ?? []).find((p) => p.id === itemId) : undefined;
    setTitle(ex?.title ?? '');
    setDescription(ex?.description ?? '');
    setImageUrl(ex?.imageUrl ?? '');
    setUploadErr(null);
    setFieldErrors({});
  }, [draft, itemId]);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setUploadErr(null);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    if (uploadImage) {
      const preview = URL.createObjectURL(file);
      setImageUrl(preview);
      setUploadingImage(true);
      const prevHttps = (itemId ? (draft.portfolio ?? []).find((p) => p.id === itemId) : undefined)?.imageUrl ?? '';
      void uploadImage(file)
        .then((url) => {
          URL.revokeObjectURL(preview);
          setImageUrl(url);
        })
        .catch((err: unknown) => {
          URL.revokeObjectURL(preview);
          setImageUrl(prevHttps);
          setUploadErr(err instanceof Error ? err.message : 'Не удалось загрузить фото');
        })
        .finally(() => setUploadingImage(false));
      return;
    }

    const preview = URL.createObjectURL(file);
    setImageUrl(preview);
    const reader = new FileReader();
    reader.onload = () => {
      URL.revokeObjectURL(preview);
      const r = reader.result;
      if (typeof r === 'string') setImageUrl(r);
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    const errs = validatePortfolioFields(imageUrl, title, description, uploadingImage);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    const id = itemId ?? newEntityId();
    const nextItem: MasterPortfolioItem = {
      id,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim(),
    };
    const nextList = itemId ? list.map((p) => (p.id === itemId ? nextItem : p)) : [...list, nextItem];
    onSave(nextList);
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-[26px] bg-[#F1EFEF] p-4 ${fieldErrors.image ? 'ring-2 ring-red-300/80' : ''}`}>
        <p className="text-[13px] font-semibold text-neutral-500">Фото работы *</p>
        <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={onFile} disabled={uploadingImage} />
        {imageUrl ? (
          <div className="mt-3 overflow-hidden rounded-[22px] bg-white">
            <img src={imageUrl} alt="" className="aspect-square w-full object-cover" decoding="async" />
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="mt-3 w-full rounded-full bg-white py-3 text-[14px] font-semibold text-neutral-900 shadow-sm transition active:scale-[0.99] disabled:opacity-60"
        >
          {imageUrl ? 'Заменить фото' : 'Загрузить фото'}
        </button>
        {uploadErr ? <p className="mt-2 text-center text-[12px] font-medium text-red-600">{uploadErr}</p> : null}
        {fieldErrors.image ? <p className="mt-2 text-center text-[12px] font-medium text-red-600">{fieldErrors.image}</p> : null}
      </div>

      <label className="block">
        <span className="flex items-baseline justify-between gap-2 text-[13px] font-semibold text-neutral-500">
          <span>Название</span>
          <span className="text-[11px] font-medium tabular-nums text-neutral-400">
            {title.length}/{PORTFOLIO_TITLE_MAX}
          </span>
        </span>
        <input
          value={title}
          maxLength={PORTFOLIO_TITLE_MAX}
          onChange={(e) => {
            setTitle(e.target.value);
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.title;
              return next;
            });
          }}
          className={fieldErrors.title ? `${fieldClass()} ring-2 ring-red-300/80` : fieldClass()}
        />
        {fieldErrors.title ? <p className="mt-1.5 text-[12px] font-medium text-red-600">{fieldErrors.title}</p> : null}
      </label>

      <label className="block">
        <span className="flex items-baseline justify-between gap-2 text-[13px] font-semibold text-neutral-500">
          <span>Описание</span>
          <span className="text-[11px] font-medium tabular-nums text-neutral-400">
            {description.length}/{PORTFOLIO_DESC_MAX}
          </span>
        </span>
        <textarea
          value={description}
          maxLength={PORTFOLIO_DESC_MAX}
          onChange={(e) => {
            setDescription(e.target.value);
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.description;
              return next;
            });
          }}
          rows={3}
          className={fieldErrors.description ? `${fieldClass()} ring-2 ring-red-300/80` : fieldClass()}
        />
        {fieldErrors.description ? (
          <p className="mt-1.5 text-[12px] font-medium text-red-600">{fieldErrors.description}</p>
        ) : null}
      </label>

      <SheetFooter
        onCancel={onCancel}
        onSave={save}
        saving={uploadingImage}
        savingLabel="Загрузка фото…"
      />
    </div>
  );
}

export function SheetDeleteConfirm({
  text,
  onBack,
  onDelete,
  deleteLabel = 'Удалить',
}: {
  text: string;
  onBack: () => void;
  onDelete: () => SheetSaveResult;
  deleteLabel?: string;
}) {
  return (
    <div className="space-y-4 pb-1">
      <p className="text-[15px] leading-relaxed text-neutral-600">{text}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
        >
          Назад
        </button>
        <button
          type="button"
          onClick={() => {
            void Promise.resolve(onDelete());
          }}
          className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
        >
          {deleteLabel}
        </button>
      </div>
    </div>
  );
}
