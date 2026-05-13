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
} from '../../../features/profile/lib/demoMasterStorage';
import type { MasterVisitType } from '../../../features/profile/model/masterLocation';
import { masterVisitTypeLabel } from '../../../features/profile/model/masterLocation';
import { defaultMasterAvatarUrl } from '../../../features/master/model/masterDraftStorage';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { OnboardingAddressMap } from '../../master-onboarding/OnboardingAddressMap';

const CATEGORIES = [
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

function SheetFooter({
  onCancel,
  onSave,
  saveLabel = 'Сохранить',
}: {
  onCancel: () => void;
  onSave: () => SheetSaveResult;
  saveLabel?: string;
}) {
  return (
    <div className="mt-8 flex gap-3 pb-1">
      <button
        type="button"
        onClick={onCancel}
        className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
      >
        Отмена
      </button>
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(onSave());
        }}
        className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
      >
        {saveLabel}
      </button>
    </div>
  );
}

/** Основная информация + фото профиля (демо: data URL; TODO: Supabase Storage). */
export function SheetMainInfo({
  draft,
  onSave,
  onCancel,
}: {
  draft: MasterDraft;
  onSave: (patch: Partial<MasterDraft>) => SheetSaveResult;
  onCancel: () => void;
}) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(draft.photoUrl ?? '');
  const [name, setName] = useState(draft.name);
  const [category, setCategory] = useState(
    () => (draft.category === 'Другое' ? CATEGORIES[0] : draft.category),
  );
  const [phone, setPhone] = useState(draft.phone ?? '');
  const [contact, setContact] = useState(draft.contact);
  const [description, setDescription] = useState(draft.description);

  useEffect(() => {
    setPhotoUrl(draft.photoUrl ?? '');
    setName(draft.name);
    setCategory(draft.category === 'Другое' ? CATEGORIES[0] : draft.category);
    setPhone(draft.phone ?? '');
    setContact(draft.contact);
    setDescription(draft.description);
  }, [draft]);

  const categoryOptions = useMemo(
    () =>
      Array.from(new Set([category, ...CATEGORIES])).map((c) => ({
        value: c,
        label: c,
      })),
    [category],
  );

  const onPhotoChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === 'string') setPhotoUrl(r);
    };
    reader.readAsDataURL(file);
  }, []);

  const preview = photoUrl.trim() || defaultMasterAvatarUrl(name || draft.name);

  const save = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave({
      name: trimmedName,
      category: category.trim() || draft.category,
      phone: phone.trim() || undefined,
      contact: contact.trim(),
      description: description.trim(),
      photoUrl: photoUrl.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[26px] bg-[#F1EFEF] p-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Фото в профиле</p>
        <div className="relative mt-3 flex justify-center">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onPhotoChange}
          />
          <div className="relative w-[min(200px,55vw)] max-w-[200px]">
            <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
              <img
                src={preview}
                alt=""
                width={200}
                height={200}
                className="aspect-square w-full object-cover"
                decoding="async"
                onError={(ev) => {
                  (ev.target as HTMLImageElement).src = defaultMasterAvatarUrl(name || 'Мастер');
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="absolute bottom-2 right-2 rounded-full bg-white px-3 py-2 text-[12px] font-semibold text-neutral-800 shadow-md ring-2 ring-white transition active:scale-[0.97]"
            >
              Сменить
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-[12px] text-neutral-500">
          {/* TODO: загрузка в Supabase Storage вместо data URL */}
          Демо: фото хранится локально в черновике.
        </p>
      </div>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Имя / название мастера *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass()} />
      </label>

      <label className="block">
        <span id="sheet-main-cat" className="text-[13px] font-semibold text-neutral-500">
          Категория
        </span>
        <SlottySelect
          className="mt-1.5 w-full"
          value={category}
          onChange={setCategory}
          options={categoryOptions}
          aria-labelledby="sheet-main-cat"
        />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Телефон</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={fieldClass()}
          placeholder="+375 …"
          inputMode="tel"
          autoComplete="tel"
        />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Telegram / контакт</span>
        <input value={contact} onChange={(e) => setContact(e.target.value)} className={fieldClass()} placeholder="@username" />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">О себе</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={fieldClass()} />
      </label>

      <SheetFooter onCancel={onCancel} onSave={save} />
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
  const [visitType, setVisitType] = useState<MasterVisitType>(loc.visitType);
  const [city, setCity] = useState(loc.city?.trim() ?? '');
  const [street, setStreet] = useState(loc.street);
  const [building, setBuilding] = useState(loc.building);
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
    setCity(l.city?.trim() ?? '');
    setStreet(l.street);
    setBuilding(l.building);
    setEntrance(l.entrance ?? '');
    setFloor(l.floor ?? '');
    setRoom(l.room ?? '');
    setIntercom(l.intercom ?? '');
    setLandmark(l.landmark ?? '');
    setDirections(l.directions ?? '');
    setClientNote(l.clientNote ?? '');
    setLat(l.lat);
    setLng(l.lng);
  }, [draft]);

  const save = () => {
    onSave({
      ...draft.location,
      visitType,
      city: city.trim() || undefined,
      street: street.trim(),
      building: building.trim(),
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

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Город</span>
        <input value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass()} placeholder="Минск" />
      </label>

      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-neutral-500">Карта</p>
        <OnboardingAddressMap
          key={`${visitType}-${city}`}
          addressLine={street.trim()}
          onPick={(res) => {
            setStreet(res.addressLine);
            setLat(res.lat);
            setLng(res.lng);
          }}
        />
      </div>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Адрес (улица / место)</span>
        <input value={street} onChange={(e) => setStreet(e.target.value)} className={fieldClass()} />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Уточнение (дом, корпус)</span>
        <input value={building} onChange={(e) => setBuilding(e.target.value)} className={fieldClass()} />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Вход / подъезд</span>
        <input value={entrance} onChange={(e) => setEntrance(e.target.value)} className={fieldClass()} />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Этаж</span>
        <input value={floor} onChange={(e) => setFloor(e.target.value)} className={fieldClass()} />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Кабинет</span>
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

export function SheetCertificate({
  draft,
  certificateId,
  onSave,
  onCancel,
}: {
  draft: MasterDraft;
  certificateId: string | null;
  onSave: (list: MasterCertificate[]) => SheetSaveResult;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const list = draft.certificates ?? [];
  const existing = certificateId ? list.find((c) => c.id === certificateId) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [issuer, setIssuer] = useState(existing?.issuer ?? '');
  const [year, setYear] = useState(existing?.year ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? '');

  useEffect(() => {
    const ex = certificateId ? (draft.certificates ?? []).find((c) => c.id === certificateId) : undefined;
    setTitle(ex?.title ?? '');
    setIssuer(ex?.issuer ?? '');
    setYear(ex?.year ?? '');
    setDescription(ex?.description ?? '');
    setImageUrl(ex?.imageUrl ?? '');
  }, [certificateId, draft]);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
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
    if (!trimmedTitle || !trimmedIssuer) return;
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
        <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={onFile} />
        {imageUrl ? (
          <div className="mt-3 overflow-hidden rounded-[22px] bg-white">
            <img src={imageUrl} alt="" className="max-h-48 w-full object-contain" decoding="async" />
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 w-full rounded-full bg-white py-3 text-[14px] font-semibold text-neutral-900 shadow-sm transition active:scale-[0.99]"
        >
          {imageUrl ? 'Заменить фото' : 'Загрузить фото'}
        </button>
        <p className="mt-2 text-center text-[11px] text-neutral-500">
          {/* TODO: Supabase Storage. Демо: краткий preview через URL.createObjectURL, в черновике — data URL. */}
          Демо: после выбора файла изображение сохраняется в черновике как data URL.
        </p>
      </div>

      <SheetFooter onCancel={onCancel} onSave={save} />
    </div>
  );
}

export function SheetPortfolio({
  draft,
  itemId,
  onSave,
  onCancel,
}: {
  draft: MasterDraft;
  itemId: string | null;
  onSave: (list: MasterPortfolioItem[]) => SheetSaveResult;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const list = draft.portfolio ?? [];
  const existing = itemId ? list.find((p) => p.id === itemId) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? '');

  useEffect(() => {
    const ex = itemId ? (draft.portfolio ?? []).find((p) => p.id === itemId) : undefined;
    setTitle(ex?.title ?? '');
    setDescription(ex?.description ?? '');
    setImageUrl(ex?.imageUrl ?? '');
  }, [draft, itemId]);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
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
    if (!imageUrl.trim()) return;
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
      <div className="rounded-[26px] bg-[#F1EFEF] p-4">
        <p className="text-[13px] font-semibold text-neutral-500">Фото работы *</p>
        <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={onFile} />
        {imageUrl ? (
          <div className="mt-3 overflow-hidden rounded-[22px] bg-white">
            <img src={imageUrl} alt="" className="aspect-square w-full object-cover" decoding="async" />
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 w-full rounded-full bg-white py-3 text-[14px] font-semibold text-neutral-900 shadow-sm transition active:scale-[0.99]"
        >
          {imageUrl ? 'Заменить фото' : 'Загрузить фото'}
        </button>
        <p className="mt-2 text-center text-[11px] text-neutral-500">
          {/* TODO: Supabase Storage */}
          Демо: data URL в черновике.
        </p>
      </div>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Название</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass()} />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Описание</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={fieldClass()} />
      </label>

      <SheetFooter onCancel={onCancel} onSave={save} />
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
