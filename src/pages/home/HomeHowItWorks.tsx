import { useCallback, useEffect, useMemo, type FC } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getProfilePath } from '../../app/paths';
import {
  LANDING_HOW_TAB_BOOKING,
  LANDING_HOW_TAB_HISTORY,
  LANDING_HOW_TAB_REMINDERS,
  LANDING_HOW_TAB_SERVICE,
  LANDING_HOW_TAB_SLOTS,
  type LandingHowTabId,
  parseLandingHowTab,
} from '../../shared/layout/SlottyHeader/headerNav';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import { homeOutlineBtn, homePinkBtn, homeSection } from './homeTheme';

const howItWorksPhoto = (file: string) => `/photos/how-it-works/${file}`;

const BENTO_ROUND = 'overflow-hidden rounded-[20px] sm:rounded-[28px]';
const BENTO_SURFACE = 'bg-[#FAF7F4]';

/** Высота ряда: фото-блок задаёт минимум, текст подтягивается. */
const HOW_TEXT_MIN_H = 'sm:min-h-[18rem]';
const HOW_PHOTO_MIN_H = 'min-h-[30rem] sm:min-h-[36rem] lg:min-h-[42rem]';

type HowTab = {
  id: LandingHowTabId;
  label: string;
  stepLabel: string;
  title: string;
  text: string;
  imageSrc: string;
  imageAlt: string;
};

const HOW_TABS: HowTab[] = [
  {
    id: LANDING_HOW_TAB_SERVICE,
    label: 'Выбор услуги',
    stepLabel: 'Шаг 1',
    title: 'Выберите услугу',
    text: 'Откройте каталог, выберите категорию, мастера или конкретную услугу — всё в одном месте.',
    imageSrc: howItWorksPhoto('1.webp'),
    imageAlt: 'Выбор услуги в приложении',
  },
  {
    id: LANDING_HOW_TAB_SLOTS,
    label: 'Свободное время',
    stepLabel: 'Шаг 2',
    title: 'Выберите время',
    text: 'Смотрите реальные свободные окна мастера и доступные даты без звонков и переписок.',
    imageSrc: howItWorksPhoto('2.webp'),
    imageAlt: 'Выбор даты и времени',
  },
  {
    id: LANDING_HOW_TAB_BOOKING,
    label: 'Заявка на запись',
    stepLabel: 'Шаг 3',
    title: 'Запишитесь',
    text: 'Подтвердите визит в пару кликов — мастер сразу увидит заявку в своём кабинете.',
    imageSrc: howItWorksPhoto('3.webp'),
    imageAlt: 'Подтверждение записи',
  },
  {
    id: LANDING_HOW_TAB_REMINDERS,
    label: 'Напоминания',
    stepLabel: 'Шаг 4',
    title: 'Получите напоминание',
    text: 'Подтверждение и напоминание придут в Telegram — меньше неявок и забытых визитов.',
    imageSrc: howItWorksPhoto('4.webp'),
    imageAlt: 'Напоминание о записи',
  },
  {
    id: LANDING_HOW_TAB_HISTORY,
    label: 'История записей',
    stepLabel: 'Шаг 5',
    title: 'Все записи под рукой',
    text: 'Будущие и прошлые визиты хранятся в профиле — удобно перенести, отменить или записаться снова.',
    imageSrc: howItWorksPhoto('5.webp'),
    imageAlt: 'История записей',
  },
];

function StepBadge({ children }: { children: string }) {
  return (
    <span className="mb-3 inline-flex w-fit rounded-full bg-white/90 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] sm:mb-4 sm:px-4 sm:py-1.5 sm:text-[12px] sm:tracking-[0.14em]">
      {children}
    </span>
  );
}

export const HomeHowItWorks: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTabId = useMemo(() => parseLandingHowTab(location.hash), [location.hash]);
  const activeTab = HOW_TABS.find((t) => t.id === activeTabId) ?? HOW_TABS[0];

  const setTab = useCallback(
    (id: LandingHowTabId) => {
      navigate({ pathname: location.pathname, hash: id }, { replace: true });
    },
    [location.pathname, navigate],
  );

  useEffect(() => {
    if (location.pathname !== '/book' && location.pathname !== '/') return;
    if (!location.hash.includes('how-')) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.pathname]);

  return (
    <section id="how-it-works" className={`${homeSection} scroll-mt-28`} aria-labelledby="home-how-heading">
      <div className="mx-auto max-w-[40rem] px-1 text-center sm:px-0">
        <h2
          id="home-how-heading"
          className="text-[clamp(1.75rem,5.5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#111827]"
        >
          Как работает запись
        </h2>
      </div>

      <div
        className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:mt-8 sm:flex-wrap sm:justify-center sm:gap-2.5 [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Шаги записи"
      >
        {HOW_TABS.map((tab) => {
          const on = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={tab.id}
              id={`${tab.id}-tab`}
              onClick={() => setTab(tab.id)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-[13px] font-semibold transition sm:text-[14px] ${
                on
                  ? 'bg-[#F47C8C] text-white shadow-[0_4px_14px_rgba(244,124,140,0.28)]'
                  : 'bg-[#F5F5F5] text-[#374151] hover:bg-[#EBEBEB]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        id={activeTab.id}
        role="tabpanel"
        aria-labelledby={`${activeTab.id}-tab`}
        className="mt-6 grid grid-cols-1 gap-2.5 sm:mt-8 sm:grid-cols-12 sm:items-stretch sm:gap-4 lg:gap-5"
      >
        <article
          className={`${BENTO_ROUND} ${BENTO_SURFACE} ${HOW_TEXT_MIN_H} flex h-full flex-col justify-center p-5 sm:col-span-5 sm:p-8 lg:col-span-5 lg:p-10`}
        >
          <StepBadge>{activeTab.stepLabel}</StepBadge>
          <h3 className="text-[1.375rem] font-bold leading-[1.1] tracking-[-0.02em] text-[#111827] sm:text-[clamp(1.5rem,4.5vw,2.25rem)] sm:leading-[1.08] sm:tracking-[-0.03em]">
            {activeTab.title}
          </h3>
          <p className="mt-2 text-[15px] leading-[1.5] text-[#4B5563] sm:mt-3 sm:max-w-[28rem] sm:text-[18px] sm:leading-[1.5]">
            {activeTab.text}
          </p>
          {activeTab.id === LANDING_HOW_TAB_HISTORY ? (
            <Link to={getProfilePath('appointments')} className={`${homePinkBtn} mt-5 w-fit sm:mt-6`}>
              Мои записи
            </Link>
          ) : null}
        </article>

        <div
          className={`min-w-0 self-stretch sm:col-span-7 sm:h-full lg:col-span-7 ${HOW_PHOTO_MIN_H}`}
        >
          <article
            className={`${BENTO_ROUND} ${BENTO_SURFACE} relative h-full w-full sm:min-h-0`}
          >
            <ImageReveal
              src={activeTab.imageSrc}
              alt={activeTab.imageAlt}
              loading="lazy"
              draggable={false}
              className="absolute inset-0 block h-full w-full object-cover object-top"
            />
          </article>
        </div>
      </div>

      <p className="mt-4 text-center sm:mt-5">
        <button type="button" onClick={() => setTab(LANDING_HOW_TAB_SERVICE)} className={homeOutlineBtn}>
          Смотреть с первого шага
        </button>
      </p>
    </section>
  );
};
