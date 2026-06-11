import { useEffect, type FC, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MASTER_START_PATH } from '../../app/paths';
import {
  LANDING_MASTERS_TAB_APPOINTMENTS,
  LANDING_MASTERS_TAB_PROFILE,
  LANDING_MASTERS_TAB_SERVICES,
  type LandingMastersTabId,
} from '../../shared/layout/SlottyHeader/headerNav';
import { MasterLandingBookingNotifyDemo } from './MasterLandingBookingNotifyDemo';
import { MasterLandingCabinetDemoFrame } from './MasterLandingCabinetDemoFrame';
import type { MasterLandingDesktopCabinetSection } from './MasterLandingDesktopCabinetShell';
import { MasterLandingProfileDemo } from './MasterLandingProfileDemo';
import { MasterLandingWindowDemo } from './MasterLandingWindowDemo';
import { LandingReveal } from './LandingReveal';
import {
  homeLandingHeading,
  homeLandingMastersDemoBleed,
  homeLandingMastersLead,
  homeLandingMastersRow,
  homeLandingMastersRowDemoCol,
  homeLandingMastersRowStep,
  homeLandingMastersRowText,
  homeLandingMastersRowTextCol,
  homeLandingMastersRowTitle,
  homeLandingMastersRows,
  homeLandingMastersShell,
  homeOutlineBtn,
  homePinkBtn,
  homeSection,
} from './homeTheme';

type MastersBlock = {
  id: LandingMastersTabId;
  title: string;
  text: string;
  demo: ReactNode;
  demoLabel: string;
  pageTitle: string;
  activeSection: MasterLandingDesktopCabinetSection;
  demoLayout?: 'drawer' | 'main';
};

const MASTERS_BLOCKS: MastersBlock[] = [
  {
    id: LANDING_MASTERS_TAB_APPOINTMENTS,
    title: 'Редактирование профиля',
    text: 'Заполните имя, контакты и описание — клиенты увидят актуальную карточку.',
    demo: <MasterLandingProfileDemo />,
    demoLabel: 'Демо: редактирование профиля',
    pageTitle: 'Профиль',
    activeSection: 'profile',
    demoLayout: 'main',
  },
  {
    id: LANDING_MASTERS_TAB_SERVICES,
    title: 'Создание расписания',
    text: 'Нажмите на блок «На сегодня» — и настройте окно за пару шагов.',
    demo: <MasterLandingWindowDemo />,
    demoLabel: 'Демо: создание расписания',
    pageTitle: 'Расписание',
    activeSection: 'schedule',
    demoLayout: 'main',
  },
  {
    id: LANDING_MASTERS_TAB_PROFILE,
    title: 'Уведомления',
    text: 'Заявки приходят в кабинет, Telegram и на почту — смотрите детали и подтверждайте в один клик.',
    demo: <MasterLandingBookingNotifyDemo />,
    demoLabel: 'Демо: уведомления мастера',
    pageTitle: 'Уведомления',
    activeSection: 'notifications',
    demoLayout: 'main',
  },
];

export type HomeForMastersProps = {
  masterCtaPath: string;
  masterCtaLabel: string;
  isMasterUser?: boolean;
};

export const HomeForMasters: FC<HomeForMastersProps> = ({
  masterCtaPath,
  masterCtaLabel,
  isMasterUser = false,
}) => {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash.replace(/^#/, '');
    if (!hash.startsWith('for-masters')) return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById('for-masters')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      const block = document.getElementById(hash);
      block?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  return (
    <section
      id="for-masters"
      className={`${homeSection} scroll-mt-28 overflow-x-hidden`}
      aria-labelledby="home-masters-heading"
    >
      <div className={`${homeLandingMastersShell} text-center`}>
        <h2 id="home-masters-heading" className={homeLandingHeading}>
          Для мастеров
        </h2>
        <p className={homeLandingMastersLead}>
          Кабинет, где мастер управляет записями, услугами, графиком и заявками в одном месте.
        </p>
      </div>

      <div className={homeLandingMastersShell}>
        <div className={homeLandingMastersRows}>
          {MASTERS_BLOCKS.map((block, index) => (
            <article key={block.id} id={block.id} className={homeLandingMastersRow}>
              <LandingReveal
                className={homeLandingMastersRowTextCol}
                variant="left"
                delay={60 + index * 80}
                duration={950}
              >
                <p className={homeLandingMastersRowStep} aria-hidden>
                  {index + 1}.
                </p>
                <h3 className={homeLandingMastersRowTitle}>{block.title}</h3>
                <p className={homeLandingMastersRowText}>{block.text}</p>
              </LandingReveal>

              <LandingReveal
                className={`${homeLandingMastersRowDemoCol} ${homeLandingMastersDemoBleed}`}
                variant="right"
                delay={120 + index * 80}
                duration={1050}
              >
                <MasterLandingCabinetDemoFrame
                  ariaLabel={block.demoLabel}
                  pageTitle={block.pageTitle}
                  activeSection={block.activeSection}
                  demoLayout={block.demoLayout}
                >
                  {block.demo}
                </MasterLandingCabinetDemoFrame>
              </LandingReveal>
            </article>
          ))}
        </div>
      </div>

      <div
        className={`${homeLandingMastersShell} mx-auto mt-10 flex max-w-lg gap-2 sm:mt-14 sm:gap-3 ${
          isMasterUser ? 'max-w-md' : ''
        }`}
      >
        {!isMasterUser && (
          <Link
            to={masterCtaPath}
            className={`${homePinkBtn} font-landing min-h-12 flex-1 text-center text-[13px] shadow-none sm:text-[14px]`}
          >
            {masterCtaLabel}
          </Link>
        )}
        {!isMasterUser && (
          <Link
            to={MASTER_START_PATH}
            className={`${homeOutlineBtn} font-landing min-h-12 flex-1 text-center text-[13px] sm:text-[14px]`}
          >
            Регистрация мастера
          </Link>
        )}
      </div>
    </section>
  );
};
