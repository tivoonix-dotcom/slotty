import type { FC } from 'react';
import { HiCalendarDays, HiCheckBadge, HiEnvelope, HiStar } from 'react-icons/hi2';
import { BY } from 'country-flag-icons/react/1x1';
import { ADMIN_SEGMENT_NAV_MOBILE } from '../admin/adminCabinetLayout';
import { profileDashboardCard, profileDashboardEditBtn } from '../admin/profile/adminProfileDashboardTheme';
import { CabinetIcon } from '../admin/profile/cabinetIcons';
import { adminMobileSegmentTabClass } from '../admin/shared/adminMobileTabBarTheme';
import {
  adminSectionTabIndicatorClass,
  adminSectionTabLabelClass,
  adminSectionTabTextClass,
} from '../admin/shared/adminSectionTabsTheme';
import {
  masterDemoDesktopScrollClass,
  masterDemoMobileScrollClass,
} from './homeLandingMasterDemoTheme';
import { MASTER_LANDING_DEMO_MASTER_EMAIL } from './masterLandingDemoPersona';
import { useLandingDemoLayout } from './masterLandingDemoShared';

const PROFILE_TABS = [
  { id: 'main', label: 'Профиль', icon: 'user' as const },
  { id: 'portfolio', label: 'Портфолио', icon: 'photo' as const },
  { id: 'address', label: 'Адрес', icon: 'map-pin' as const },
  { id: 'rules', label: 'Правила', icon: 'rules' as const },
];

type MasterLandingProfileHubProps = {
  name: string;
  about: string;
  editPressed?: boolean;
};

function DemoSectionHeading({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#FFF1F4] text-[#ff5f7a]">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-[11px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[12px]">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-[9px] font-medium text-[#9CA3AF] sm:text-[10px]">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function DemoStatTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex min-h-[4.25rem] flex-col justify-between rounded-[10px] bg-[#f6f7fb] p-2 sm:min-h-[4.5rem] sm:p-2.5">
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF] sm:text-[9px]">{label}</p>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-white text-[#ff5f7a] ring-1 ring-[#FDE8ED] sm:h-7 sm:w-7">
          {icon}
        </span>
      </div>
      <p className="text-[14px] font-black tabular-nums leading-none tracking-[-0.05em] text-[#111827] sm:text-[16px]">
        {value}
      </p>
    </div>
  );
}

function DemoProfileTabs({ mobile }: { mobile: boolean }) {
  if (mobile) {
    return (
      <nav
        className={`${ADMIN_SEGMENT_NAV_MOBILE} shrink-0`}
        style={{ minHeight: '2.75rem' }}
        aria-hidden
      >
        {PROFILE_TABS.map((tab) => {
          const selected = tab.id === 'main';
          return (
            <div key={tab.id} className={adminMobileSegmentTabClass(selected, 'brand')}>
              <CabinetIcon name={tab.icon} size={18} className="shrink-0" />
              <span className="max-w-full truncate text-[9px] font-bold leading-none">{tab.label}</span>
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex h-8 border-t border-[#eef0f5] bg-white sm:h-9" aria-hidden>
      {PROFILE_TABS.map((tab) => {
        const selected = tab.id === 'main';
        return (
          <div
            key={tab.id}
            className={adminSectionTabTextClass(selected)
              .replace('h-full', 'h-8 sm:h-9')
              .replace('lg:px-5', 'px-1.5 sm:px-2')}
          >
            <CabinetIcon name={tab.icon} size={14} className={selected ? 'text-[#ff5f7a]' : 'text-[#9CA3AF]'} />
            <span className={`${adminSectionTabLabelClass.replace('text-[14px]', 'text-[9px]')} sm:text-[10px]`}>
              {tab.label}
            </span>
            {selected ? (
              <span className={adminSectionTabIndicatorClass().replace('inset-x-3', 'inset-x-2')} aria-hidden />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export const MasterLandingProfileHub: FC<MasterLandingProfileHubProps> = ({
  name,
  about,
  editPressed = false,
}) => {
  const displayName = name.trim() || 'Мастер';
  const aboutPreview =
    about.trim() || 'Добавьте описание в профиле — клиенты увидят его перед записью.';
  const { mobile } = useLandingDemoLayout();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f7fb]">
      <section className={`${profileDashboardCard} shrink-0 overflow-hidden rounded-b-none`}>
        <div className="relative h-[3rem] overflow-hidden bg-gradient-to-br from-[#FFF1F4] via-[#FFE4EC] to-[#F6F7FB] sm:h-[3.25rem]">
          <div className="absolute inset-0 bg-[url('/photos/fon.webp')] bg-cover bg-center opacity-35" aria-hidden />
        </div>

        <div className="relative bg-white px-3 pb-2 pt-0 sm:px-3.5">
          <div className="-mt-7 flex items-start gap-2 sm:-mt-8 sm:gap-2.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[15px] font-bold text-[#F47C8C] ring-[3px] ring-white sm:h-14 sm:w-14 sm:text-[17px]">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1 pt-5 sm:pt-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="truncate text-[12px] font-bold tracking-[-0.04em] text-[#111827] sm:text-[14px]">
                  {displayName}
                </h2>
                <HiCheckBadge className="h-3.5 w-3.5 shrink-0 text-[#22C55E]" aria-hidden />
              </div>
              <p className="mt-0.5 text-[9px] font-medium text-[#6B7280] sm:text-[10px]">Кабинет мастера</p>
              <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[8px] text-[#6B7280] sm:text-[9px]">
                <span className="inline-flex items-center gap-1">
                  <BY title="Беларусь" className="h-2.5 w-2.5 rounded-full object-cover" />
                  +375 29 123-45-67
                </span>
                <span className="inline-flex items-center gap-1">
                  <HiEnvelope className="h-2.5 w-2.5 text-[#9CA3AF]" aria-hidden />
                  {MASTER_LANDING_DEMO_MASTER_EMAIL}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CabinetIcon name="map-pin" size={10} className="text-[#9CA3AF]" />
                  Минск
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            data-master-demo="edit-profile"
            className={`${profileDashboardEditBtn} mt-2 w-full !min-h-8 !px-3 !py-1.5 !text-[10px] sm:!min-h-9 sm:!text-[11px] ${
              editPressed ? 'scale-[0.98] opacity-95' : ''
            }`}
          >
            <CabinetIcon name="pencil" size={13} />
            Редактировать профиль
          </button>
        </div>

        {!mobile ? <DemoProfileTabs mobile={false} /> : null}
      </section>

      <div
        className={`min-h-0 flex-1 ${mobile ? masterDemoMobileScrollClass : masterDemoDesktopScrollClass} px-2 pb-3 pt-2 sm:px-2.5 sm:pb-3.5 sm:pt-2.5`}
      >
        <div className="space-y-2 pb-1 sm:space-y-2.5">
          <section className={`${profileDashboardCard} overflow-hidden p-2.5 sm:p-3`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold text-[#111827] sm:text-[11px]">Профиль в каталоге</p>
                <p className="mt-0.5 text-[9px] text-[#6B7280]">Клиенты видят вас в поиске</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#22C55E] px-2 py-0.5 text-[9px] font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden />
                Активен
              </span>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <section className={`${profileDashboardCard} overflow-hidden p-2.5 sm:p-3`}>
              <DemoSectionHeading
                title="О себе"
                subtitle="Текст в публичном профиле"
                icon={<CabinetIcon name="chat" size={14} />}
              />
              <div className="mt-2 rounded-[10px] bg-[#f6f7fb] p-2 sm:p-2.5">
                <p className="text-[9px] leading-relaxed text-[#6B7280] sm:text-[10px]">{aboutPreview}</p>
              </div>
            </section>

            <section className={`${profileDashboardCard} overflow-hidden p-2.5 sm:p-3`}>
              <DemoSectionHeading
                title="Информация"
                subtitle="Статистика профиля"
                icon={<CabinetIcon name="user" size={14} />}
              />
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <DemoStatTile label="Рейтинг" value="4.9" icon={<HiStar className="h-3.5 w-3.5" aria-hidden />} />
                <DemoStatTile label="Записи" value="12" icon={<HiCalendarDays className="h-3.5 w-3.5" aria-hidden />} />
              </div>
              <div className="mt-1.5 rounded-[10px] bg-[#f6f7fb] px-2 py-1.5">
                <p className="text-[8px] font-medium text-[#9CA3AF]">Категория</p>
                <p className="mt-0.5 text-[10px] font-semibold text-[#F47C8C]">Маникюр</p>
              </div>
            </section>
          </div>

          <section className={`${profileDashboardCard} overflow-hidden p-2.5 sm:p-3`}>
            <div className="flex items-start justify-between gap-2">
              <DemoSectionHeading
                title="График работы"
                subtitle="Когда вы принимаете клиентов"
                icon={<CabinetIcon name="calendar" size={14} />}
              />
              <span className="shrink-0 text-[9px] font-semibold text-[#F47C8C]">Изменить</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт'].map((day) => (
                <span
                  key={day}
                  className="rounded-full bg-[#FFF1F4] px-2 py-0.5 text-[9px] font-semibold text-[#ff5f7a]"
                >
                  {day} 10:00–19:00
                </span>
              ))}
            </div>
          </section>

          <section className={`${profileDashboardCard} overflow-hidden p-2.5 sm:p-3`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold text-[#111827] sm:text-[11px]">Услуги в профиле</p>
              <span className="text-[9px] font-semibold text-[#F47C8C]">Все</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {[
                { title: 'Маникюр с покрытием', price: '45 BYN' },
                { title: 'Педикюр классический', price: '55 BYN' },
              ].map((service) => (
                <div
                  key={service.title}
                  className="flex items-center justify-between gap-2 rounded-[10px] bg-[#f6f7fb] px-2 py-1.5"
                >
                  <p className="truncate text-[9px] font-semibold text-[#111827] sm:text-[10px]">{service.title}</p>
                  <p className="shrink-0 text-[9px] font-bold text-[#ff5f7a] sm:text-[10px]">{service.price}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {mobile ? <DemoProfileTabs mobile /> : null}
    </div>
  );
};
