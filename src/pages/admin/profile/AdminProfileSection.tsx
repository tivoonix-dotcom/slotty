import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BY } from 'country-flag-icons/react/1x1';
import {
  CONTACT_CHANNEL_META,
  contactRowsFromDraft,
} from '../../../features/master-onboarding/model/masterContacts';
import { ContactChannelBrandIcon } from '../../master-onboarding/MasterProfileContactsBlock';
import type { MasterCareerItemType, MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { normalizeMasterCareerItemType } from '../../../features/profile/lib/demoMasterStorage';
import {
  defaultMasterAvatarUrl,
  formatScheduleClientPreview,
} from '../../../features/master/model/masterDraftStorage';
import {
  buildLocationDisplayParts,
  catalogLineWithoutVisitPrefix,
  formatPublicAddress,
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
import {
  uploadMasterCertificateImageFile,
  uploadMasterHeroPhotoFromDataUrl,
  uploadMasterPortfolioImageFile,
} from '../../../features/admin/api/masterCabinetApi';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import {
  SheetAddress,
  SheetCertificate,
  SheetDeleteConfirm,
  SheetMainInfo,
  SheetPortfolio,
  SheetRules,
  SheetSchedule,
} from './AdminProfileEditSheets';
import { ImageReveal } from '../../../shared/ui/ImageReveal';

type ProfileSection = 'main' | 'address' | 'portfolio' | 'rules';

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
  | 'schedule'
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

function AddressDetailGrid({ rows }: { rows: Array<{ label: string; value: string }> }) {
  if (!rows.length) return null;
  return (
    <dl className="mt-3 flex flex-col gap-4">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{row.label}</dt>
          <dd className="mt-1 text-[15px] font-semibold leading-relaxed text-neutral-950">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function AddressPreviewPanel({
  title,
  hint,
  visitLabel,
  mode = 'short',
  mainLine,
  detailRows,
  wayfinding,
}: {
  title: string;
  hint?: string;
  visitLabel: string;
  mode?: 'short' | 'detailed';
  mainLine?: string;
  detailRows?: Array<{ label: string; value: string }>;
  wayfinding?: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded-[26px] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{title}</p>
      {hint ? <p className="mt-1 text-[12px] leading-snug text-neutral-500">{hint}</p> : null}
      <div className="mt-3">
        <span className="inline-flex rounded-full bg-[#F1EFEF] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">
          {visitLabel}
        </span>
        {mode === 'short' ? (
          <p className="mt-2 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-neutral-950">
            {mainLine || '—'}
          </p>
        ) : (
          <AddressDetailGrid rows={detailRows ?? []} />
        )}
        {wayfinding?.length ? (
          <div className="mt-3 space-y-2 border-t border-[#F1EFEF] pt-3">
            {wayfinding.map((row) => (
              <div key={row.label}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{row.label}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-[14px] font-medium leading-relaxed text-neutral-800">
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
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

function IconPortfolio({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconImagePlaceholder({ className }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="M3 16l5-5 3.5 3L14 11l7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMore({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

function IconRules({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h4" strokeLinecap="round" strokeLinejoin="round" />
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

function valueOrDash(value?: string | null): string {
  const trimmed = value?.trim() ?? '';
  return trimmed || '—';
}

const INFO_LEADING_ICON_WRAP =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-[0_2px_10px_rgba(17,17,17,0.06)]';
const INFO_LEADING_ICON_SIZE = 'h-[22px] w-[22px] shrink-0';

function InfoBlock({
  label,
  value,
  large,
  leading,
}: {
  label: string;
  value?: string | null;
  large?: boolean;
  leading?: ReactNode;
}) {
  const text = valueOrDash(value);
  return (
    <div className="rounded-[26px] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.035)]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{label}</p>
      {leading ? (
        <div className="mt-2 flex items-center gap-2.5">
          {leading}
          <p
            className={`min-w-0 flex-1 whitespace-pre-wrap leading-relaxed text-neutral-950 ${
              large ? 'text-[16px] font-semibold' : 'text-[15px] font-medium'
            }`}
          >
            {text}
          </p>
        </div>
      ) : (
        <p
          className={`mt-2 whitespace-pre-wrap leading-relaxed text-neutral-950 ${
            large ? 'text-[16px] font-semibold' : 'text-[15px] font-medium'
          }`}
        >
          {text}
        </p>
      )}
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
      <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
        <div className="relative aspect-[16/10] w-full bg-[#F1EFEF]">
          <ImageReveal
            src={photoSrc}
            alt=""
            width={640}
            height={400}
            className="h-full w-full object-cover"
            onError={(event) => {
              (event.target as HTMLImageElement).src = defaultMasterAvatarUrl(draft.name || 'Мастер');
            }}
          />
        </div>

        <div className="px-5 py-5 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Профиль мастера</p>
          <h1 className="mt-1 px-0.5 text-[clamp(17px,4.8vw,24px)] font-semibold leading-[1.2] tracking-[-0.04em] text-balance text-neutral-950">
            {draft.name.trim() || 'Мастер'}
          </h1>
          <div className="mt-3 flex justify-center">
            <span className="rounded-full bg-[#F1EFEF] px-3 py-1.5 text-[12px] font-semibold text-neutral-700">
              {draft.category || 'Категория'}
            </span>
          </div>
        </div>

        <div className="mx-4 mb-4 rounded-[26px] bg-[#F1EFEF] px-4 py-3 text-center">
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
    { id: 'portfolio', label: 'Портфолио', icon: <IconPortfolio /> },
    { id: 'rules', label: 'Правила', icon: <IconRules /> },
  ];

  return (
    <div className="flex items-center gap-1.5 rounded-[30px] bg-[#F1EFEF] p-2">
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-label={tab.label}
            title={tab.label}
            onClick={() => onChange(tab.id)}
            className={`flex min-h-11 flex-1 items-center justify-center rounded-full py-2 transition active:scale-[0.98] ${
              selected
                ? 'bg-[#E29595] text-white shadow-[0_10px_24px_rgba(226,149,149,0.24)]'
                : 'bg-white/70 text-neutral-700'
            }`}
          >
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center [&_svg]:max-h-[22px] [&_svg]:max-w-[22px]">
              {tab.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MainSection({
  draft,
  onEditMain,
  onEditSchedule,
}: {
  draft: MasterDraft;
  onEditMain: () => void;
  onEditSchedule: () => void;
}) {
  return (
    <div className="space-y-5">
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
      <InfoBlock
        label="Телефон"
        value={draft.phone}
        leading={
          draft.phone?.trim() ? (
            <span
              className={`${INFO_LEADING_ICON_WRAP} overflow-hidden border border-neutral-200 bg-white`}
              aria-hidden
            >
              <BY title="Беларусь" className={`${INFO_LEADING_ICON_SIZE} rounded-full object-cover`} />
            </span>
          ) : undefined
        }
      />
      {contactRowsFromDraft(draft)
        .filter((row) => row.value.trim())
        .map((row) => {
          const label = CONTACT_CHANNEL_META.find((m) => m.type === row.type)?.label ?? 'Контакт';
          return (
            <InfoBlock
              key={row.id}
              label={label}
              value={row.value}
              leading={
                <span className={`${INFO_LEADING_ICON_WRAP} bg-[#F1EFEF]`} aria-hidden>
                  <ContactChannelBrandIcon type={row.type} className={INFO_LEADING_ICON_SIZE} />
                </span>
              }
            />
          );
        })}
      {contactRowsFromDraft(draft).length === 0 && draft.contact.trim() ? (
        <InfoBlock label="Контакты" value={draft.contact} />
      ) : null}
      <InfoBlock label="О себе" value={draft.description} large />
    </SectionCard>

    <div className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)]">
      <div className="rounded-[30px] bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">График работы</p>
        <p className="mt-2 text-[14px] font-medium leading-relaxed text-neutral-700">
          {formatScheduleClientPreview(draft.schedule)}
        </p>
        <button
          type="button"
          onClick={onEditSchedule}
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
        >
          Изменить график работы
        </button>
      </div>
    </div>
    </div>
  );
}

function AddressSection({
  draft,
  onEditAddress,
}: {
  draft: MasterDraft;
  onEditAddress: () => void;
}) {
  const parts = buildLocationDisplayParts(draft.location);
  const visitLabel = parts?.visitLabel ?? 'Адрес';
  const catalogMain = parts
    ? catalogLineWithoutVisitPrefix(parts.catalogLine, visitLabel)
    : '—';
  const afterBookingLine = parts
    ? catalogLineWithoutVisitPrefix(parts.addressLine, visitLabel)
    : '—';
  const afterBookingRows =
    afterBookingLine && afterBookingLine !== '—'
      ? [{ label: 'Адрес', value: afterBookingLine }, ...(parts?.access ?? [])]
      : [...(parts?.access ?? [])];

  return (
    <SectionCard
      title="Адрес и как пройти"
      text="Здесь должно быть понятно не только куда ехать, но и как найти кабинет."
    >
      <AddressPreviewPanel
        title="На карточке"
        visitLabel={visitLabel}
        mainLine={catalogMain}
      />

      <AddressPreviewPanel
        title="После записи"
        hint="Подъезд, этаж и другие детали — только у клиента с записью"
        visitLabel={visitLabel}
        mode="detailed"
        detailRows={afterBookingRows}
        wayfinding={parts?.wayfinding}
      />

      <button
        type="button"
        onClick={onEditAddress}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98]"
      >
        Редактировать адрес
      </button>
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

function worksCountLabel(count: number): string {
  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} работ`;
  if (mod10 === 1) return `${n} работа`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} работы`;
  return `${n} работ`;
}

type OverflowMenuItem = {
  id: string;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
};

function CardOverflowMenu({ items, ariaLabel }: { items: OverflowMenuItem[]; ariaLabel: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-[0_4px_14px_rgba(17,17,17,0.12)] backdrop-blur-sm transition active:scale-[0.95]"
      >
        <IconMore className="h-[18px] w-[18px]" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[11.5rem] overflow-hidden rounded-[16px] bg-white py-1 shadow-[0_16px_40px_rgba(17,17,17,0.14)] ring-1 ring-black/[0.06]"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                setOpen(false);
                item.onClick();
              }}
              className={`flex min-h-11 w-full items-center px-4 text-left text-[14px] font-semibold transition active:bg-[#F1EFEF] disabled:opacity-40 ${
                item.tone === 'danger' ? 'text-red-600' : 'text-neutral-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TrustBlockHeader({
  title,
  description,
  countLabel,
}: {
  title: string;
  description: string;
  countLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 pr-1">
        <p className="text-[17px] font-semibold tracking-[-0.04em] text-neutral-950">{title}</p>
        <p className="mt-1 text-[13px] leading-snug text-neutral-500">{description}</p>
      </div>
      <span className="shrink-0 rounded-full bg-[#F1EFEF] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-neutral-500">
        {countLabel}
      </span>
    </div>
  );
}

function TrustEmptyPanel({
  title,
  subtitle,
  actionLabel,
  onAction,
  primaryAction,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  primaryAction?: boolean;
}) {
  return (
    <>
      <div className="mt-4 rounded-[20px] border border-dashed border-[#E8E4E4] bg-[#FAFAFA] px-4 py-7 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F1EFEF] text-neutral-400">
          <IconImagePlaceholder className="h-7 w-7" />
        </div>
        <p className="mt-3 text-[15px] font-semibold text-neutral-950">{title}</p>
        <p className="mx-auto mt-1.5 max-w-[16rem] text-[13px] leading-relaxed text-neutral-500">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className={`mt-3 flex min-h-11 w-full items-center justify-center rounded-full px-4 text-[14px] font-semibold transition active:scale-[0.98] ${
          primaryAction
            ? 'bg-[#E29595] text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)]'
            : 'bg-[#F1EFEF] text-neutral-900'
        }`}
      >
        {actionLabel}
      </button>
    </>
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
  onSetPortfolioCover,
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
  onSetPortfolioCover: (imageUrl: string) => void;
}) {
  const careerItems = normalizeCareerItems(draft);
  const certificates = draft.certificates ?? [];
  const portfolio = draft.portfolio ?? [];
  const coverPhoto = draft.photoUrl?.trim() ?? '';

  return (
    <div className="space-y-4">
      <section className="rounded-[22px] bg-white p-4 shadow-[0_12px_36px_rgba(17,17,17,0.07)] ring-1 ring-[#F1EFEF]">
        <TrustBlockHeader
          title="Работы"
          description="Добавьте фото работ, которые увидят клиенты в вашем профиле."
          countLabel={worksCountLabel(portfolio.length)}
        />
        {portfolio.length > 0 ? (
          <>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={onAddPortfolio}
                className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[13px] font-semibold text-neutral-900 transition active:scale-[0.98]"
              >
                + Добавить
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {portfolio.map((item, i) => {
                const imageUrl = item.imageUrl?.trim() ?? '';
                const isCover = Boolean(imageUrl && coverPhoto && imageUrl === coverPhoto);

                return (
                  <article
                    key={item.id}
                    className="relative overflow-hidden rounded-[18px] bg-[#F1EFEF] ring-1 ring-[#F1EFEF]"
                  >
                    <div className="absolute right-1.5 top-1.5 z-10">
                      <CardOverflowMenu
                        ariaLabel="Действия с работой"
                        items={[
                          {
                            id: 'cover',
                            label: isCover ? 'Уже обложка' : 'Сделать обложкой',
                            onClick: () => onSetPortfolioCover(imageUrl),
                            disabled: !imageUrl || isCover,
                          },
                          {
                            id: 'edit',
                            label: 'Редактировать',
                            onClick: () => onEditPortfolio(item.id),
                          },
                          {
                            id: 'delete',
                            label: 'Удалить',
                            onClick: () => onDeletePortfolio(item.id),
                            tone: 'danger',
                          },
                        ]}
                      />
                    </div>
                    {isCover ? (
                      <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-neutral-900/75 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Обложка
                      </span>
                    ) : null}
                    {imageUrl ? (
                      <ImageReveal
                        src={imageUrl}
                        alt=""
                        className="aspect-square w-full object-cover"
                        loading={i < 4 ? 'eager' : 'lazy'}
                        fetchPriority={i < 2 ? 'high' : 'low'}
                      />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center bg-white text-neutral-300">
                        <IconImagePlaceholder className="h-8 w-8" />
                      </div>
                    )}
                    {item.title?.trim() ? (
                      <div className="px-2.5 py-2">
                        <p className="truncate text-[12px] font-semibold text-neutral-800">{item.title}</p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
            <button
              type="button"
              onClick={onAddPortfolio}
              className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[14px] font-semibold text-neutral-900 transition active:scale-[0.98]"
            >
              + Добавить работу
            </button>
          </>
        ) : (
          <TrustEmptyPanel
            title="Пока нет работ"
            subtitle="Добавьте первые фото, чтобы клиенты могли оценить ваш стиль."
            actionLabel="+ Добавить работу"
            onAction={onAddPortfolio}
            primaryAction
          />
        )}
      </section>

      <section className="rounded-[20px] bg-white p-4 shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
        <TrustBlockHeader
          title="Сертификаты"
          description="Добавьте дипломы, курсы и документы, которые подтверждают ваш опыт."
          countLabel={String(certificates.length)}
        />
        {certificates.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {certificates.map((certificate, i) => (
              <li
                key={certificate.id}
                className="flex items-start gap-3 rounded-[18px] bg-[#F1EFEF] p-2.5 pr-1"
              >
                {certificate.imageUrl ? (
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-white">
                    <ImageReveal
                      src={certificate.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-white text-neutral-300">
                    <IconImagePlaceholder className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="text-[14px] font-semibold leading-snug text-neutral-950">{certificate.title}</p>
                  <p className="mt-0.5 text-[12px] font-medium text-neutral-500">
                    {certificate.issuer}
                    {certificate.year ? ` · ${certificate.year}` : ''}
                  </p>
                </div>
                <CardOverflowMenu
                  ariaLabel="Действия с сертификатом"
                  items={[
                    { id: 'edit', label: 'Редактировать', onClick: () => onEditCert(certificate.id) },
                    {
                      id: 'delete',
                      label: 'Удалить',
                      onClick: () => onDeleteCert(certificate.id),
                      tone: 'danger',
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          onClick={onAddCert}
          className="mt-3 flex min-h-10 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[13px] font-semibold text-neutral-900 transition active:scale-[0.98]"
        >
          + Добавить сертификат
        </button>
      </section>

      <section className="rounded-[20px] bg-white p-4 shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
        <TrustBlockHeader
          title="Опыт и образование"
          description="Расскажите, где обучались и сколько работаете в сфере."
          countLabel={String(careerItems.length)}
        />
        {careerItems.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {careerItems.map((item) => {
              const isLegacy = item.id === 'legacy-experience';

              return (
                <li key={item.id} className="rounded-[18px] bg-[#F1EFEF] p-3 pr-1">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                        {careerTypeLabel(item.type)}
                      </span>
                      <p className="mt-2 text-[15px] font-semibold leading-snug text-neutral-950">{item.title}</p>
                      {item.place ? (
                        <p className="mt-0.5 text-[13px] font-medium text-neutral-600">{item.place}</p>
                      ) : null}
                      {item.startYear || item.endYear ? (
                        <p className="mt-0.5 text-[12px] text-neutral-400">
                          {item.startYear || '—'} — {item.endYear || 'сейчас'}
                        </p>
                      ) : null}
                      {item.description ? (
                        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-neutral-500">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    {!isLegacy ? (
                      <CardOverflowMenu
                        ariaLabel="Действия с записью"
                        items={[
                          { id: 'edit', label: 'Редактировать', onClick: () => onEditCareer(item.id) },
                          {
                            id: 'delete',
                            label: 'Удалить',
                            onClick: () => onDeleteCareer(item.id),
                            tone: 'danger',
                          },
                        ]}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-neutral-500">Пока нет записей об опыте.</p>
        )}
        <button
          type="button"
          onClick={onAddCareer}
          className="mt-3 flex min-h-10 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[13px] font-semibold text-neutral-900 transition active:scale-[0.98]"
        >
          + Добавить опыт
        </button>
      </section>
    </div>
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
  onEditSchedule,
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
  onSetPortfolioCover,
}: {
  draft: MasterDraft;
  onEditMain: () => void;
  onEditSchedule: () => void;
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
  onSetPortfolioCover: (imageUrl: string) => void;
}) {
  const [activeSection, setActiveSection] = useState<ProfileSection>('main');

  const section = useMemo(() => {
    if (activeSection === 'address') {
      return <AddressSection draft={draft} onEditAddress={onEditAddress} />;
    }
    if (activeSection === 'portfolio') {
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
          onSetPortfolioCover={onSetPortfolioCover}
        />
      );
    }
    if (activeSection === 'rules') {
      return <RulesSection draft={draft} onEditRules={onEditRules} />;
    }
    return <MainSection draft={draft} onEditMain={onEditMain} onEditSchedule={onEditSchedule} />;
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
    onEditSchedule,
    onEditPortfolio,
    onEditRules,
    onSetPortfolioCover,
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
  if (sheet === 'schedule') return 'График работы';
  if (sheet === 'rules') return 'Правила записи';
  if (typeof sheet === 'object' && sheet.k === 'career') return sheet.id ? 'Опыт и образование' : 'Новая запись';
  if (typeof sheet === 'object' && sheet.k === 'portfolio') return sheet.id ? 'Работа' : 'Новая работа';
  if (typeof sheet === 'object' && sheet.k === 'del-career') return 'Удалить запись?';
  if (typeof sheet === 'object' && sheet.k === 'cert') return sheet.id ? 'Сертификат' : 'Новый сертификат';
  if (typeof sheet === 'object' && sheet.k === 'del-cert') return 'Удалить сертификат?';
  if (typeof sheet === 'object' && sheet.k === 'del-portfolio') return 'Удалить работу?';
  return undefined;
}

export function AdminProfileSection() {
  const {
    draft,
    persistDraft,
    flushDraftToBackend,
    flushScheduleToBackend,
    patchProfileToBackend,
    refreshDraft,
  } = useAdminMasterDraft();
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
        if (p && !p.startsWith('https://') && !p.startsWith('data:image/')) {
          setSheetApiError('Загрузите фото с устройства или укажите ссылку https://…');
          return;
        }
      }
      setSheetApiError(null);
      const next: MasterDraft = { ...draft, ...patch };
      try {
        await patchProfileToBackend({
          name: next.name,
          description: next.description,
          phone: next.phone,
          contact: next.contact,
          contacts: next.contacts,
          photoUrl: next.photoUrl,
          category: next.category,
          primaryCategoryId: next.primaryCategoryId,
          primaryCategoryCode: next.primaryCategoryCode,
        });
        if (useCabinetApi) await refreshDraft();
        closeSheet();
        showSaved();
      } catch (e) {
        setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
    },
    [closeSheet, draft, patchProfileToBackend, refreshDraft, showSaved, useCabinetApi],
  );

  const setPortfolioCover = useCallback(
    async (imageUrl: string) => {
      const photoUrl = imageUrl.trim();
      if (!photoUrl) return;
      setSheetApiError(null);
      const next: MasterDraft = { ...draft, photoUrl };
      try {
        if (useCabinetApi) {
          await patchProfileToBackend({
            name: next.name,
            description: next.description,
            phone: next.phone,
            contact: next.contact,
            contacts: next.contacts,
            photoUrl: next.photoUrl,
            category: next.category,
            primaryCategoryId: next.primaryCategoryId,
            primaryCategoryCode: next.primaryCategoryCode,
          });
          await refreshDraft();
        } else {
          persistDraft(next);
        }
        showSaved();
      } catch (e) {
        setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
    },
    [draft, patchProfileToBackend, persistDraft, refreshDraft, showSaved, useCabinetApi],
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

  const saveSchedule = useCallback(
    async (schedule: MasterDraft['schedule']) => {
      setSheetApiError(null);
      const next = { ...draft, schedule };
      if (!useCabinetApi) {
        persistDraft(next);
        closeSheet();
        showSaved();
        return;
      }
      try {
        await flushScheduleToBackend(next);
        closeSheet();
        showSaved();
      } catch (e) {
        setSheetApiError(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
    },
    [closeSheet, draft, flushScheduleToBackend, persistDraft, showSaved, useCabinetApi],
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
      return (
        <SheetMainInfo
          draft={draft}
          onSave={saveMain}
          onCancel={closeSheet}
          uploadHeroPhoto={useCabinetApi ? uploadMasterHeroPhotoFromDataUrl : undefined}
        />
      );
    }

    if (sheet === 'address') {
      return <SheetAddress draft={draft} onSave={saveLocation} onCancel={closeSheet} />;
    }

    if (sheet === 'schedule') {
      return <SheetSchedule draft={draft} onSave={saveSchedule} onCancel={closeSheet} />;
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
          uploadImage={useCabinetApi ? uploadMasterCertificateImageFile : undefined}
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
          uploadImage={useCabinetApi ? uploadMasterPortfolioImageFile : undefined}
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
    saveSchedule,
    sheet,
    useCabinetApi,
  ]);

  return (
    <div className="px-4 pb-10">
      <header className="pt-1">
        <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.065em] text-neutral-950">Кабинет мастера</h1>
      </header>

      <section className="relative mt-5">
        <AdminProfileReadView
          draft={draft}
          onEditMain={() => setSheet('main')}
          onEditSchedule={() => setSheet('schedule')}
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
          onSetPortfolioCover={setPortfolioCover}
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
