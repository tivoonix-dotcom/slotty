import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { MasterCareerItemType, MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { normalizeMasterCareerItemType } from '../../../features/profile/lib/demoMasterStorage';
import {
  defaultMasterAvatarUrl,
  formatScheduleClientPreview,
} from '../../../features/master/model/masterDraftStorage';
import type { MasterLocation } from '../../../features/profile/model/masterLocation';
import {
  formatFullAddress,
  formatPublicAddress,
  masterLocationDetailRows,
} from '../../../features/profile/model/masterLocation';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { useAdminMasterDraft } from '../useAdminMasterData';
import {
  deleteCareerItem,
  deleteCertificate,
  deletePortfolioItem,
  syncCareerItems,
  syncCertificates,
  syncPortfolioItems,
  updateMyBookingRules,
} from '../../../features/admin/api/adminProfileApi';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import {
  SheetAddress,
  SheetCertificate,
  SheetDeleteConfirm,
  SheetMainInfo,
  SheetPortfolio,
  SheetRules,
} from './AdminProfileEditSheets';

type ProfileSection = 'main' | 'address' | 'trust' | 'rules';

type CareerItemType = MasterCareerItemType;

type MasterCareerItem = {
  id: string;
  type: CareerItemType;
  title: string;
  place: string;
  startYear?: string;
  endYear?: string;
  description?: string;
};

type ProfileSheet =
  | null
  | 'main'
  | 'address'
  | 'rules'
  | { k: 'career'; id?: string }
  | { k: 'del-career'; id: string }
  | { k: 'cert'; id?: string }
  | { k: 'portfolio'; id?: string }
  | { k: 'del-cert'; id: string }
  | { k: 'del-portfolio'; id: string };

const CAREER_TYPES: Array<{ value: CareerItemType; label: string }> = [
  { value: 'education', label: 'Образование' },
  { value: 'course', label: 'Курс' },
  { value: 'practice', label: 'Практика' },
  { value: 'work', label: 'Работа' },
];

function newEntityId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fieldClass(): string {
  return `
    mt-1.5
    w-full
    rounded-[24px]
    bg-[#F1EFEF]
    px-4
    py-3.5
    text-[16px]
    font-semibold
    text-neutral-950
    outline-none
    ring-0
    placeholder:text-neutral-400
    transition
    focus:bg-white
    focus:shadow-[0_10px_28px_rgba(17,17,17,0.05)]
  `;
}

function careerTypeLabel(type: CareerItemType): string {
  switch (type) {
    case 'education':
      return 'Образование';
    case 'course':
      return 'Курс';
    case 'practice':
      return 'Практика';
    case 'work':
      return 'Работа';
  }
}

function normalizeCareerType(raw: string | CareerItemType | undefined): CareerItemType {
  return normalizeMasterCareerItemType(raw);
}

function normalizeCareerItems(draft: MasterDraft): MasterCareerItem[] {
  if (draft.careerItems?.length) {
    return draft.careerItems.map((item) => ({
      ...item,
      type: normalizeCareerType(item.type),
    }));
  }

  if (draft.experience?.trim()) {
    return [
      {
        id: 'legacy-experience',
        type: 'work',
        title: 'Опыт работы',
        place: '',
        description: draft.experience.trim(),
      },
    ];
  }

  return [];
}

function hasLocationExtras(loc: MasterLocation): boolean {
  return Boolean(
    loc.entrance?.trim() ||
      loc.floor?.trim() ||
      loc.room?.trim() ||
      loc.intercom?.trim() ||
      loc.landmark?.trim() ||
      loc.directions?.trim() ||
      loc.clientNote?.trim(),
  );
}

function hasRulesContent(d: MasterDraft): boolean {
  return Boolean(
    d.bookingRules?.trim() ||
      d.cancellationPolicy?.trim() ||
      (d.paymentMethods?.length ?? 0) > 0 ||
      d.paymentNote?.trim(),
  );
}

function certificatesNonHttpsError(certificates: { imageUrl?: string }[]): string | null {
  for (const c of certificates) {
    const u = c.imageUrl?.trim();
    if (u && !u.startsWith('https://')) {
      return 'Для опубликованного профиля укажите ссылку на изображение (https://…). Загрузка файла в облако — позже.';
    }
  }
  return null;
}

function portfolioHttpsError(portfolio: { imageUrl?: string }[]): string | null {
  for (const p of portfolio) {
    const u = p.imageUrl?.trim() ?? '';
    if (!u) return 'Укажите ссылку на изображение (https://…).';
    if (!u.startsWith('https://')) {
      return 'Для опубликованного профиля укажите ссылку на изображение (https://…). Загрузка файла в облако — позже.';
    }
  }
  return null;
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 21a8 8 0 0 0-16 0" strokeLinecap="round" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function IconMap({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3l1.5 5.2L19 10l-5.5 1.8L12 17l-1.5-5.2L5 10l5.5-1.8L12 3Z" strokeLinejoin="round" />
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconRules({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function valueOrDash(value?: string | null): string {
  const trimmed = value?.trim() ?? '';
  return trimmed || '—';
}

function InfoBlock({
  label,
  value,
  large,
}: {
  label: string;
  value?: string | null;
  large?: boolean;
}) {
  return (
    <div className="rounded-[26px] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{label}</p>
      <p
        className={`mt-2 whitespace-pre-wrap leading-relaxed text-neutral-950 ${
          large ? 'text-[16px] font-semibold' : 'text-[15px] font-medium'
        }`}
      >
        {valueOrDash(value)}
      </p>
    </div>
  );
}

function EmptyBlock({
  title,
  text,
  actionLabel,
  onAction,
}: {
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[28px] bg-white px-5 py-6 text-center shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
      <p className="text-[18px] font-semibold tracking-[-0.045em] text-neutral-950">{title}</p>
      <p className="mx-auto mt-2 max-w-[20rem] text-[14px] leading-relaxed text-neutral-500">{text}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#F1EFEF] px-6 text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98]"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function SectionCard({
  title,
  text,
  headerAction,
  children,
}: {
  title: string;
  text?: string;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[34px] bg-[#F1EFEF] p-3 shadow-[0_14px_42px_rgba(17,17,17,0.045)]">
      <div className="rounded-[30px] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.055em] text-neutral-950">{title}</h2>
            {text ? <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">{text}</p> : null}
          </div>
          {headerAction ? <div className="shrink-0 pt-0.5">{headerAction}</div> : null}
        </div>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function AdminProfileHero({ draft }: { draft: MasterDraft }) {
  const photoSrc = (draft.photoUrl && draft.photoUrl.trim()) || defaultMasterAvatarUrl(draft.name || 'Мастер');
  const shortAddress = formatPublicAddress(draft.location);

  return (
    <section className="rounded-[38px] bg-[#F1EFEF] p-3 shadow-[0_20px_60px_rgba(17,17,17,0.05)]">
      <div className="rounded-[32px] bg-white p-4 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
        <div className="flex gap-4">
          <div className="h-[6.5rem] w-[6.5rem] shrink-0 overflow-hidden rounded-[28px] bg-[#F1EFEF] shadow-[0_10px_28px_rgba(17,17,17,0.08)]">
            <img
              src={photoSrc}
              alt=""
              width={160}
              height={160}
              className="h-full w-full object-cover"
              decoding="async"
              onError={(event) => {
                (event.target as HTMLImageElement).src = defaultMasterAvatarUrl(draft.name || 'Мастер');
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Профиль мастера</p>
            <h1 className="mt-1 break-words text-[27px] font-semibold leading-[1.02] tracking-[-0.065em] text-neutral-950">
              {draft.name.trim() || 'Мастер'}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#F1EFEF] px-3 py-1.5 text-[12px] font-semibold text-neutral-700">
                {draft.category || 'Категория'}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-[26px] bg-[#F1EFEF] px-4 py-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">На карточке клиента</p>
          <p className="mt-1 text-[15px] font-semibold leading-snug text-neutral-950">{shortAddress || 'Адрес не указан'}</p>
        </div>
      </div>
    </section>
  );
}

function SectionTabs({
  active,
  onChange,
}: {
  active: ProfileSection;
  onChange: (section: ProfileSection) => void;
}) {
  const tabs: Array<{ id: ProfileSection; label: string; icon: ReactNode }> = [
    { id: 'main', label: 'Основное', icon: <IconUser /> },
    { id: 'address', label: 'Адрес', icon: <IconMap /> },
    { id: 'trust', label: 'Доверие', icon: <IconSparkles /> },
    { id: 'rules', label: 'Правила', icon: <IconRules /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 rounded-[30px] bg-[#F1EFEF] p-2 sm:grid-cols-4">
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-full px-3 text-[13px] font-semibold transition active:scale-[0.98] ${
              selected
                ? 'bg-[#E29595] text-white shadow-[0_10px_24px_rgba(226,149,149,0.24)]'
                : 'bg-white/70 text-neutral-700'
            }`}
          >
            <span className="h-4 w-4">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function MainSection({
  draft,
  onEditMain,
}: {
  draft: MasterDraft;
  onEditMain: () => void;
}) {
  return (
    <SectionCard
      title="Основная информация"
      text="Имя, описание и контакты, которые видит клиент перед записью."
      headerAction={
        <button
          type="button"
          onClick={onEditMain}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F1EFEF] text-neutral-800 transition active:scale-[0.96]"
          aria-label="Редактировать основную информацию"
        >
          <IconPencil className="h-[18px] w-[18px]" />
        </button>
      }
    >
      <InfoBlock label="Имя / название" value={draft.name} large />
      <InfoBlock label="Категория" value={draft.category} />
      <InfoBlock label="Телефон" value={draft.phone} />
      <InfoBlock label="Telegram / контакт" value={draft.contact} />
      <InfoBlock label="О себе" value={draft.description} large />
    </SectionCard>
  );
}

function AddressSection({
  draft,
  onEditAddress,
}: {
  draft: MasterDraft;
  onEditAddress: () => void;
}) {
  const shortAddress = formatPublicAddress(draft.location);
  const fullAddress = formatFullAddress(draft.location);
  const detailRows = masterLocationDetailRows(draft.location);
  const extras = hasLocationExtras(draft.location);

  return (
    <SectionCard
      title="Адрес и как пройти"
      text="Здесь должно быть понятно не только куда ехать, но и как найти кабинет."
    >
      <InfoBlock label="Кратко на карточке" value={shortAddress} large />
      <InfoBlock label="Полный адрес и инструкции" value={fullAddress} large />

      {extras ? (
        <ul className="flex flex-col gap-2 rounded-[28px] bg-white p-4 shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
          {detailRows.map((row) => (
            <li key={row.label} className="rounded-[22px] bg-[#F1EFEF] px-4 py-3 text-[14px] leading-snug">
              <span className="font-semibold text-neutral-500">{row.label}: </span>
              <span className="font-semibold text-neutral-950">{row.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[28px] bg-white px-5 py-6 text-center shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
          <p className="text-[18px] font-semibold tracking-[-0.045em] text-neutral-950">Детали адреса не заполнены</p>
          <p className="mx-auto mt-2 max-w-[20rem] text-[14px] leading-relaxed text-neutral-500">
            Добавьте вход, этаж, кабинет и ориентиры, чтобы клиент не потерялся.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onEditAddress}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
      >
        Редактировать адрес
      </button>

      <div className="rounded-[28px] bg-white p-4 shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Расписание</p>
        <p className="mt-2 text-[14px] font-medium leading-relaxed text-neutral-700">{formatScheduleClientPreview(draft.schedule)}</p>
      </div>
    </SectionCard>
  );
}

function CareerSheet({
  draft,
  itemId,
  onSave,
  onCancel,
}: {
  draft: MasterDraft;
  itemId: string | null;
  onSave: (items: MasterCareerItem[]) => void | Promise<void>;
  onCancel: () => void;
}) {
  const careerItems = normalizeCareerItems(draft).filter((item) => item.id !== 'legacy-experience');
  const editing = careerItems.find((item) => item.id === itemId);

  const [type, setType] = useState<CareerItemType>(() => normalizeCareerType(editing?.type));
  const [title, setTitle] = useState(editing?.title ?? '');
  const [place, setPlace] = useState(editing?.place ?? '');
  const [startYear, setStartYear] = useState(editing?.startYear ?? '');
  const [endYear, setEndYear] = useState(editing?.endYear ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(() => {
    const cleanTitle = title.trim();
    const cleanPlace = place.trim();

    if (!cleanTitle) {
      setError('Укажите название.');
      return;
    }

    if (!cleanPlace) {
      setError('Укажите место, организацию или салон.');
      return;
    }

    const row: MasterCareerItem = {
      id: editing?.id ?? newEntityId('career'),
      type,
      title: cleanTitle,
      place: cleanPlace,
      startYear: startYear.trim() || undefined,
      endYear: endYear.trim() || undefined,
      description: description.trim() || undefined,
    };

    const next = editing
      ? careerItems.map((item) => (item.id === editing.id ? row : item))
      : [...careerItems, row];

    onSave(next);
  }, [careerItems, description, editing, endYear, onSave, place, startYear, title, type]);

  return (
    <div className="space-y-4 pb-2">
      <div>
        <p className="text-[13px] font-semibold text-neutral-500">Тип</p>

        <div className="mt-2 flex flex-wrap gap-2">
          {CAREER_TYPES.map((item) => {
            const active = type === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setType(item.value)}
                className={`rounded-full px-4 py-2.5 text-[14px] font-semibold transition active:scale-[0.98] ${
                  active
                    ? 'bg-[#E29595] text-white shadow-[0_8px_20px_rgba(226,149,149,0.24)]'
                    : 'bg-[#F1EFEF] text-neutral-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Название *</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Например: Минский колледж сферы обслуживания"
          className={fieldClass()}
        />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Место / организация *</span>
        <input
          value={place}
          onChange={(event) => setPlace(event.target.value)}
          placeholder="Колледж, школа, салон или студия"
          className={fieldClass()}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[13px] font-semibold text-neutral-500">С</span>
          <input
            value={startYear}
            onChange={(event) => setStartYear(event.target.value)}
            placeholder="2022"
            inputMode="numeric"
            className={fieldClass()}
          />
        </label>

        <label className="block">
          <span className="text-[13px] font-semibold text-neutral-500">По</span>
          <input
            value={endYear}
            onChange={(event) => setEndYear(event.target.value)}
            placeholder="2025 / сейчас"
            className={fieldClass()}
          />
        </label>
      </div>

      <label className="block">
        <span className="text-[13px] font-semibold text-neutral-500">Описание</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Коротко: специальность, практика, обязанности или чему научились"
          rows={3}
          className={`${fieldClass()} resize-none leading-relaxed`}
        />
      </label>

      {error ? (
        <p className="rounded-[22px] bg-[#FFF4E8] px-4 py-3 text-[14px] font-semibold text-[#B66A24]">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
        >
          Отмена
        </button>

        <button
          type="button"
          onClick={save}
          className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}

function TrustSection({
  draft,
  onAddCareer,
  onEditCareer,
  onDeleteCareer,
  onAddCert,
  onEditCert,
  onDeleteCert,
  onAddPortfolio,
  onEditPortfolio,
  onDeletePortfolio,
}: {
  draft: MasterDraft;
  onAddCareer: () => void;
  onEditCareer: (id: string) => void;
  onDeleteCareer: (id: string) => void;
  onAddCert: () => void;
  onEditCert: (id: string) => void;
  onDeleteCert: (id: string) => void;
  onAddPortfolio: () => void;
  onEditPortfolio: (id: string) => void;
  onDeletePortfolio: (id: string) => void;
}) {
  const careerItems = normalizeCareerItems(draft);
  const certificates = draft.certificates ?? [];
  const portfolio = draft.portfolio ?? [];

  return (
    <SectionCard title="Доверие" text="Образование, сертификаты и работы помогают клиенту быстрее принять решение.">
      <div className="rounded-[30px] bg-white p-4 shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[20px] font-semibold tracking-[-0.05em] text-neutral-950">Образование и опыт</p>
            <p className="mt-1 text-[14px] leading-relaxed text-neutral-500">
              Колледж, курсы, практика, стажировка и работа.
            </p>
          </div>
          <span className="rounded-full bg-[#F1EFEF] px-3 py-1.5 text-[12px] font-semibold text-neutral-500">
            {careerItems.length}
          </span>
        </div>

        {careerItems.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {careerItems.map((item) => {
              const isLegacy = item.id === 'legacy-experience';

              return (
                <li key={item.id} className="relative rounded-[26px] bg-[#F1EFEF] p-4">
                  {!isLegacy ? (
                    <div className="absolute right-2 top-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => onEditCareer(item.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-800 shadow-sm transition active:scale-[0.95]"
                        aria-label="Редактировать запись"
                      >
                        <IconPencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCareer(item.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-600 shadow-sm transition active:scale-[0.95]"
                        aria-label="Удалить запись"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}

                  <div className={isLegacy ? '' : 'pr-20'}>
                    <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-neutral-600">
                      {careerTypeLabel(item.type)}
                    </span>

                    <p className="mt-3 text-[17px] font-semibold tracking-[-0.045em] text-neutral-950">
                      {item.title}
                    </p>

                    {item.place ? (
                      <p className="mt-1 text-[14px] font-semibold text-neutral-600">
                        {item.place}
                      </p>
                    ) : null}

                    {item.startYear || item.endYear ? (
                      <p className="mt-1 text-[13px] font-medium text-neutral-400">
                        {item.startYear || '—'} — {item.endYear || 'сейчас'}
                      </p>
                    ) : null}

                    {item.description ? (
                      <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-neutral-500">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={onAddCareer}
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98]"
        >
          Добавить образование или опыт
        </button>
      </div>

      <div className="rounded-[30px] bg-white p-4 shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[20px] font-semibold tracking-[-0.05em] text-neutral-950">Сертификаты</p>
            <p className="mt-1 text-[14px] leading-relaxed text-neutral-500">Фото курсов, дипломов и документов.</p>
          </div>
          <span className="rounded-full bg-[#F1EFEF] px-3 py-1.5 text-[12px] font-semibold text-neutral-500">{certificates.length}</span>
        </div>

        {certificates.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {certificates.map((certificate) => (
              <li key={certificate.id} className="relative rounded-[26px] bg-[#F1EFEF] p-3 pr-14">
                <div className="absolute right-2 top-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => onEditCert(certificate.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-800 shadow-sm transition active:scale-[0.95]"
                    aria-label="Редактировать сертификат"
                  >
                    <IconPencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCert(certificate.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-600 shadow-sm transition active:scale-[0.95]"
                    aria-label="Удалить сертификат"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
                {certificate.imageUrl ? (
                  <div className="mb-3 overflow-hidden rounded-[22px] bg-white">
                    <img src={certificate.imageUrl} alt="" className="h-36 w-full object-cover" decoding="async" />
                  </div>
                ) : null}
                <p className="text-[16px] font-semibold tracking-[-0.04em] text-neutral-950">{certificate.title}</p>
                <p className="mt-1 text-[13px] font-medium text-neutral-500">
                  {certificate.issuer}
                  {certificate.year ? ` · ${certificate.year}` : ''}
                </p>
                {certificate.description ? (
                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">{certificate.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={onAddCert}
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98]"
        >
          Добавить сертификат
        </button>
      </div>

      <div className="rounded-[30px] bg-white p-4 shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[20px] font-semibold tracking-[-0.05em] text-neutral-950">Портфолио</p>
            <p className="mt-1 text-[14px] leading-relaxed text-neutral-500">Фото работ мастера.</p>
          </div>
          <span className="rounded-full bg-[#F1EFEF] px-3 py-1.5 text-[12px] font-semibold text-neutral-500">{portfolio.length}</span>
        </div>

        {portfolio.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {portfolio.map((item) => (
              <article key={item.id} className="relative overflow-hidden rounded-[24px] bg-[#F1EFEF]">
                <div className="absolute right-1 top-1 z-10 flex gap-1">
                  <button
                    type="button"
                    onClick={() => onEditPortfolio(item.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-sm backdrop-blur-sm transition active:scale-[0.95]"
                    aria-label="Редактировать работу"
                  >
                    <IconPencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePortfolio(item.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-sm backdrop-blur-sm transition active:scale-[0.95]"
                    aria-label="Удалить работу"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="aspect-square w-full object-cover" decoding="async" />
                ) : (
                  <div className="aspect-square w-full bg-white" />
                )}
                <div className="px-3 py-3">
                  <p className="truncate text-[14px] font-semibold text-neutral-950">{item.title || 'Работа'}</p>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-neutral-500">{item.description}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onAddPortfolio}
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98]"
        >
          Добавить работу
        </button>
      </div>
    </SectionCard>
  );
}

function RulesSection({
  draft,
  onEditRules,
}: {
  draft: MasterDraft;
  onEditRules: () => void;
}) {
  const paymentMethods = draft.paymentMethods ?? [];
  const filled = hasRulesContent(draft);

  return (
    <SectionCard title="Правила записи" text="Условия записи, отмены и оплаты лучше показать заранее.">
      {filled ? (
        <>
          <InfoBlock label="Правила записи" value={draft.bookingRules} large />
          <InfoBlock label="Правила отмены" value={draft.cancellationPolicy} large />
          <div className="rounded-[30px] bg-white p-4 shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Способы оплаты</p>
            {paymentMethods.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <span
                    key={method}
                    className="rounded-full bg-[#F1EFEF] px-3 py-2 text-[13px] font-semibold text-neutral-700"
                  >
                    {method}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[15px] font-medium text-neutral-950">—</p>
            )}
            {draft.paymentNote?.trim() ? (
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">{draft.paymentNote}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onEditRules}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
          >
            Редактировать правила
          </button>
        </>
      ) : (
        <EmptyBlock
          title="Правила не заполнены"
          text="Добавьте условия записи, отмены и оплату — так клиенту будет спокойнее записываться."
          actionLabel="Добавить правила"
          onAction={onEditRules}
        />
      )}
    </SectionCard>
  );
}

function AdminProfileReadView({
  draft,
  onEditMain,
  onEditAddress,
  onEditRules,
  onAddCareer,
  onEditCareer,
  onDeleteCareer,
  onAddCert,
  onEditCert,
  onDeleteCert,
  onAddPortfolio,
  onEditPortfolio,
  onDeletePortfolio,
}: {
  draft: MasterDraft;
  onEditMain: () => void;
  onEditAddress: () => void;
  onEditRules: () => void;
  onAddCareer: () => void;
  onEditCareer: (id: string) => void;
  onDeleteCareer: (id: string) => void;
  onAddCert: () => void;
  onEditCert: (id: string) => void;
  onDeleteCert: (id: string) => void;
  onAddPortfolio: () => void;
  onEditPortfolio: (id: string) => void;
  onDeletePortfolio: (id: string) => void;
}) {
  const [activeSection, setActiveSection] = useState<ProfileSection>('main');

  const section = useMemo(() => {
    if (activeSection === 'address') {
      return <AddressSection draft={draft} onEditAddress={onEditAddress} />;
    }
    if (activeSection === 'trust') {
      return (
        <TrustSection
          draft={draft}
          onAddCareer={onAddCareer}
          onEditCareer={onEditCareer}
          onDeleteCareer={onDeleteCareer}
          onAddCert={onAddCert}
          onEditCert={onEditCert}
          onDeleteCert={onDeleteCert}
          onAddPortfolio={onAddPortfolio}
          onEditPortfolio={onEditPortfolio}
          onDeletePortfolio={onDeletePortfolio}
        />
      );
    }
    if (activeSection === 'rules') {
      return <RulesSection draft={draft} onEditRules={onEditRules} />;
    }
    return <MainSection draft={draft} onEditMain={onEditMain} />;
  }, [
    activeSection,
    draft,
    onAddCareer,
    onAddCert,
    onAddPortfolio,
    onDeleteCareer,
    onDeleteCert,
    onDeletePortfolio,
    onEditAddress,
    onEditCareer,
    onEditCert,
    onEditMain,
    onEditPortfolio,
    onEditRules,
  ]);

  return (
    <div className="space-y-5">
      <AdminProfileHero draft={draft} />
      <SectionTabs active={activeSection} onChange={setActiveSection} />
      {section}
    </div>
  );
}

function sheetTitle(sheet: ProfileSheet): string | undefined {
  if (sheet == null) return undefined;
  if (sheet === 'main') return 'Основная информация';
  if (sheet === 'address') return 'Адрес';
  if (sheet === 'rules') return 'Правила записи';
  if (typeof sheet === 'object' && sheet.k === 'career') return sheet.id ? 'Образование и опыт' : 'Новая запись';
  if (typeof sheet === 'object' && sheet.k === 'del-career') return 'Удалить запись?';
  if (typeof sheet === 'object' && sheet.k === 'cert') return sheet.id ? 'Сертификат' : 'Новый сертификат';
  if (typeof sheet === 'object' && sheet.k === 'portfolio') return sheet.id ? 'Работа в портфолио' : 'Новая работа';
  if (typeof sheet === 'object' && sheet.k === 'del-cert') return 'Удалить сертификат?';
  if (typeof sheet === 'object' && sheet.k === 'del-portfolio') return 'Удалить работу?';
  return undefined;
}

export function AdminProfileSection() {
  const { draft, persistDraft, flushDraftToBackend, refreshDraft } = useAdminMasterDraft();
  const { useCabinetApi } = useAdminMasterCabinet();
  const [sheet, setSheet] = useState<ProfileSheet>(null);
  const [sheetApiError, setSheetApiError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const showSaved = useCallback(() => {
    setToast(true);
    window.setTimeout(() => setToast(false), 2200);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetApiError(null);
    setSheet(null);
  }, []);

  const saveMain = useCallback(
    async (patch: Partial<MasterDraft>) => {
      if (useCabinetApi) {
        const p = patch.photoUrl?.trim();
        if (p && !p.startsWith('https://')) {
          setSheetApiError('Для публичного профиля укажите ссылку на фото (https://…) или удалите фото.');
          return;
        }
      }
      setSheetApiError(null);
      if (!useCabinetApi) {
        persistDraft({ ...draft, ...patch });
        closeSheet();
        showSaved();
        return;
      }
      try {
        await flushDraftToBackend({ ...draft, ...patch });
        closeSheet();
        showSaved();
      } catch (e) {
        setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
    },
    [closeSheet, draft, flushDraftToBackend, persistDraft, showSaved, useCabinetApi],
  );

  const saveLocation = useCallback(
    async (location: MasterDraft['location']) => {
      setSheetApiError(null);
      if (!useCabinetApi) {
        persistDraft({ ...draft, location });
        closeSheet();
        showSaved();
        return;
      }
      try {
        await flushDraftToBackend({ ...draft, location });
        closeSheet();
        showSaved();
      } catch (e) {
        setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
    },
    [closeSheet, draft, flushDraftToBackend, persistDraft, showSaved, useCabinetApi],
  );

  const saveRules = useCallback(
    async (patch: Pick<MasterDraft, 'bookingRules' | 'cancellationPolicy' | 'paymentMethods' | 'paymentNote'>) => {
      if (!useCabinetApi) {
        setSheetApiError(null);
        persistDraft({ ...draft, ...patch });
        closeSheet();
        showSaved();
        return;
      }
      setSheetApiError(null);
      try {
        await updateMyBookingRules({
          bookingRules: patch.bookingRules ?? null,
          cancellationPolicy: patch.cancellationPolicy ?? null,
          paymentNote: patch.paymentNote ?? null,
          paymentMethods: patch.paymentMethods,
        });
        await refreshDraft();
        closeSheet();
        showSaved();
      } catch (e) {
        setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
    },
    [closeSheet, draft, persistDraft, refreshDraft, showSaved, useCabinetApi],
  );

  const saveCareer = useCallback(
    async (careerItems: MasterCareerItem[]) => {
      if (!useCabinetApi) {
        setSheetApiError(null);
        persistDraft({
          ...draft,
          careerItems,
          experience: undefined,
        });
        closeSheet();
        showSaved();
        return;
      }
      setSheetApiError(null);
      try {
        const prev = normalizeCareerItems(draft).filter((item) => item.id !== 'legacy-experience');
        await syncCareerItems(prev, careerItems);
        await refreshDraft();
        closeSheet();
        showSaved();
      } catch (e) {
        setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
    },
    [closeSheet, draft, persistDraft, refreshDraft, showSaved, useCabinetApi],
  );

  const saveCertificates = useCallback(
    async (certificates: NonNullable<MasterDraft['certificates']>) => {
      if (useCabinetApi) {
        const imgErr = certificatesNonHttpsError(certificates);
        if (imgErr) {
          setSheetApiError(imgErr);
          return;
        }
      }
      if (!useCabinetApi) {
        setSheetApiError(null);
        persistDraft({ ...draft, certificates });
        closeSheet();
        showSaved();
        return;
      }
      setSheetApiError(null);
      try {
        const prev = draft.certificates ?? [];
        await syncCertificates(prev, certificates);
        await refreshDraft();
        closeSheet();
        showSaved();
      } catch (e) {
        setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
    },
    [closeSheet, draft, persistDraft, refreshDraft, showSaved, useCabinetApi],
  );

  const savePortfolio = useCallback(
    async (portfolio: NonNullable<MasterDraft['portfolio']>) => {
      if (useCabinetApi) {
        const imgErr = portfolioHttpsError(portfolio);
        if (imgErr) {
          setSheetApiError(imgErr);
          return;
        }
      }
      if (!useCabinetApi) {
        setSheetApiError(null);
        persistDraft({ ...draft, portfolio });
        closeSheet();
        showSaved();
        return;
      }
      setSheetApiError(null);
      try {
        const prev = (draft.portfolio ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          imageUrl: (p.imageUrl ?? '').trim(),
        }));
        const forSync = portfolio.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          imageUrl: (p.imageUrl ?? '').trim(),
        }));
        await syncPortfolioItems(prev, forSync);
        await refreshDraft();
        closeSheet();
        showSaved();
      } catch (e) {
        setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
    },
    [closeSheet, draft, persistDraft, refreshDraft, showSaved, useCabinetApi],
  );

  const confirmDeleteCareer = useCallback(async () => {
    if (!sheet || typeof sheet !== 'object' || sheet.k !== 'del-career') return;

    const id = sheet.id;
    const next = (draft.careerItems ?? []).filter((item) => item.id !== id);

    if (!useCabinetApi) {
      setSheetApiError(null);
      persistDraft({ ...draft, careerItems: next });
      closeSheet();
      showSaved();
      return;
    }

    setSheetApiError(null);
    if (!isUuid(id)) {
      persistDraft({ ...draft, careerItems: next, experience: undefined });
      closeSheet();
      showSaved();
      return;
    }
    try {
      await deleteCareerItem(id);
      await refreshDraft();
      closeSheet();
      showSaved();
    } catch (e) {
      setSheetApiError(e instanceof Error ? e.message : 'Ошибка удаления');
    }
  }, [closeSheet, draft, persistDraft, refreshDraft, sheet, showSaved, useCabinetApi]);

  const confirmDeleteCert = useCallback(async () => {
    if (!sheet || typeof sheet !== 'object' || sheet.k !== 'del-cert') return;
    const id = sheet.id;
    const next = (draft.certificates ?? []).filter((certificate) => certificate.id !== id);

    if (!useCabinetApi) {
      setSheetApiError(null);
      persistDraft({ ...draft, certificates: next });
      closeSheet();
      showSaved();
      return;
    }

    setSheetApiError(null);
    if (!isUuid(id)) {
      persistDraft({ ...draft, certificates: next });
      closeSheet();
      showSaved();
      return;
    }
    try {
      await deleteCertificate(id);
      await refreshDraft();
      closeSheet();
      showSaved();
    } catch (e) {
      setSheetApiError(e instanceof Error ? e.message : 'Ошибка удаления');
    }
  }, [closeSheet, draft, persistDraft, refreshDraft, sheet, showSaved, useCabinetApi]);

  const confirmDeletePortfolio = useCallback(async () => {
    if (!sheet || typeof sheet !== 'object' || sheet.k !== 'del-portfolio') return;
    const id = sheet.id;
    const next = (draft.portfolio ?? []).filter((item) => item.id !== id);

    if (!useCabinetApi) {
      setSheetApiError(null);
      persistDraft({ ...draft, portfolio: next });
      closeSheet();
      showSaved();
      return;
    }

    setSheetApiError(null);
    if (!isUuid(id)) {
      persistDraft({ ...draft, portfolio: next });
      closeSheet();
      showSaved();
      return;
    }
    try {
      await deletePortfolioItem(id);
      await refreshDraft();
      closeSheet();
      showSaved();
    } catch (e) {
      setSheetApiError(e instanceof Error ? e.message : 'Ошибка удаления');
    }
  }, [closeSheet, draft, persistDraft, refreshDraft, sheet, showSaved, useCabinetApi]);

  const sheetBody = useMemo(() => {
    if (sheet === 'main') {
      return <SheetMainInfo draft={draft} onSave={saveMain} onCancel={closeSheet} />;
    }

    if (sheet === 'address') {
      return <SheetAddress draft={draft} onSave={saveLocation} onCancel={closeSheet} />;
    }

    if (sheet === 'rules') {
      return <SheetRules draft={draft} onSave={saveRules} onCancel={closeSheet} />;
    }

    if (sheet && typeof sheet === 'object' && sheet.k === 'career') {
      return (
        <CareerSheet
          key={`career-${sheet.id ?? 'new'}`}
          draft={draft}
          itemId={sheet.id ?? null}
          onSave={saveCareer}
          onCancel={closeSheet}
        />
      );
    }

    if (sheet && typeof sheet === 'object' && sheet.k === 'cert') {
      return (
        <SheetCertificate
          draft={draft}
          certificateId={sheet.id ?? null}
          onSave={saveCertificates}
          onCancel={closeSheet}
        />
      );
    }

    if (sheet && typeof sheet === 'object' && sheet.k === 'portfolio') {
      return (
        <SheetPortfolio
          draft={draft}
          itemId={sheet.id ?? null}
          onSave={savePortfolio}
          onCancel={closeSheet}
        />
      );
    }

    if (sheet && typeof sheet === 'object' && sheet.k === 'del-career') {
      return (
        <SheetDeleteConfirm
          text="Запись больше не будет отображаться в блоке образования и опыта."
          onBack={closeSheet}
          onDelete={confirmDeleteCareer}
        />
      );
    }

    if (sheet && typeof sheet === 'object' && sheet.k === 'del-cert') {
      return (
        <SheetDeleteConfirm
          text="Он больше не будет отображаться в профиле мастера."
          onBack={closeSheet}
          onDelete={confirmDeleteCert}
        />
      );
    }

    if (sheet && typeof sheet === 'object' && sheet.k === 'del-portfolio') {
      return (
        <SheetDeleteConfirm
          text="Фото больше не будет отображаться в профиле мастера."
          onBack={closeSheet}
          onDelete={confirmDeletePortfolio}
        />
      );
    }

    return null;
  }, [
    closeSheet,
    confirmDeleteCareer,
    confirmDeleteCert,
    confirmDeletePortfolio,
    draft,
    saveCareer,
    saveCertificates,
    saveLocation,
    saveMain,
    savePortfolio,
    saveRules,
    sheet,
  ]);

  return (
    <div className="px-4 pb-10">
      <header className="pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">SLOTTY</p>
        <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.065em] text-neutral-950">Кабинет мастера</h1>
      </header>

      <section className="relative mt-5">
        <AdminProfileReadView
          draft={draft}
          onEditMain={() => setSheet('main')}
          onEditAddress={() => setSheet('address')}
          onEditRules={() => setSheet('rules')}
          onAddCareer={() => setSheet({ k: 'career' })}
          onEditCareer={(id) => setSheet({ k: 'career', id })}
          onDeleteCareer={(id) => setSheet({ k: 'del-career', id })}
          onAddCert={() => setSheet({ k: 'cert' })}
          onEditCert={(id) => setSheet({ k: 'cert', id })}
          onDeleteCert={(id) => setSheet({ k: 'del-cert', id })}
          onAddPortfolio={() => setSheet({ k: 'portfolio' })}
          onEditPortfolio={(id) => setSheet({ k: 'portfolio', id })}
          onDeletePortfolio={(id) => setSheet({ k: 'del-portfolio', id })}
        />

        {toast ? (
          <div
            className="pointer-events-none fixed bottom-24 left-1/2 z-[210] -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-2.5 text-[14px] font-semibold text-white shadow-lg"
            role="status"
          >
            Сохранено
          </div>
        ) : null}

        <AdminBottomSheet open={sheet != null} onClose={closeSheet} title={sheetTitle(sheet)}>
          {sheetApiError ? (
            <p className="mb-3 rounded-2xl bg-red-50 px-3 py-2 text-[14px] font-medium text-red-700">{sheetApiError}</p>
          ) : null}
          {sheetBody}
        </AdminBottomSheet>
      </section>
    </div>
  );
}