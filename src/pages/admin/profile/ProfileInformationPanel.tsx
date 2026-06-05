import type { ReactNode } from 'react';
import { EMPTY_DATE } from '../../../shared/lib/emptyDisplayText';
import {
  HiCalendarDays,
  HiChatBubbleLeftRight,
  HiCheckBadge,
  HiStar,
} from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import type { MasterPublicationStatus } from '../../../features/admin/lib/profileCompletion';
import { buildProfileStats, type ProfileStatsRatingMeta } from './AdminProfileCabinetUi';
import { CabinetIcon } from './cabinetIcons';
import { profileDashboardCard, profileDashboardCardPad } from './adminProfileDashboardTheme';

function publicationStatusDisplay(status: MasterPublicationStatus | null): {
  label: string;
  tone: 'green' | 'muted' | 'warn';
} {
  switch (status) {
    case 'published':
      return { label: 'Активен', tone: 'green' };
    case 'hidden':
      return { label: 'Отключён', tone: 'muted' };
    case 'paused':
      return { label: 'Пауза', tone: 'muted' };
    case 'blocked':
      return { label: 'Заблокирован', tone: 'warn' };
    default:
      return { label: 'Черновик', tone: 'muted' };
  }
}

function formatRegistrationDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return EMPTY_DATE;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ProfileSectionHeading({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] text-[#ff5f7a]">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-[13px] font-medium text-[#9CA3AF]">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function ProfileInfoStatTile({
  label,
  children,
  icon,
}: {
  label: string;
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="flex min-h-[6.5rem] flex-col justify-between rounded-[16px] bg-[#f6f7fb] p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#ff5f7a] ring-1 ring-[#FDE8ED]">
          {icon}
        </span>
      </div>
      <div className="mt-3 min-w-0">{children}</div>
    </div>
  );
}

function ProfileStatusBadge({ status }: { status: MasterPublicationStatus | null }) {
  const { label, tone } = publicationStatusDisplay(status);
  const toneClass =
    tone === 'green'
      ? 'bg-[#22C55E] text-white'
      : tone === 'warn'
        ? 'bg-[#FFF7ED] text-[#C2410C]'
        : 'bg-[#F3F4F6] text-[#6B7280]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${toneClass}`}
    >
      {tone === 'green' ? (
        <span className="h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden />
      ) : null}
      {label}
    </span>
  );
}

type Props = {
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  ratingMeta?: ProfileStatsRatingMeta;
  publicationStatus: MasterPublicationStatus | null;
};

export function ProfileInformationPanel({
  draft,
  appointments,
  ratingMeta,
  publicationStatus,
}: Props) {
  const stats = buildProfileStats(appointments, ratingMeta);
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const reviews = ratingMeta?.reviewsCount ?? 0;

  return (
    <section className={`${profileDashboardCard} ${profileDashboardCardPad}`}>
      <ProfileSectionHeading
        title="Информация"
        subtitle="Показатели и статус профиля"
        icon={<CabinetIcon name="user" size={18} />}
      />

      <div className="mt-5 flex items-center justify-between gap-3 rounded-[14px] bg-[#f6f7fb] px-4 py-3.5">
        <span className="text-[13px] font-semibold text-[#374151]">Статус профиля</span>
        <ProfileStatusBadge status={publicationStatus} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <ProfileInfoStatTile label="Рейтинг" icon={<HiStar className="h-[18px] w-[18px]" aria-hidden />}>
          {stats.rating.empty ? (
            <p className="text-[20px] font-black leading-none tracking-[-0.04em] text-[#9CA3AF]">
              {stats.rating.value}
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-[20px] font-black leading-none tracking-[-0.04em] text-[#111827]">
              <HiStar className="h-5 w-5 text-[#F59E0B]" aria-hidden />
              {stats.rating.value}
            </p>
          )}
          <p className="mt-1.5 text-[12px] font-medium text-[#6B7280]">
            {reviews > 0 ? `${reviews} отзывов` : 'Пока без отзывов'}
          </p>
        </ProfileInfoStatTile>

        <ProfileInfoStatTile label="Заказы" icon={<HiCheckBadge className="h-[18px] w-[18px]" aria-hidden />}>
          <p className="text-[20px] font-black leading-none tabular-nums tracking-[-0.04em] text-[#111827]">
            {completed}
          </p>
          <p className="mt-1.5 text-[12px] font-medium text-[#6B7280]">Выполнено</p>
        </ProfileInfoStatTile>

        <ProfileInfoStatTile
          label="Отзывы"
          icon={<HiChatBubbleLeftRight className="h-[18px] w-[18px]" aria-hidden />}
        >
          <p className="text-[20px] font-black leading-none tabular-nums tracking-[-0.04em] text-[#111827]">
            {reviews}
          </p>
          <p className="mt-1.5 text-[12px] font-medium text-[#6B7280]">Всего</p>
        </ProfileInfoStatTile>

        <ProfileInfoStatTile label="Регистрация" icon={<HiCalendarDays className="h-[18px] w-[18px]" aria-hidden />}>
          <p className="text-[15px] font-bold leading-snug tracking-[-0.02em] text-[#111827]">
            {formatRegistrationDate(draft.createdAt)}
          </p>
          <p className="mt-1.5 text-[12px] font-medium text-[#6B7280]">На платформе</p>
        </ProfileInfoStatTile>
      </div>
    </section>
  );
}
