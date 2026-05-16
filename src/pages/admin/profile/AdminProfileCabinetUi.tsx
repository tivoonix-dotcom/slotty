import type { ReactNode } from 'react';
import { BY } from 'country-flag-icons/react/1x1';
import { CabinetIcon, type CabinetIconName } from './cabinetIcons';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  defaultMasterAvatarUrl,
  formatScheduleClientPreview,
  WEEKDAY_LABELS_SHORT,
} from '../../../features/master/model/masterDraftStorage';
import { contactRowsFromDraft } from '../../../features/master-onboarding/model/masterContacts';
import { ContactChannelBrandIcon } from '../../master-onboarding/MasterProfileContactsBlock';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { cabinetCard, cabinetCardPad, cabinetIconCircle, cabinetPinkBtn } from './adminProfileCabinetTheme';

const PROFILE_COMPLETE_IMAGE_SRC = '/photos/SUCCE.webp';

/** Иконка секции: мягкий квадрат, единый набор SVG. */
function CabinetSectionIcon({ name, size = 18 }: { name: CabinetIconName; size?: number }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F4] text-[#F47C8C]">
      <CabinetIcon name={name} size={size} />
    </span>
  );
}

function CompletionStatusIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] ring-1 ring-[#FDE8ED]"
        aria-hidden
      >
        <CabinetIcon name="check" size={12} />
      </span>
    );
  }
  return <span className="h-5 w-5 shrink-0 rounded-full border-2 border-[#E5E7EB] bg-white" aria-hidden />;
}

export function CabinetPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[460px] bg-white pb-[calc(2rem+env(safe-area-inset-bottom,0px))] text-[#111827]">
      {children}
    </div>
  );
}

export type StatMiniDisplay = {
  value: string;
  label: string;
  empty: boolean;
};

export type ProfileStats = {
  rating: StatMiniDisplay;
  bookings: StatMiniDisplay;
  happy: StatMiniDisplay;
};

export type ProfileStatsRatingMeta = {
  rating?: number | null;
  reviewsCount?: number | null;
};

function buildRatingStat(meta?: ProfileStatsRatingMeta): StatMiniDisplay {
  const reviews = meta?.reviewsCount ?? 0;
  const rating = meta?.rating ?? 0;
  const hasRating = reviews > 0 && Number.isFinite(rating) && rating > 0;
  if (!hasRating) {
    return { value: 'Новый', label: 'Рейтинг', empty: true };
  }
  return { value: rating.toFixed(1), label: 'Рейтинг', empty: false };
}

function buildBookingsStat(appointments: DemoMasterAppointment[]): StatMiniDisplay {
  const count = appointments.length;
  return {
    value: String(count),
    label: 'Записи',
    empty: count <= 0,
  };
}

/** Доля завершённых среди завершённых и отменённых — только для отображения в кабинете. */
function computeHappyClientsPercent(appointments: DemoMasterAppointment[]): number | null {
  const completed = appointments.filter((a) => a.status === 'completed').length;
  if (completed <= 0) return null;
  const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
  const finished = completed + cancelled;
  if (finished <= 0) return null;
  return Math.round((completed / finished) * 100);
}

function buildHappyStat(appointments: DemoMasterAppointment[]): StatMiniDisplay {
  const percent = computeHappyClientsPercent(appointments);
  if (percent == null) {
    return { value: 'Пока нет', label: 'Клиенты', empty: true };
  }
  return { value: `${percent}%`, label: 'Довольные клиенты', empty: false };
}

export function buildProfileStats(
  appointments: DemoMasterAppointment[],
  ratingMeta?: ProfileStatsRatingMeta,
): ProfileStats {
  return {
    rating: buildRatingStat(ratingMeta),
    bookings: buildBookingsStat(appointments),
    happy: buildHappyStat(appointments),
  };
}

function StatMiniCard({ icon, label, value, empty }: StatMiniDisplay & { icon: ReactNode }) {
  const compactValue = empty && value.length > 5;
  const compactLabel = label.length > 11;
  return (
    <div className="flex min-h-[108px] min-w-0 flex-1 flex-col items-center rounded-[20px] bg-[#F7F7F8] px-1.5 py-3.5 shadow-[0_4px_16px_rgba(17,24,39,0.04)]">
      <span className={`${cabinetIconCircle} h-9 w-9`}>{icon}</span>
      <p
        className={`mt-2 flex min-h-[22px] max-w-full items-center justify-center px-0.5 text-center font-semibold tabular-nums leading-tight tracking-[-0.03em] ${
          empty ? 'text-[#9CA3AF]' : 'text-[#111827]'
        } ${compactValue ? 'text-[12px]' : empty ? 'text-[15px]' : 'text-[18px] leading-none'}`}
      >
        {value}
      </p>
      <p
        className={`mt-1 flex min-h-[26px] max-w-full items-start justify-center px-0.5 text-center font-medium leading-tight text-[#6B7280] ${
          compactLabel ? 'text-[10px]' : 'text-[11px]'
        }`}
      >
        {label}
      </p>
    </div>
  );
}

export function AdminProfileHero({ draft, stats }: { draft: MasterDraft; stats: ProfileStats }) {
  const photoSrc = (draft.photoUrl && draft.photoUrl.trim()) || defaultMasterAvatarUrl(draft.name || 'Мастер');
  const displayName = draft.name.trim() || 'Мастер';

  return (
    <section className={`${cabinetCard} overflow-hidden`}>
      <div className="relative aspect-[16/9] w-full bg-[#F7F7F8]">
        <ImageReveal
          src={photoSrc}
          alt=""
          width={640}
          height={360}
          className="h-full w-full object-cover"
          onError={(event) => {
            (event.target as HTMLImageElement).src = defaultMasterAvatarUrl(draft.name || 'Мастер');
          }}
        />
      </div>

      <div className="relative px-4 pb-5 pt-0">
        <div className="-mt-11 flex justify-center">
          <div className="relative h-[88px] w-[88px] overflow-hidden rounded-full bg-white ring-4 ring-white shadow-[0_8px_24px_rgba(17,24,39,0.1)]">
            <ImageReveal
              src={photoSrc}
              alt=""
              width={176}
              height={176}
              className="h-full w-full object-cover"
              onError={(event) => {
                (event.target as HTMLImageElement).src = defaultMasterAvatarUrl(draft.name || 'Мастер');
              }}
            />
          </div>
        </div>

        <div className="mt-3 text-center">
          <h2 className="text-[clamp(18px,4.5vw,22px)] font-semibold leading-tight tracking-[-0.04em] text-balance text-[#111827]">
            {displayName}
          </h2>
          <span className="mt-2 inline-flex rounded-full bg-[#FFF1F4] px-3.5 py-1 text-[12px] font-semibold text-[#F47C8C]">
            Мастер
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <StatMiniCard icon={<CabinetIcon name="star" size={18} />} {...stats.rating} />
          <StatMiniCard icon={<CabinetIcon name="calendar" size={18} />} {...stats.bookings} />
          <StatMiniCard icon={<CabinetIcon name="heart" size={18} />} {...stats.happy} />
        </div>
      </div>
    </section>
  );
}

export type ProfileSectionId = 'main' | 'address' | 'portfolio' | 'rules';

/**
 * Нижний край шапки: pt + min-h + pb + border-b-2 (см. AdminLayout).
 * Должен совпадать точно, иначе при sticky табы «прыгают» вверх.
 */
export const CABINET_HEADER_STICKY_TOP =
  'var(--slotty-admin-header-h, calc(0.5rem + env(safe-area-inset-top, 0px) + 3.25rem + 0.5rem + 2px))';

export function SectionTabs({
  active,
  onChange,
}: {
  active: ProfileSectionId;
  onChange: (section: ProfileSectionId) => void;
}) {
  const tabs: Array<{ id: ProfileSectionId; label: string; icon: ReactNode }> = [
    { id: 'main', label: 'Профиль', icon: <CabinetIcon name="user" size={18} /> },
    { id: 'portfolio', label: 'Портфолио', icon: <CabinetIcon name="photo" size={18} /> },
    { id: 'address', label: 'Адрес', icon: <CabinetIcon name="map-pin" size={18} /> },
    { id: 'rules', label: 'Правила', icon: <CabinetIcon name="rules" size={18} /> },
  ];

  return (
    <nav className="flex bg-white px-1 pb-0 pt-0" aria-label="Разделы профиля">
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex min-w-0 flex-1 flex-col items-center gap-0 px-1 pb-1 pt-0 transition active:scale-[0.98] ${
              selected ? 'text-[#F47C8C]' : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <span className="max-w-full truncate text-[10px] font-semibold leading-none sm:text-[11px]">
              {tab.label}
            </span>
            {tab.icon}
            {selected ? (
              <span
                className="absolute bottom-0 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-[#F47C8C]"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function InfoGridCell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-[#F7F7F8] p-3">
      <span className={`${cabinetIconCircle} h-9 w-9`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium leading-tight text-[#6B7280]">{label}</p>
        <p className="mt-0.5 truncate text-[15px] font-semibold leading-snug text-[#111827]" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

function valueOrDash(value?: string | null): string {
  const trimmed = value?.trim() ?? '';
  return trimmed || '—';
}

export function MainInfoCard({ draft, onEdit }: { draft: MasterDraft; onEdit: () => void }) {
  const telegramRow = contactRowsFromDraft(draft).find((r) => r.type === 'telegram' && r.value.trim());
  const telegram = telegramRow?.value ?? (draft.contact.trim() && draft.contact.includes('@') ? draft.contact : '');

  return (
    <section className={`${cabinetCard} ${cabinetCardPad}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Основная информация</h2>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#FFF1F4] px-3.5 text-[13px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]"
        >
          <CabinetIcon name="pencil" size={16} />
          Редактировать
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <InfoGridCell
          label="Имя и фамилия"
          value={valueOrDash(draft.name)}
          icon={<CabinetIcon name="user" size={18} />}
        />
        <InfoGridCell
          label="Категория"
          value={valueOrDash(draft.category)}
          icon={<CabinetIcon name="tag" size={18} />}
        />
        <InfoGridCell
          label="Телефон"
          value={valueOrDash(draft.phone)}
          icon={
            draft.phone?.trim() ? (
              <BY title="Беларусь" className="h-[18px] w-[18px] rounded-full object-cover" />
            ) : (
              <CabinetIcon name="phone" size={18} />
            )
          }
        />
        <InfoGridCell
          label="Telegram"
          value={valueOrDash(telegram)}
          icon={
            telegramRow ? (
              <ContactChannelBrandIcon type="telegram" className="h-[18px] w-[18px]" />
            ) : (
              <CabinetIcon name="send" size={18} />
            )
          }
        />
      </div>
    </section>
  );
}

export function AboutCard({ description }: { description: string }) {
  const text = valueOrDash(description);
  return (
    <section className={`${cabinetCard} ${cabinetCardPad}`}>
      <div className="flex items-start gap-3">
        <span className={cabinetIconCircle}>
          <CabinetIcon name="chat" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">О себе</h2>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[#6B7280]">{text}</p>
        </div>
      </div>
    </section>
  );
}

export function ScheduleWorkCard({
  draft,
  onEditSchedule,
}: {
  draft: MasterDraft;
  onEditSchedule: () => void;
}) {
  const workDays = new Set(draft.schedule.workDays);
  const preview = formatScheduleClientPreview(draft.schedule).replace(/^Клиенты смогут записываться:\s*/i, '');

  return (
    <section className={`${cabinetCard} ${cabinetCardPad}`}>
      <div className="flex items-center gap-3">
        <CabinetSectionIcon name="clock" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">График работы</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">
            Клиенты смогут записываться {preview || '—'}
          </p>
        </div>
      </div>

      <div
        className="mt-3 grid grid-cols-7 gap-1 rounded-xl bg-[#F7F7F8] p-1"
        role="list"
        aria-label="Рабочие дни недели"
      >
        {WEEKDAY_LABELS_SHORT.map((label, day) => {
          const active = workDays.has(day);
          return (
            <div
              key={label}
              role="listitem"
              className={`flex h-8 items-center justify-center rounded-lg text-[11px] font-semibold ${
                active
                  ? 'bg-white text-[#111827] shadow-[0_1px_3px_rgba(17,24,39,0.05)]'
                  : 'text-[#9CA3AF]'
              }`}
            >
              {label}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onEditSchedule}
        className={`mt-4 flex min-h-11 w-full items-center justify-center rounded-2xl text-[15px] font-semibold transition ${cabinetPinkBtn}`}
      >
        Изменить график работы
      </button>
    </section>
  );
}

export type CompletionItem = {
  id: string;
  label: string;
  done: boolean;
  onPress: () => void;
};

export function computeProfileCompletion(draft: MasterDraft): { percent: number; items: CompletionItem[] } {
  const items: Omit<CompletionItem, 'onPress'>[] = [
    {
      id: 'main',
      label: 'Основная информация',
      done: Boolean(draft.name?.trim() && draft.phone?.trim() && draft.category?.trim()),
    },
    {
      id: 'portfolio',
      label: 'Портфолио',
      done: (draft.portfolio?.length ?? 0) > 0,
    },
    {
      id: 'services',
      label: 'Услуги и цены',
      done: (draft.services?.length ?? 0) > 0,
    },
    {
      id: 'schedule',
      label: 'График работы',
      done: (draft.schedule?.workDays?.length ?? 0) > 0,
    },
  ];
  const doneCount = items.filter((i) => i.done).length;
  const percent = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  return { percent, items: items as CompletionItem[] };
}

export function ProfileCompletionCard({
  percent,
  items,
}: {
  percent: number;
  items: CompletionItem[];
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const isComplete = clamped >= 100;

  return (
    <section className={`${cabinetCard} ${cabinetCardPad}`}>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Завершение профиля</h2>
        <span className="text-[15px] font-semibold tabular-nums text-[#F47C8C]">{clamped}%</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F7F7F8]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#F47C8C] to-[#F26D83] transition-[width] duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>

      {isComplete ? (
        <div className="mt-4 overflow-hidden rounded-[20px] bg-[#FFF1F4] ring-1 ring-[#FDE8ED]">
          <img
            src={PROFILE_COMPLETE_IMAGE_SRC}
            alt=""
            width={800}
            height={600}
            decoding="async"
            className="block w-full object-cover"
          />
          <p className="px-3 py-2.5 text-center text-[13px] font-medium leading-snug text-[#6B7280]">
            Профиль полностью готов — клиенты могут записываться
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-[#EAECEF]">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={item.onPress}
                className="flex min-h-[48px] w-full items-center gap-3 py-2 text-left transition hover:bg-[#FAFAFB] active:scale-[0.995]"
              >
                <CompletionStatusIcon done={item.done} />
                <span
                  className={`min-w-0 flex-1 text-[15px] font-medium ${
                    item.done ? 'text-[#6B7280]' : 'text-[#111827]'
                  }`}
                >
                  {item.label}
                </span>
                <CabinetIcon name="chevron-right" size={16} className="shrink-0 text-[#9CA3AF]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function wireCompletionActions(
  draft: MasterDraft,
  handlers: {
    onEditMain: () => void;
    onGoPortfolio: () => void;
    onGoServices: () => void;
    onEditSchedule: () => void;
  },
): { percent: number; items: CompletionItem[] } {
  const { percent, items } = computeProfileCompletion(draft);
  const actionById: Record<string, () => void> = {
    main: handlers.onEditMain,
    portfolio: handlers.onGoPortfolio,
    services: handlers.onGoServices,
    schedule: handlers.onEditSchedule,
  };
  return {
    percent,
    items: items.map((item) => ({
      ...item,
      onPress: actionById[item.id] ?? handlers.onEditMain,
    })),
  };
}

export { ADMIN_SERVICES_PATH };
