import { type ChangeEvent, type ReactNode, type RefObject } from 'react';
import { HiCamera } from 'react-icons/hi2';
import type { ProfileCompletionHandlers } from './ProfileCompletionBlock';
import { ProfileCompletionBlock } from './ProfileCompletionBlock';
import { Link } from 'react-router-dom';
import { HiArrowRight, HiBriefcase, HiEnvelope } from 'react-icons/hi2';
import { BY } from 'country-flag-icons/react/1x1';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import type { MasterDraft, MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import type { MasterLocation } from '../../../features/profile/model/masterLocation';
import { MasterCabinetAvatar, MasterCabinetCoverBanner } from './adminProfilePortrait';
import { formatDurationRu, formatServicePrice, type ManagedService } from '../services/servicesFormat';
import { useAccountVerificationStatus } from '../../../features/auth/hooks/useAccountVerificationStatus';
import { useAuth } from '../../../features/auth/AuthProvider';
import { valueOrEmptyField, EMPTY_FIELD } from '../../../shared/lib/emptyDisplayText';
import { MasterVerificationStatusBadge } from '../../../shared/ui/MasterVerificationStatusBadge';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { CabinetIcon } from './cabinetIcons';
import { ScheduleWorkCard, type ProfileStatsRatingMeta } from './AdminProfileCabinetUi';
import { ScheduleBookingWindowsHintContainer } from './ScheduleBookingWindowsHintContainer';
import { MasterCategorySection } from './MasterCategorySection';
import { MasterProfileActiveToggle } from './MasterProfileActiveToggle';
import { ProfileInformationPanel, ProfileSectionHeading } from './ProfileInformationPanel';
import { AboutDescriptionText } from './AboutDescriptionText';
import { ProfileSectionTabs } from './ProfileSectionTabs';
import { useProfileTabs } from './profileTabContext';
import { resolveCoverUrl, useMasterCoverUpload } from './masterProfileCover';
import {
  profileDashboardCard,
  profileDashboardCardPad,
  profileDashboardEditBtn,
  profileDesktopTabsSticky,
} from './adminProfileDashboardTheme';

function profileCityDisplay(loc: MasterLocation | undefined): string {
  const c = loc?.city?.trim();
  return c || 'Минск';
}


function ProfileDashboardHeroWrapper({
  draft,
  onEditMain,
}: {
  draft: MasterDraft;
  onEditMain: () => void;
}) {
  const tabs = useProfileTabs();
  const { coverInputRef, coverBusy, coverError, onCoverFileChange, pickCover } = useMasterCoverUpload();

  return (
    <div className="min-w-0">
      <section className={`${profileDashboardCard} rounded-b-none`}>
        <HeroCoverBlock
          draft={draft}
          coverBusy={coverBusy}
          coverError={coverError}
          coverInputRef={coverInputRef}
          onPickCover={pickCover}
          onCoverFileChange={onCoverFileChange}
        />
        <HeroInfoBlock draft={draft} onEditMain={onEditMain} />
      </section>
      <div
        className={`${profileDashboardCard} ${profileDesktopTabsSticky}`}
      >
        <ProfileSectionTabs
          active={tabs.activeSection}
          onChange={tabs.setActiveSection}
          className="px-1 md:px-2"
        />
      </div>
    </div>
  );
}

function HeroCoverBlock({
  draft,
  coverBusy,
  coverError,
  coverInputRef,
  onPickCover,
  onCoverFileChange,
}: {
  draft: MasterDraft;
  coverBusy: boolean;
  coverError: string | null;
  coverInputRef: RefObject<HTMLInputElement>;
  onPickCover: () => void;
  onCoverFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const { profile } = useAuth();
  const dedicatedCover = resolveCoverUrl(draft);

  return (
    <div className="relative">
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
        name={draft.name}
        dedicatedCoverUrl={dedicatedCover}
        photoUrl={draft.photoUrl}
        accountProfile={profile}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPickCover();
          }}
          disabled={coverBusy}
          aria-label={coverBusy ? 'Загрузка обложки' : 'Изменить обложку'}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#F47C8C] shadow-sm transition hover:bg-white active:scale-[0.98] disabled:opacity-60 sm:top-4 sm:right-4"
        >
          <HiCamera className="h-5 w-5" aria-hidden />
        </button>
      </MasterCabinetCoverBanner>
      {coverError ? (
        <p className="px-6 pb-2 pt-2 text-[13px] font-medium text-[#DC2626]">{coverError}</p>
      ) : null}
    </div>
  );
}

function HeroInfoBlock({
  draft,
  onEditMain,
}: {
  draft: MasterDraft;
  onEditMain: () => void;
}) {
  const { profile: authProfile } = useAuth();
  const { verified, pendingSteps } = useAccountVerificationStatus();

  const displayName = draft.name.trim() || 'Мастер';
  const city = valueOrEmptyField(profileCityDisplay(draft.location));
  const phone = valueOrEmptyField(draft.phone);
  const email = valueOrEmptyField(authProfile?.account_email);

  return (
    <div className="relative bg-white px-6 pb-2 pt-0 md:px-8">
      <div className="-mt-[4.5rem] flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-5">
          <MasterCabinetAvatar
            name={displayName}
            photoUrl={draft.photoUrl}
            accountProfile={authProfile}
            sizeClass="h-[120px] w-[120px]"
            ringClassName="bg-white ring-4 ring-white"
            initialsClassName="text-[40px]"
          />
          <div className="min-w-0 pt-14 sm:pt-16">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[clamp(20px,2.2vw,26px)] font-bold tracking-[-0.04em] text-[#111827]">
                {displayName}
              </h2>
              <MasterVerificationStatusBadge
                verified={verified}
                pendingSteps={pendingSteps}
                className="h-6 w-6 shrink-0"
              />
            </div>
            <p className="mt-1 text-[14px] font-medium text-[#6B7280]">Кабинет мастера</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[#6B7280]">
              <span className="inline-flex items-center gap-1.5">
                {phone !== EMPTY_FIELD ? (
                  <>
                    <BY title="Беларусь" className="h-3.5 w-3.5 shrink-0 rounded-full object-cover" />
                    {phone}
                  </>
                ) : (
                  phone
                )}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HiEnvelope className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
                {email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CabinetIcon name="map-pin" size={16} className="text-[#9CA3AF]" />
                {city}
              </span>
            </div>
          </div>
        </div>
        <button type="button" onClick={onEditMain} className={`${profileDashboardEditBtn} sm:mt-14`}>
          <CabinetIcon name="pencil" size={16} />
          Редактировать профиль
        </button>
      </div>
    </div>
  );
}

function sortServicesForProfilePreview(services: MasterOnboardingService[]): MasterOnboardingService[] {
  return [...services].sort((a, b) => {
    const aVisible = a.isActive !== false ? 0 : 1;
    const bVisible = b.isActive !== false ? 0 : 1;
    if (aVisible !== bVisible) return aVisible - bVisible;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

function ServicePreviewRow({ service }: { service: ManagedService }) {
  const visible = service.isActive !== false;
  return (
    <div className="flex items-center justify-between gap-4 rounded-[10px] bg-[#F5F5F5] px-4 py-3.5">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-[14px] font-semibold text-[#111827]">{service.title}</p>
          {!visible ? (
            <span className="shrink-0 rounded-full bg-[#EBEBEB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
              Скрыта
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[12px] text-[#6B7280]">{formatDurationRu(service.durationMin)}</p>
      </div>
      <p className="shrink-0 text-[14px] font-bold text-[#ff5f7a]">{formatServicePrice(service)}</p>
    </div>
  );
}

export function AdminProfileDesktopMainGrid({
  draft,
  appointments,
  ratingMeta,
  onEditSchedule,
}: {
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  ratingMeta?: ProfileStatsRatingMeta;
  onEditSchedule: () => void;
}) {
  const { publicationStatus, useCabinetApi } = useAdminMasterCabinet();
  const allServices = draft.services ?? [];
  const previewServices = sortServicesForProfilePreview(allServices).slice(0, 4);
  const visibleServicesCount = allServices.filter((s) => s.isActive !== false).length;
  const description = draft.description?.trim() ?? '';

  return (
    <div className="space-y-6">
      <MasterProfileActiveToggle
        publicationStatus={publicationStatus}
        useCabinetApi={useCabinetApi}
        masterDisplayName={draft.name}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={`${profileDashboardCard} ${profileDashboardCardPad}`}>
          <ProfileSectionHeading
            title="О себе"
            subtitle="Текст в публичном профиле"
            icon={<CabinetIcon name="chat" size={18} />}
          />
          <div className="mt-4 rounded-[16px] bg-[#f6f7fb] p-4">
            <AboutDescriptionText
              text={description}
              placeholder="Добавьте описание в профиле — клиенты увидят его перед записью."
            />
          </div>
        </section>

        <ProfileInformationPanel
          draft={draft}
          appointments={appointments}
          ratingMeta={ratingMeta}
          publicationStatus={publicationStatus}
        />
      </div>

      <ScheduleWorkCard draft={draft} onEditSchedule={onEditSchedule} />
      <ScheduleBookingWindowsHintContainer />

      <section className={`${profileDashboardCard} ${profileDashboardCardPad}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HiBriefcase className="h-5 w-5 text-[#ff5f7a]" aria-hidden />
            <h3 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">Мои услуги</h3>
          </div>
          <Link
            to={ADMIN_SERVICES_PATH}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#ff5f7a] no-underline transition hover:text-[#ff6f88]"
          >
            Смотреть все
            <HiArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-4 space-y-2.5">
          {previewServices.length > 0 ? (
            <>
              {visibleServicesCount === 0 ? (
                <p className="rounded-[10px] bg-[#FFF7ED] px-4 py-3 text-[13px] leading-relaxed text-[#B45309]">
                  Услуги есть, но скрыты в каталоге. Откройте раздел «Услуги» и нажмите «Показать» у
                  нужной позиции.
                </p>
              ) : null}
              {previewServices.map((s) => (
                <ServicePreviewRow key={s.id} service={s as ManagedService} />
              ))}
            </>
          ) : (
            <p className="rounded-[10px] bg-[#F5F5F5] px-4 py-6 text-center text-[14px] text-[#6B7280]">
              Услуги пока не добавлены
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

type DesktopShellProps = {
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  ratingMeta?: ProfileStatsRatingMeta;
  onEditMain: () => void;
  onEditSchedule: () => void;
  section: ReactNode;
  completionHandlers: ProfileCompletionHandlers;
};

export function AdminProfileDesktopShell({
  draft,
  appointments,
  ratingMeta,
  onEditMain,
  onEditSchedule,
  section,
  completionHandlers,
}: DesktopShellProps) {
  const { activeSection } = useProfileTabs();
  const {
    publicationStatus,
    categoryChangePolicy,
    patchProfileToBackend,
    refreshDraft,
    useCabinetApi,
  } = useAdminMasterCabinet();

  return (
    <div className="hidden space-y-6 lg:block">
      <ProfileDashboardHeroWrapper draft={draft} onEditMain={onEditMain} />
      {activeSection === 'main' ? (
        <>
          <AdminProfileDesktopMainGrid
            draft={draft}
            appointments={appointments}
            ratingMeta={ratingMeta}
            onEditSchedule={onEditSchedule}
          />
          <ProfileCompletionBlock
            draft={draft}
            handlers={completionHandlers}
            surfaceClassName={`${profileDashboardCard} ${profileDashboardCardPad}`}
          />
          <MasterCategorySection
            draft={draft}
            publicationStatus={publicationStatus}
            policy={categoryChangePolicy}
            useCabinetApi={useCabinetApi}
            onPatchCategory={patchProfileToBackend}
            onRefresh={refreshDraft}
          />
        </>
      ) : section ? (
        <div className={`${profileDashboardCard} ${profileDashboardCardPad}`}>{section}</div>
      ) : null}
    </div>
  );
}
