import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HiCheckBadge, HiEnvelope } from 'react-icons/hi2';
import { BY } from 'country-flag-icons/react/1x1';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { defaultMasterAvatarUrl } from '../../../features/master/model/masterDraftStorage';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import type { MasterLocation } from '../../../features/profile/model/masterLocation';
import type { MasterPublicationStatus } from '../../../features/admin/lib/profileCompletion';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { formatDurationRu, formatServicePrice, type ManagedService } from '../services/servicesFormat';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { CabinetIcon } from './cabinetIcons';
import {
  buildProfileStats,
  type ProfileSectionId,
  type ProfileStatsRatingMeta,
} from './AdminProfileCabinetUi';
import { useProfileTabs } from './profileTabContext';
import {
  profileDashboardCard,
  profileDashboardCardPad,
  profileDashboardPinkBtn,
  profileDashboardPinkText,
} from './adminProfileDashboardTheme';

const PROFILE_TABS: Array<{ id: ProfileSectionId; label: string }> = [
  { id: 'main', label: 'Профиль' },
  { id: 'portfolio', label: 'Портфолио' },
  { id: 'address', label: 'Адрес' },
  { id: 'rules', label: 'Правила' },
];

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

function publicationStatusLabel(status: MasterPublicationStatus | null): string {
  switch (status) {
    case 'published':
      return 'Опубликован';
    case 'hidden':
      return 'Скрыт';
    case 'blocked':
      return 'Заблокирован';
    default:
      return 'Черновик';
  }
}

function formatRegistrationDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ProfileInlineTabs({
  active,
  onChange,
}: {
  active: ProfileSectionId;
  onChange: (id: ProfileSectionId) => void;
}) {
  return (
    <nav
      className="flex gap-6 border-b border-[#eef0f5] px-6 md:px-8"
      aria-label="Разделы профиля"
    >
      {PROFILE_TABS.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative -mb-px pb-3.5 pt-4 text-[14px] font-semibold transition ${
              selected ? profileDashboardPinkText : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            {tab.label}
            {selected ? (
              <span
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a]"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
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
      <ProfileInlineTabs active={tabs.activeSection} onChange={tabs.setActiveSection} />
    </section>
  );
}

function HeroCoverBlock({ draft }: { draft: MasterDraft }) {
  const photoSrc = draft.photoUrl?.trim() || defaultMasterAvatarUrl(draft.name || 'Мастер');
  const coverSrc = resolveCoverUrl(draft) || photoSrc;
  const useBlur = !resolveCoverUrl(draft);

  return (
    <div className="relative h-[min(340px,32vw)] min-h-[280px] w-full overflow-hidden bg-[#f0f1f5]">
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
  const photoSrc = draft.photoUrl?.trim() || defaultMasterAvatarUrl(draft.name || 'Мастер');
  const displayName = draft.name.trim() || 'Мастер';
  const city = valueOrDash(profileCityDisplay(draft.location));
  const phone = valueOrDash(draft.phone);
  const isPublished = publicationStatus === 'published';

  return (
    <div className="relative px-6 pb-0 pt-0 md:px-8">
      <div className="-mt-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-1 items-end gap-4">
          <div className="relative h-[112px] w-[112px] shrink-0 overflow-hidden rounded-full bg-white ring-4 ring-white shadow-[0_12px_32px_rgba(17,24,39,0.12)]">
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
          <div className="min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[clamp(22px,2.5vw,28px)] font-bold tracking-[-0.04em] text-[#111827]">
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
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#6B7280]">
              <span className="inline-flex items-center gap-1.5">
                <CabinetIcon name="phone" size={16} />
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
                  <HiEnvelope className="h-4 w-4 shrink-0" aria-hidden />
                  —
                </span>
              <span className="inline-flex items-center gap-1.5">
                <CabinetIcon name="map-pin" size={16} />
                {city}
              </span>
            </div>
          </div>
        </div>
        <button type="button" onClick={onEditMain} className={`${profileDashboardPinkBtn} shrink-0`}>
          Редактировать профиль
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#eef0f5] py-3.5 last:border-0">
      <span className="text-[13px] font-medium text-[#6B7280]">{label}</span>
      <span className="text-right text-[14px] font-semibold text-[#111827]">{value}</span>
    </div>
  );
}

function AchievementsInnerCard({ draft }: { draft: MasterDraft }) {
  const career = draft.careerItems?.length ?? 0;
  const certs = draft.certificates?.length ?? 0;
  const portfolio = draft.portfolio?.length ?? 0;
  const total = career + certs + portfolio;

  return (
    <div className="mt-4 rounded-[18px] bg-[#f6f7fb] p-4 ring-1 ring-[#eef0f5]">
      <p className="text-[13px] font-semibold text-[#111827]">Достижения</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
        {total > 0
          ? `${career} в образовании и опыте · ${certs} сертификатов · ${portfolio} работ в портфолио`
          : 'Добавьте опыт, сертификаты и работы во вкладке «Портфолио»'}
      </p>
    </div>
  );
}

function ServicePreviewRow({ service }: { service: ManagedService }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[16px] bg-[#f6f7fb] px-4 py-3.5 ring-1 ring-[#eef0f5]">
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
  children,
}: {
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  ratingMeta?: ProfileStatsRatingMeta;
  children?: ReactNode;
}) {
  const { publicationStatus } = useAdminMasterCabinet();
  const stats = buildProfileStats(appointments, ratingMeta);
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const reviews = ratingMeta?.reviewsCount ?? 0;
  const services = (draft.services ?? []).filter((s) => s.isActive !== false).slice(0, 4);
  const description = draft.description?.trim() || '—';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-1 xl:grid-cols-2">
        <section className={`${profileDashboardCard} ${profileDashboardCardPad}`}>
          <h3 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">О себе</h3>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-[#6B7280]">
            {description}
          </p>
          <AchievementsInnerCard draft={draft} />
        </section>

        <section className={`${profileDashboardCard} ${profileDashboardCardPad}`}>
          <h3 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">Информация</h3>
          <div className="mt-2">
            <InfoRow label="Дата регистрации" value={formatRegistrationDate(draft.createdAt)} />
            <InfoRow label="Статус" value={publicationStatusLabel(publicationStatus)} />
            <InfoRow
              label="Рейтинг"
              value={stats.rating.empty ? stats.rating.value : stats.rating.value}
            />
            <InfoRow label="Выполнено заказов" value={String(completed)} />
            <InfoRow label="Отзывов" value={String(reviews)} />
          </div>
        </section>
      </div>

      <section className={`${profileDashboardCard} ${profileDashboardCardPad}`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">Мои услуги</h3>
          <Link
            to={ADMIN_SERVICES_PATH}
            className="text-[13px] font-semibold text-[#ff5f7a] no-underline transition hover:text-[#ff6f88]"
          >
            Смотреть все
          </Link>
        </div>
        <div className="mt-4 space-y-2.5">
          {services.length > 0 ? (
            services.map((s) => <ServicePreviewRow key={s.id} service={s as ManagedService} />)
          ) : (
            <p className="rounded-[16px] bg-[#f6f7fb] px-4 py-6 text-center text-[14px] text-[#6B7280] ring-1 ring-[#eef0f5]">
              Услуги пока не добавлены
            </p>
          )}
        </div>
      </section>

      {children}
    </div>
  );
}

type DesktopShellProps = {
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  ratingMeta?: ProfileStatsRatingMeta;
  onEditMain: () => void;
  section: ReactNode;
  extraMain?: ReactNode;
};

export function AdminProfileDesktopShell({
  draft,
  appointments,
  ratingMeta,
  onEditMain,
  section,
  extraMain,
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
          >
            {extraMain}
          </AdminProfileDesktopMainGrid>
        </>
      ) : section ? (
        <div className={`${profileDashboardCard} ${profileDashboardCardPad}`}>{section}</div>
      ) : null}
    </div>
  );
}
