import type { ReactNode } from 'react';
import {
  EMPTY_ABOUT,
  EMPTY_CONTACTS,
  EMPTY_METRIC,
  EMPTY_SCHEDULE_PREVIEW,
  valueOrEmptyField,
} from '../../../shared/lib/emptyDisplayText';
import { BY } from 'country-flag-icons/react/1x1';
import { AboutDescriptionText } from './AboutDescriptionText';
import { CabinetIcon } from './cabinetIcons';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  formatScheduleClientPreview,
  WEEKDAY_LABELS_SHORT,
} from '../../../features/master/model/masterDraftStorage';
import { resolveFilledContacts } from '../../../features/master-onboarding/model/masterContacts';
import { MasterContactsChips } from '../../master-onboarding/MasterContactsChips';
import { HiCamera } from 'react-icons/hi2';
import { MasterCabinetAvatar, MasterCabinetCoverBanner } from './adminProfilePortrait';
import { useAccountVerificationStatus } from '../../../features/auth/hooks/useAccountVerificationStatus';
import { useAuth } from '../../../features/auth/AuthProvider';
import { MasterVerificationStatusBadge } from '../../../shared/ui/MasterVerificationStatusBadge';
import { resolveCoverUrl, useMasterCoverUpload } from './masterProfileCover';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  cabinetCard,
  cabinetCardPad,
  cabinetIconCircle,
  cabinetInsetTile,
} from './adminProfileCabinetTheme';

export function CabinetPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 min-w-0 w-auto bg-[#F5F5F5] pb-[calc(2rem+env(safe-area-inset-bottom,0px))] text-[#111827] lg:mx-0 lg:w-full lg:max-w-none lg:bg-transparent lg:pb-0">
      <div className="px-4 lg:px-0">{children}</div>
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
  completedBookingsCount?: number | null;
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
  if (count <= 0) {
    return { value: EMPTY_METRIC, label: 'Записи', empty: true };
  }
  return {
    value: String(count),
    label: 'Записи',
    empty: false,
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
    <div className={`flex min-h-[108px] min-w-0 flex-1 flex-col items-center px-1.5 py-3.5 ${cabinetInsetTile}`}>
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

export function AdminProfileHero({
  draft,
  stats,
  bottomSlot,
}: {
  draft: MasterDraft;
  stats: ProfileStats;
  bottomSlot?: ReactNode;
}) {
  const { profile } = useAuth();
  const { coverInputRef, coverBusy, coverError, onCoverFileChange, pickCover } = useMasterCoverUpload();
  const { verified, pendingSteps } = useAccountVerificationStatus();
  const dedicatedCover = resolveCoverUrl(draft);
  const displayName = draft.name.trim() || 'Мастер';

  return (
    <section className={`${cabinetCard} relative z-0 max-lg:-mx-4 max-lg:rounded-none lg:rounded-t-none`}>
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onCoverFileChange}
      />
      <MasterCabinetCoverBanner
        name={displayName}
        dedicatedCoverUrl={dedicatedCover}
        photoUrl={draft.photoUrl}
        accountProfile={profile}
        aspectClass="aspect-[16/9] w-full"
      >
        <button
          type="button"
          onClick={pickCover}
          disabled={coverBusy}
          aria-label={coverBusy ? 'Загрузка обложки' : 'Изменить обложку'}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#F47C8C] shadow-sm transition hover:bg-white active:scale-[0.98] disabled:opacity-60"
        >
          <HiCamera className="h-5 w-5" aria-hidden />
        </button>
      </MasterCabinetCoverBanner>
      {coverError ? (
        <p className="px-4 pt-2 text-[12px] font-medium text-[#DC2626]">{coverError}</p>
      ) : null}

      <div className="relative px-4 pb-5 pt-0">
        <div className="-mt-11 flex justify-center">
          <MasterCabinetAvatar
            name={displayName}
            photoUrl={draft.photoUrl}
            accountProfile={profile}
            sizeClass="h-[88px] w-[88px]"
            ringClassName="bg-white ring-4 ring-white"
          />
        </div>

        <div className="mt-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-[clamp(18px,4.5vw,22px)] font-semibold leading-tight tracking-[-0.04em] text-balance text-[#111827]">
              {displayName}
            </h2>
            <MasterVerificationStatusBadge
              verified={verified}
              pendingSteps={pendingSteps}
              className="h-5 w-5 shrink-0"
            />
          </div>
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
      {bottomSlot}
    </section>
  );
}

export type { ProfileSectionId } from './ProfileSectionTabs';
export { ProfileSectionTabs } from './ProfileSectionTabs';

/**
 * Нижний край шапки: pt + min-h + pb + border-b-2 (см. AdminLayout).
 * Должен совпадать точно, иначе при sticky табы «прыгают» вверх.
 */
/** Совпадает с реальной высотой шапки (AdminLayout + ResizeObserver). */
export const CABINET_HEADER_STICKY_TOP = 'var(--slotty-admin-header-h, 4.5rem)';

function InfoGridCell({
  label,
  value,
  icon,
  onValueClick,
  valueClickDisabled = false,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  onValueClick?: () => void;
  valueClickDisabled?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 ${cabinetInsetTile}`}>
      <span className={`${cabinetIconCircle} h-9 w-9`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium leading-tight text-[#6B7280]">{label}</p>
        {onValueClick ? (
          <button
            type="button"
            onClick={onValueClick}
            disabled={valueClickDisabled}
            title={value}
            className="mt-0.5 block max-w-full truncate text-left text-[15px] font-semibold leading-snug text-[#F47C8C] underline-offset-2 transition hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
          >
            {value}
          </button>
        ) : (
          <p className="mt-0.5 truncate text-[15px] font-semibold leading-snug text-[#111827]" title={value}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

export function MainInfoCard({
  draft,
  onEdit,
  onOpenCategoryChange,
  categoryChangeDisabled = false,
}: {
  draft: MasterDraft;
  onEdit: () => void;
  onOpenCategoryChange?: () => void;
  categoryChangeDisabled?: boolean;
}) {
  const clientContacts = resolveFilledContacts(draft);

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
          value={valueOrEmptyField(draft.name)}
          icon={<CabinetIcon name="user" size={18} />}
        />
        <InfoGridCell
          label="Телефон"
          value={valueOrEmptyField(draft.phone)}
          icon={
            <BY title="Беларусь" className="h-[18px] w-[18px] rounded-full object-cover" />
          }
        />
        <InfoGridCell
          label="Категория"
          value={valueOrEmptyField(draft.category)}
          icon={<CabinetIcon name="briefcase" size={18} />}
          onValueClick={onOpenCategoryChange}
          valueClickDisabled={categoryChangeDisabled}
        />
      </div>

      <div className="mt-4 border-t border-[#EEEEEE] pt-4">
        <p className="text-[12px] font-medium text-[#9CA3AF]">Контакты для клиентов</p>
        {clientContacts.length > 0 ? (
          <div className="mt-2.5">
            <MasterContactsChips contacts={clientContacts} size="compact" />
          </div>
        ) : (
          <p className="mt-1.5 text-[15px] font-medium text-[#9CA3AF]">{EMPTY_CONTACTS}</p>
        )}
      </div>
    </section>
  );
}

export function AboutCard({ description }: { description: string }) {
  const trimmed = description?.trim() ?? '';
  return (
    <section className={`${cabinetCard} ${cabinetCardPad}`}>
      <div className="flex items-start gap-3">
        <span className={cabinetIconCircle}>
          <CabinetIcon name="chat" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">О себе</h2>
          <div className="mt-2">
            <AboutDescriptionText
              text={trimmed}
              placeholder={EMPTY_ABOUT}
              emptyClassName="text-[#6B7280]"
              textClassName="text-[#6B7280]"
            />
          </div>
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
    <button
      type="button"
      onClick={onEditSchedule}
      className={`${cabinetCard} ${cabinetCardPad} block w-full text-left transition hover:bg-[#FAFAFA] active:bg-[#F7F7F8]`}
      aria-label="Изменить график работы"
    >
      <div className="flex items-start gap-3">
        <span className={`${cabinetIconCircle} h-9 w-9`}>
          <CabinetIcon name="clock" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">График работы</h2>
            <CabinetIcon name="chevron-right" size={18} className="mt-0.5 shrink-0 text-[#C4C9D4]" />
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">
            Клиенты смогут записываться {preview || EMPTY_SCHEDULE_PREVIEW}
          </p>
        </div>
      </div>

      <div
        className={`mt-4 grid grid-cols-7 gap-0.5 px-2 py-2.5 ${cabinetInsetTile}`}
        aria-hidden
      >
        {WEEKDAY_LABELS_SHORT.map((label, day) => {
          const active = workDays.has(day);
          return (
            <span
              key={label}
              className={`flex flex-col items-center gap-1 text-[11px] font-semibold tracking-[-0.02em] ${
                active ? 'text-[#F47C8C]' : 'text-[#B8BEC8]'
              }`}
            >
              {label}
              <span
                className={`h-1 w-1 rounded-full ${active ? 'bg-[#F47C8C]' : 'bg-transparent'}`}
              />
            </span>
          );
        })}
      </div>
    </button>
  );
}

/** @deprecated moved to ProfileCompletionBlock + profileCompletion.ts — remove re-exports below if unused */

export { ADMIN_SERVICES_PATH };
