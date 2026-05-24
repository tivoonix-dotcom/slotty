import { useCallback, useEffect, useMemo, type FC } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BECOME_MASTER_PATH } from '../../app/paths';
import {
  LANDING_MASTERS_TAB_APPOINTMENTS,
  LANDING_MASTERS_TAB_OVERVIEW,
  LANDING_MASTERS_TAB_PROFILE,
  LANDING_MASTERS_TAB_SCHEDULE,
  LANDING_MASTERS_TAB_SERVICES,
  type LandingMastersTabId,
  parseLandingMastersTab,
} from '../../shared/layout/SlottyHeader/headerNav';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import { homeOutlineBtn, homePinkBtn, homeSection } from './homeTheme';

const MASTER_PREVIEW = '/photos/вымастер/1.png';

type MastersTab = {
  id: LandingMastersTabId;
  label: string;
  title: string;
  text: string;
};

const MASTERS_TABS: MastersTab[] = [
  {
    id: LANDING_MASTERS_TAB_PROFILE,
    label: 'Профиль',
    title: 'Профиль мастера',
    text: 'Аватар, описание, адрес, контакты, категории, сертификаты и портфолио — всё в одном месте.',
  },
  {
    id: LANDING_MASTERS_TAB_APPOINTMENTS,
    label: 'Заявки',
    title: 'Заявки клиентов',
    text: 'Новые, предстоящие и завершённые записи — принимайте, переносите и завершайте визиты без хаоса.',
  },
  {
    id: LANDING_MASTERS_TAB_SERVICES,
    label: 'Услуги',
    title: 'Услуги и цены',
    text: 'Добавляйте услуги, длительность, стоимость и описание — клиенты сразу видят актуальный прайс.',
  },
  {
    id: LANDING_MASTERS_TAB_SCHEDULE,
    label: 'График',
    title: 'График и окна',
    text: 'Рабочие дни, время приёма и свободные окна — клиент записывается только на реально доступное время.',
  },
  {
    id: LANDING_MASTERS_TAB_OVERVIEW,
    label: 'Сводка',
    title: 'Сводка и аналитика',
    text: 'Записи, выручка, активность клиентов и подсказки для роста — понятная картина по вашему бизнесу.',
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
  const navigate = useNavigate();
  const activeTabId = useMemo(() => parseLandingMastersTab(location.hash), [location.hash]);
  const activeTab = MASTERS_TABS.find((t) => t.id === activeTabId) ?? MASTERS_TABS[0];

  const setTab = useCallback(
    (id: LandingMastersTabId) => {
      navigate({ pathname: location.pathname, hash: id }, { replace: true });
    },
    [location.pathname, navigate],
  );

  useEffect(() => {
    if (location.pathname !== '/book' && location.pathname !== '/') return;
    if (!location.hash.includes('for-masters-')) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('for-masters')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.pathname]);

  return (
    <section id="for-masters" className={`${homeSection} scroll-mt-28`} aria-labelledby="home-masters-cta-heading">
      <div className="mx-auto max-w-[40rem] px-1 text-center sm:px-0">
        <h2
          id="home-masters-cta-heading"
          className="text-[clamp(1.5rem,4.5vw,2rem)] font-bold leading-[1.08] tracking-[-0.03em] text-[#111827]"
        >
          {isMasterUser ? 'Кабинет мастера' : 'Вы мастер?'}
        </h2>
        <p className="mt-2 text-[clamp(1.05rem,3vw,1.25rem)] font-semibold text-[#374151]">
          {isMasterUser ? 'Управляйте записями и профилем' : 'Принимайте записи без переписок'}
        </p>
      </div>

      <div
        className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:mt-8 sm:flex-wrap sm:justify-center sm:gap-2.5 [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Возможности кабинета мастера"
      >
        {MASTERS_TABS.map((tab) => {
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
        className="mt-6 flex flex-col items-center gap-6 text-center lg:mt-8 lg:flex-row lg:items-start lg:gap-10 lg:text-left"
      >
        <div className="w-full shrink-0 lg:sticky lg:top-28 lg:w-[min(100%,20.5rem)]">
          <h3 className="text-[clamp(1.25rem,3.5vw,1.65rem)] font-bold leading-[1.1] tracking-[-0.02em] text-[#111827]">
            {activeTab.title}
          </h3>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-[#6B7280] sm:text-[15px] lg:mx-0">
            {activeTab.text}
          </p>

          <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-2.5 lg:mx-0 lg:max-w-none">
            <Link to={masterCtaPath} className={`${homePinkBtn} min-h-12 w-full text-center text-[15px]`}>
              {masterCtaLabel}
            </Link>
            {isMasterUser ? null : (
              <Link to={BECOME_MASTER_PATH} className={`${homeOutlineBtn} min-h-12 w-full text-center text-[15px]`}>
                Регистрация мастера
              </Link>
            )}
          </div>
        </div>

        <div className="mx-auto h-[min(19rem,42dvh)] w-full max-w-[20rem] overflow-hidden sm:max-w-[22rem] lg:mx-0 lg:h-[min(37rem,76dvh)] lg:max-w-none lg:flex-1">
          <ImageReveal
            src={MASTER_PREVIEW}
            alt="Кабинет мастера SLOTTY"
            loading="lazy"
            draggable={false}
            className="block h-auto w-full object-contain object-top"
          />
        </div>
      </div>
    </section>
  );
};
