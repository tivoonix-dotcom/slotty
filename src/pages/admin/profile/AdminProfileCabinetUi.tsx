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

/** РРєРѕРЅРєР° СЃРµРєС†РёРё: РјСЏРіРєРёР№ РєРІР°РґСЂР°С‚, РµРґРёРЅС‹Р№ РЅР°Р±РѕСЂ SVG. */
function CabinetSectionIcon({ name, size = 18 }: { name: CabinetIconName; size?: number }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F4] text-[#F47C8C]">
      <CabinetIcon name={name} size={size} />
    </span>
  );
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
    return { value: 'РќРѕРІС‹Р№', label: 'Р РµР№С‚РёРЅРі', empty: true };
  }
  return { value: rating.toFixed(1), label: 'Р РµР№С‚РёРЅРі', empty: false };
}

function buildBookingsStat(appointments: DemoMasterAppointment[]): StatMiniDisplay {
  const count = appointments.length;
  return {
    value: String(count),
    label: 'Р—Р°РїРёСЃРё',
    empty: count <= 0,
  };
}

/** Р”РѕР»СЏ Р·Р°РІРµСЂС€С‘РЅРЅС‹С… СЃСЂРµРґРё Р·Р°РІРµСЂС€С‘РЅРЅС‹С… Рё РѕС‚РјРµРЅС‘РЅРЅС‹С… вЂ” С‚РѕР»СЊРєРѕ РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ РІ РєР°Р±РёРЅРµС‚Рµ. */
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
    return { value: 'РџРѕРєР° РЅРµС‚', label: 'РљР»РёРµРЅС‚С‹', empty: true };
  }
  return { value: `${percent}%`, label: 'Р”РѕРІРѕР»СЊРЅС‹Рµ РєР»РёРµРЅС‚С‹', empty: false };
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
  const photoSrc = (draft.photoUrl && draft.photoUrl.trim()) || defaultMasterAvatarUrl(draft.name || 'РњР°СЃС‚РµСЂ');
  const displayName = draft.name.trim() || 'РњР°СЃС‚РµСЂ';

  return (
    <section className={`${cabinetCard} relative z-0 rounded-t-none border-t-0 shadow-none`}>
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#F7F7F8]">
        <ImageReveal
          src={photoSrc}
          alt=""
          width={640}
          height={360}
          className="h-full w-full object-cover"
          onError={(event) => {
            (event.target as HTMLImageElement).src = defaultMasterAvatarUrl(draft.name || 'РњР°СЃС‚РµСЂ');
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
                (event.target as HTMLImageElement).src = defaultMasterAvatarUrl(draft.name || 'РњР°СЃС‚РµСЂ');
              }}
            />
          </div>
        </div>

        <div className="mt-3 text-center">
          <h2 className="text-[clamp(18px,4.5vw,22px)] font-semibold leading-tight tracking-[-0.04em] text-balance text-[#111827]">
            {displayName}
          </h2>
          <span className="mt-2 inline-flex rounded-full bg-[#FFF1F4] px-3.5 py-1 text-[12px] font-semibold text-[#F47C8C]">
            РњР°СЃС‚РµСЂ
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
 * РќРёР¶РЅРёР№ РєСЂР°Р№ С€Р°РїРєРё: pt + min-h + pb + border-b-2 (СЃРј. AdminLayout).
 * Р”РѕР»Р¶РµРЅ СЃРѕРІРїР°РґР°С‚СЊ С‚РѕС‡РЅРѕ, РёРЅР°С‡Рµ РїСЂРё sticky С‚Р°Р±С‹ В«РїСЂС‹РіР°СЋС‚В» РІРІРµСЂС….
 */
/** РЎРѕРІРїР°РґР°РµС‚ СЃ СЂРµР°Р»СЊРЅРѕР№ РІС‹СЃРѕС‚РѕР№ С€Р°РїРєРё (AdminLayout + ResizeObserver). */
export const CABINET_HEADER_STICKY_TOP = 'var(--slotty-admin-header-h, 4.5rem)';

export function SectionTabs({
  active,
  onChange,
}: {
  active: ProfileSectionId;
  onChange: (section: ProfileSectionId) => void;
}) {
  const tabs: Array<{ id: ProfileSectionId; label: string; icon: ReactNode }> = [
    { id: 'main', label: 'РџСЂРѕС„РёР»СЊ', icon: <CabinetIcon name="user" size={22} /> },
    { id: 'portfolio', label: 'РџРѕСЂС‚С„РѕР»РёРѕ', icon: <CabinetIcon name="photo" size={22} /> },
    { id: 'address', label: 'РђРґСЂРµСЃ', icon: <CabinetIcon name="map-pin" size={22} /> },
    { id: 'rules', label: 'РџСЂР°РІРёР»Р°', icon: <CabinetIcon name="rules" size={22} /> },
  ];

  return (
    <nav
      className="flex h-[68px] w-full items-stretch gap-0.5 rounded-[24px] border border-[#EAECEF]/80 bg-white px-1.5 py-1.5 shadow-[0_12px_40px_rgba(17,24,39,0.12)]"
      aria-label="Р Р°Р·РґРµР»С‹ РїСЂРѕС„РёР»СЏ"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[18px] px-1 py-1.5 transition duration-200 active:scale-[0.96] ${
              selected
                ? 'bg-[#FFF1F4] text-[#F47C8C]'
                : 'text-[#9CA3AF] hover:bg-[#FFF1F4]/60'
            }`}
          >
            {tab.icon}
            <span
              className={`max-w-full truncate text-[10px] font-semibold leading-none sm:text-[11px] ${
                selected ? 'text-[#F47C8C]' : ''
              }`}
            >
              {tab.label}
            </span>
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
  return trimmed || 'вЂ”';
}

export function MainInfoCard({ draft, onEdit }: { draft: MasterDraft; onEdit: () => void }) {
  const telegramRow = contactRowsFromDraft(draft).find((r) => r.type === 'telegram' && r.value.trim());
  const telegram = telegramRow?.value ?? (draft.contact.trim() && draft.contact.includes('@') ? draft.contact : '');

  return (
    <section className={`${cabinetCard} ${cabinetCardPad}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">РћСЃРЅРѕРІРЅР°СЏ РёРЅС„РѕСЂРјР°С†РёСЏ</h2>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#FFF1F4] px-3.5 text-[13px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]"
        >
          <CabinetIcon name="pencil" size={16} />
          Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <InfoGridCell
          label="РРјСЏ Рё С„Р°РјРёР»РёСЏ"
          value={valueOrDash(draft.name)}
          icon={<CabinetIcon name="user" size={18} />}
        />
        <InfoGridCell
          label="РљР°С‚РµРіРѕСЂРёСЏ"
          value={valueOrDash(draft.category)}
          icon={<CabinetIcon name="tag" size={18} />}
        />
        <InfoGridCell
          label="РўРµР»РµС„РѕРЅ"
          value={valueOrDash(draft.phone)}
          icon={
            draft.phone?.trim() ? (
              <BY title="Р‘РµР»Р°СЂСѓСЃСЊ" className="h-[18px] w-[18px] rounded-full object-cover" />
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
          <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Рћ СЃРµР±Рµ</h2>
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
  const preview = formatScheduleClientPreview(draft.schedule).replace(/^РљР»РёРµРЅС‚С‹ СЃРјРѕРіСѓС‚ Р·Р°РїРёСЃС‹РІР°С‚СЊСЃСЏ:\s*/i, '');

  return (
    <section className={`${cabinetCard} ${cabinetCardPad}`}>
      <div className="flex items-center gap-3">
        <CabinetSectionIcon name="clock" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Р“СЂР°С„РёРє СЂР°Р±РѕС‚С‹</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">
            РљР»РёРµРЅС‚С‹ СЃРјРѕРіСѓС‚ Р·Р°РїРёСЃС‹РІР°С‚СЊСЃСЏ {preview || 'вЂ”'}
          </p>
        </div>
      </div>

      <div
        className="mt-3 grid grid-cols-7 gap-1 rounded-xl bg-[#F7F7F8] p-1"
        role="list"
        aria-label="Р Р°Р±РѕС‡РёРµ РґРЅРё РЅРµРґРµР»Рё"
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
        РР·РјРµРЅРёС‚СЊ РіСЂР°С„РёРє СЂР°Р±РѕС‚С‹
      </button>
    </section>
  );
}
export { ADMIN_SERVICES_PATH };
