import type { ReactNode } from 'react';
import type { ProfileCompletionHandlers } from './ProfileCompletionBlock';
import { ProfileCompletionBlock } from './ProfileCompletionBlock';
import { Link } from 'react-router-dom';
import {
  HiArrowRight,
  HiBriefcase,
  HiCheckBadge,
  HiEnvelope,
  HiStar,
} from 'react-icons/hi2';
import { BY } from 'country-flag-icons/react/1x1';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { defaultMasterAvatarUrl } from '../../../features/master/model/masterDraftStorage';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import type { MasterLocation } from '../../../features/profile/model/masterLocation';
import type { MasterPublicationStatus } from '../../../features/admin/lib/profileCompletion';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { formatDurationRu, formatServicePrice, type ManagedService } from '../services/servicesFormat';
import { useAuth } from '../../../features/auth/AuthProvider';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { CabinetIcon } from './cabinetIcons';
import { buildProfileStats, type ProfileStatsRatingMeta } from './AdminProfileCabinetUi';
import { ProfileSectionTabs } from './ProfileSectionTabs';
import { useProfileTabs } from './profileTabContext';
import {
  profileDashboardCard,
  profileDashboardCardPad,
  profileDashboardEditBtn,
} from './adminProfileDashboardTheme';

function profileCityDisplay(loc: MasterLocation | undefined): string {
  const c = loc?.city?.trim();
  return c || 'Минск';
}

function valueOrDash(value?: string | null): string {
  const trimmed = value?.trim() ?? '';
  return trimmed || '—';
}

function resolveCoverUrl(draft: MasterDraft): string | null {
  const coverId = draft.portfolioCoverId?.trim();
  if (coverId) {
    const item = draft.portfolio?.find((p) => p.id === coverId);
    const url = item?.imageUrl?.trim();
    if (url) return url;
  }
  const photo = draft.photoUrl?.trim();
  return photo || null;
}

function publicationStatusDisplay(status: MasterPublicationStatus | null): {
  label: string;
  tone: 'green' | 'muted' | 'warn';
} {
  switch (status) {
    case 'published':
      return { label: 'Активен', tone: 'green' };
    case 'hidden':
      return { label: 'Скрыт', tone: 'muted' };
    case 'blocked':
      return { label: 'Заблокирован', tone: 'warn' };
    default:
      return { label: 'Черновик', tone: 'muted' };
  }
}

function formatRegistrationDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ProfileDashboardHeroWrapper({
  draft,
  onEditMain,
}: {
  draft: MasterDraft;
  onEditMain: () => void;
}) {
  const tabs = useProfileTabs();
  return (
    <section className={`${profileDashboardCard} overflow-hidden`}>
      <HeroCoverBlock draft={draft} />
      <HeroInfoBlock draft={draft} onEditMain={onEditMain} />
      <ProfileSectionTabs
        active={tabs.activeSection}
        onChange={tabs.setActiveSection}
        className="px-1 md:px-2"
      />
    </section>
  );
}

function HeroCoverBlock({ draft }: { draft: MasterDraft }) {
  const photoSrc = draft.photoUrl?.trim() || defaultMasterAvatarUrl(draft.name || 'Мастер');
  const coverSrc = resolveCoverUrl(draft) || photoSrc;
  const useBlur = !resolveCoverUrl(draft);

  return (
    <div className="relative h-[300px] w-full overflow-hidden bg-[#f0f1f5] sm:h-[320px]">
      <ImageReveal
        src={coverSrc}
        alt=""
        width={1200}
        height={400}
        className={`h-full w-full object-cover ${useBlur ? 'scale-110 blur-md' : ''}`}
        onError={(event) => {
          (event.target as HTMLImageElement).src = defaultMasterAvatarUrl(draft.name || 'Мастер');
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
        aria-hidden
      />
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
  const { publicationStatus } = useAdminMasterCabinet();
  const { profile: authProfile } = useAuth();
  const photoSrc = draft.photoUrl?.trim() || defaultMasterAvatarUrl(draft.name || 'Мастер');
  const displayName = draft.name.trim() || 'Мастер';
  const city = valueOrDash(profileCityDisplay(draft.location));
  const phone = valueOrDash(draft.phone);
  const email = valueOrDash(authProfile?.account_email);
  const isPublished = publicationStatus === 'published';

  return (
    <div className="relative bg-white px-6 pb-2 pt-0 md:px-8">
      <div className="-mt-[4.5rem] flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-5">
          <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-full bg-white ring-4 ring-white shadow-[0_12px_32px_rgba(17,24,39,0.12)]">
            <ImageReveal
              src={photoSrc}
              alt=""
              width={224}
              height={224}
              className="h-full w-full object-cover"
              onError={(event) => {
                (event.target as HTMLImageElement).src = defaultMasterAvatarUrl(
                  draft.name || 'Мастер',
                );
              }}
            />
          </div>
          <div className="min-w-0 pt-14 sm:pt-16">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[clamp(20px,2.2vw,26px)] font-bold tracking-[-0.04em] text-[#111827]">
                {displayName}
              </h2>
              {isPublished ? (
                <HiCheckBadge
                  className="h-6 w-6 shrink-0 text-[#ff5f7a]"
                  aria-label="Профиль опубликован"
                />
              ) : null}
            </div>
            <p className="mt-1 text-[14px] font-medium text-[#6B7280]">Кабинет мастера</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[#6B7280]">
              <span className="inline-flex items-center gap-1.5">
                <CabinetIcon name="phone" size={16} className="text-[#9CA3AF]" />
                {phone !== '—' ? (
                  <span className="inline-flex items-center gap-1">
                    <BY title="Беларусь" className="h-3.5 w-3.5 rounded-full object-cover" />
                    {phone}
                  </span>
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

function InfoRow({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string;
  valueNode?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <span className="text-[13px] font-medium text-[#6B7280]">{label}</span>
      {valueNode ?? (
        <span className="text-right text-[14px] font-semibold text-[#111827]">{value}</span>
      )}
    </div>
  );
}

function ServicePreviewRow({ service }: { service: ManagedService }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[16px] bg-[#f6f7fb] px-4 py-3.5">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-[#111827]">{service.title}</p>
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
}: {
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  ratingMeta?: ProfileStatsRatingMeta;
}) {
  const { publicationStatus } = useAdminMasterCabinet();
  const stats = buildProfileStats(appointments, ratingMeta);
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const reviews = ratingMeta?.reviewsCount ?? 0;
  const services = (draft.services ?? []).filter((s) => s.isActive !== false).slice(0, 4);
  const description = draft.description?.trim() || '—';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={`${profileDashboardCard} ${profileDashboardCardPad}`}>
          <h3 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">О себе</h3>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-[#6B7280]">
            {description}
          </p>
        </section>

        <section className={`${profileDashboardCard} ${profileDashboardCardPad}`}>
          <h3 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">Информация</h3>
          <div className="mt-2 space-y-1">
            <InfoRow label="Дата регистрации" value={formatRegistrationDate(draft.createdAt)} />
            <InfoRow
              label="Статус"
              valueNode={
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
                    publicationStatusDisplay(publicationStatus).tone === 'green'
                      ? 'bg-[#ECFDF3] text-[#16A34A]'
                      : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}
                >
                  {publicationStatusDisplay(publicationStatus).label}
                </span>
              }
            />
            <InfoRow
              label="Рейтинг"
              valueNode={
                stats.rating.empty ? (
                  <span className="text-[14px] font-semibold text-[#9CA3AF]">{stats.rating.value}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[14px] font-bold text-[#111827]">
                    <HiStar className="h-4 w-4 text-[#E8A317]" aria-hidden />
                    {stats.rating.value}
                  </span>
                )
              }
            />
            <InfoRow label="Выполнено заказов" value={String(completed)} />
            <InfoRow label="Отзывов" value={String(reviews)} />
          </div>
        </section>
      </div>

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
          {services.length > 0 ? (
            services.map((s) => <ServicePreviewRow key={s.id} service={s as ManagedService} />)
          ) : (
            <p className="rounded-[16px] bg-[#f6f7fb] px-4 py-6 text-center text-[14px] text-[#6B7280]">
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
  section: ReactNode;
  completionHandlers: ProfileCompletionHandlers;
};

export function AdminProfileDesktopShell({
  draft,
  appointments,
  ratingMeta,
  onEditMain,
  section,
  completionHandlers,
}: DesktopShellProps) {
  const { activeSection } = useProfileTabs();

  return (
    <div className="hidden space-y-6 lg:block">
      <ProfileDashboardHeroWrapper draft={draft} onEditMain={onEditMain} />
      {activeSection === 'main' ? (
        <>
          <AdminProfileDesktopMainGrid
            draft={draft}
            appointments={appointments}
            ratingMeta={ratingMeta}
          />
          <ProfileCompletionBlock
            draft={draft}
            handlers={completionHandlers}
            surfaceClassName={`${profileDashboardCard} ${profileDashboardCardPad}`}
          />
        </>
      ) : section ? (
        <div className={`${profileDashboardCard} ${profileDashboardCardPad}`}>{section}</div>
      ) : null}
    </div>
  );
}
