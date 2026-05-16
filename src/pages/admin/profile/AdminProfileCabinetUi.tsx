import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  HiArrowLeft,
  HiCalendar,
  HiChatBubbleLeft,
  HiCheckCircle,
  HiChevronRight,
  HiClock,
  HiCog6Tooth,
  HiFaceSmile,
  HiMapPin,
  HiPaperAirplane,
  HiPencil,
  HiPhone,
  HiRectangleStack,
  HiStar,
  HiUser,
  HiDocumentText,
} from 'react-icons/hi2';
import { BY } from 'country-flag-icons/react/1x1';
import { HUB_PATH, ADMIN_SERVICES_PATH } from '../../../app/paths';
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

export function CabinetPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[460px] bg-white pb-[calc(2rem+env(safe-area-inset-bottom,0px))] text-[#111827]">
      {children}
    </div>
  );
}

export function CabinetPageHeader({ onSettings }: { onSettings: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white/95 px-4 pb-3 pt-[calc(0.35rem+env(safe-area-inset-top,0px))] backdrop-blur-md">
      <Link
        to={HUB_PATH}
        aria-label="Назад"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7F7F8] text-[#111827] transition hover:bg-[#F3F4F6] active:scale-[0.97]"
      >
        <HiArrowLeft className="h-5 w-5" strokeWidth={2} />
      </Link>
      <h1 className="flex-1 text-center text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">
        Кабинет мастера
      </h1>
      <button
        type="button"
        onClick={onSettings}
        aria-label="Редактировать профиль"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7F7F8] text-[#111827] transition hover:bg-[#F3F4F6] active:scale-[0.97]"
      >
        <HiCog6Tooth className="h-5 w-5" strokeWidth={2} />
      </button>
    </header>
  );
}

type ProfileStats = {
  ratingLabel: string;
  bookingsLabel: string;
  happyLabel: string;
};

function formatRating(): string {
  return '—';
}

export function buildProfileStats(appointments: DemoMasterAppointment[]): ProfileStats {
  const completed = appointments.filter((a) => a.status === 'completed').length;
  return {
    ratingLabel: formatRating(),
    bookingsLabel: appointments.length > 0 ? String(appointments.length) : '—',
    happyLabel: completed > 0 ? String(completed) : '—',
  };
}

function StatMiniCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-[20px] bg-[#F7F7F8] px-2 py-3.5 shadow-[0_4px_16px_rgba(17,24,39,0.04)]">
      <span className={`${cabinetIconCircle} h-9 w-9`}>{icon}</span>
      <p className="mt-2 text-[18px] font-semibold tabular-nums leading-none tracking-[-0.03em] text-[#111827]">
        {value}
      </p>
      <p className="mt-1 text-center text-[11px] font-medium leading-tight text-[#6B7280]">{label}</p>
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
          <StatMiniCard icon={<HiStar className="h-[18px] w-[18px]" />} label="Рейтинг" value={stats.ratingLabel} />
          <StatMiniCard
            icon={<HiCalendar className="h-[18px] w-[18px]" />}
            label="Записи"
            value={stats.bookingsLabel}
          />
          <StatMiniCard
            icon={<HiFaceSmile className="h-[18px] w-[18px]" />}
            label="Довольные клиенты"
            value={stats.happyLabel}
          />
        </div>
      </div>
    </section>
  );
}

export type ProfileSectionId = 'main' | 'address' | 'portfolio' | 'rules';

export function SectionTabs({
  active,
  onChange,
}: {
  active: ProfileSectionId;
  onChange: (section: ProfileSectionId) => void;
}) {
  const tabs: Array<{ id: ProfileSectionId; label: string; icon: ReactNode }> = [
    { id: 'main', label: 'Профиль', icon: <HiUser className="h-[18px] w-[18px]" strokeWidth={2} /> },
    { id: 'portfolio', label: 'Портфолио', icon: <HiRectangleStack className="h-[18px] w-[18px]" strokeWidth={2} /> },
    { id: 'address', label: 'Адрес', icon: <HiMapPin className="h-[18px] w-[18px]" strokeWidth={2} /> },
    { id: 'rules', label: 'Правила', icon: <HiDocumentText className="h-[18px] w-[18px]" strokeWidth={2} /> },
  ];

  return (
    <div className={`${cabinetCard} p-1.5`}>
      <div className="flex">
        {tabs.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[18px] px-1 py-2 transition active:scale-[0.98] ${
                selected ? 'text-[#F47C8C]' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {tab.icon}
              <span className="max-w-full truncate text-[10px] font-semibold leading-tight sm:text-[11px]">
                {tab.label}
              </span>
              {selected ? (
                <span
                  className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[#F47C8C]"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
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
    <div className="rounded-[18px] bg-[#F7F7F8] p-3.5">
      <span className={cabinetIconCircle}>{icon}</span>
      <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">{label}</p>
      <p className="mt-1 text-[15px] font-semibold leading-snug text-[#111827]">{value}</p>
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
          <HiPencil className="h-4 w-4" strokeWidth={2} />
          Редактировать
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <InfoGridCell
          label="Имя и фамилия"
          value={valueOrDash(draft.name)}
          icon={<HiUser className="h-[18px] w-[18px]" strokeWidth={2} />}
        />
        <InfoGridCell
          label="Категория"
          value={valueOrDash(draft.category)}
          icon={<HiRectangleStack className="h-[18px] w-[18px]" strokeWidth={2} />}
        />
        <InfoGridCell
          label="Телефон"
          value={valueOrDash(draft.phone)}
          icon={
            draft.phone?.trim() ? (
              <BY title="Беларусь" className="h-[18px] w-[18px] rounded-full object-cover" />
            ) : (
              <HiPhone className="h-[18px] w-[18px]" strokeWidth={2} />
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
              <HiPaperAirplane className="h-[18px] w-[18px]" strokeWidth={2} />
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
          <HiChatBubbleLeft className="h-5 w-5" strokeWidth={2} />
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
      <div className="flex items-start gap-3">
        <span className={cabinetIconCircle}>
          <HiClock className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">График работы</h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#6B7280]">
            Клиенты смогут записываться {preview || '—'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {WEEKDAY_LABELS_SHORT.map((label, day) => {
          const active = workDays.has(day);
          return (
            <span
              key={label}
              className={`inline-flex min-h-8 min-w-[2.25rem] items-center justify-center rounded-full px-2.5 text-[12px] font-semibold ${
                active
                  ? 'bg-[#FFF1F4] text-[#F47C8C]'
                  : 'bg-[#F7F7F8] text-[#9CA3AF]'
              }`}
            >
              {label}
            </span>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onEditSchedule}
        className={`mt-5 flex min-h-[52px] w-full items-center justify-center rounded-2xl text-[16px] font-semibold transition ${cabinetPinkBtn}`}
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
  return (
    <section className={`${cabinetCard} ${cabinetCardPad}`}>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Завершение профиля</h2>
        <span className="text-[15px] font-semibold tabular-nums text-[#F47C8C]">{percent}%</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F7F7F8]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#F47C8C] to-[#F26D83] transition-[width] duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>

      <ul className="mt-4 divide-y divide-[#EAECEF]">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={item.onPress}
              className="flex min-h-[52px] w-full items-center gap-3 py-2 text-left transition hover:bg-[#FAFAFB] active:scale-[0.995]"
            >
              {item.done ? (
                <HiCheckCircle className="h-5 w-5 shrink-0 text-emerald-500" strokeWidth={2} />
              ) : (
                <span
                  className="h-5 w-5 shrink-0 rounded-full border-2 border-[#D1D5DB]"
                  aria-hidden
                />
              )}
              <span
                className={`min-w-0 flex-1 text-[15px] font-medium ${
                  item.done ? 'text-[#6B7280]' : 'text-[#111827]'
                }`}
              >
                {item.label}
              </span>
              <HiChevronRight className="h-5 w-5 shrink-0 text-[#9CA3AF]" strokeWidth={2} />
            </button>
          </li>
        ))}
      </ul>
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
