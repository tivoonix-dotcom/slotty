import { useCallback, useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  HiBell,
  HiChevronDown,
  HiSquares2X2,
  HiUser,
} from 'react-icons/hi2';

import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import {
  ADMIN_LOGIN_METHODS_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_PATH,
  BECOME_MASTER_PATH,
  getLoginPath,
  getProfilePath,
  HUB_PATH,
  MASTERS_PATH,
  PROFILE_PATH,
  SERVICES_PATH,
} from '../../../app/paths';
import { useAuth } from '../../../features/auth/AuthProvider';
import { resolveMasterEntryPath } from '../../../features/auth/lib/resolveMasterEntryPath';
import { useIsMasterUser } from '../../../features/profile/hooks/useIsMasterUser';
import { setProfileRole } from '../../../features/profile/lib/setProfileRole';
import { useTelegram } from '../../hooks/useTelegram';
import {
  landingAnchorHref,
  LANDING_ANCHOR_FAQ,
  LANDING_ANCHOR_FOR_MASTERS,
  LANDING_ANCHOR_HOW,
  LANDING_ANCHOR_TARIFFS,
  SLOTTY_NAV_CATALOG,
  SLOTTY_NAV_MASTERS,
} from './headerNav';

const iconBtn =
  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[#374151] transition hover:bg-[#E9E6E6] hover:text-[#F47C8C] active:scale-[0.97]';

const masterCtaClass =
  'inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#F47C8C] to-[#F26D83] px-4 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(244,124,140,0.28)] transition hover:opacity-95 active:scale-[0.98]';

const navTriggerClass =
  'inline-flex items-center gap-1.5 rounded-full px-1 py-2 text-[15px] font-semibold text-[#374151] transition hover:text-[#F47C8C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C8C]/40';

const activeNavTriggerClass = 'text-[#F47C8C]';

type Variant = 'landing' | 'bar';

export type SlottyHeaderProps = {
  variant?: Variant;
};

type MegaMenuKey = 'catalog' | 'masters' | 'how' | 'mastersFor' | 'tariffs';
type MegaMenuItem = {
  title: string;
  description: string;
  badge?: string;
  to?: string;
  anchor?: string;
  accent?: 'pink' | 'violet' | 'blue' | 'green' | 'orange';
};

type MegaMenuGroup = {
  label: string;
  to?: string;
  anchor?: string;
  items: MegaMenuItem[];
};

const MEGA_MENU: Record<MegaMenuKey, MegaMenuGroup> = {
  catalog: {
    label: 'Каталог',
    to: SERVICES_PATH,
    items: [
      {
        title: 'Маникюр',
        badge: 'POPULAR',
        description: 'Мастера рядом, цены, свободные окна и быстрая запись.',
        to: SERVICES_PATH,
        accent: 'pink',
      },
      {
        title: 'Барберы',
        description: 'Стрижки, борода, уход, портфолио мастеров и отзывы.',
        to: SERVICES_PATH,
        accent: 'blue',
      },
      {
        title: 'Брови и ресницы',
        description: 'Коррекция, окрашивание, ламинирование и запись без переписок.',
        to: SERVICES_PATH,
        accent: 'violet',
      },
      {
        title: 'Массаж',
        description: 'Подбор мастера по району, цене, рейтингу и ближайшему времени.',
        to: SERVICES_PATH,
        accent: 'green',
      },
      {
        title: 'Фитнес и тату',
        badge: 'NEW',
        description: 'Категории, где важны портфолио, расписание и доверие.',
        to: SERVICES_PATH,
        accent: 'orange',
      },
    ],
  },

  masters: {
    label: 'Мастера',
    to: MASTERS_PATH,
    items: [
      {
        title: 'Лучшие мастера',
        description: 'Карточки специалистов с рейтингом, услугами, адресом и фото работ.',
        to: MASTERS_PATH,
        accent: 'pink',
      },
      {
        title: 'Свободные окна',
        badge: 'FAST',
        description: 'Показываем, когда можно записаться сегодня, завтра или на неделе.',
        to: MASTERS_PATH,
        accent: 'blue',
      },
      {
        title: 'Портфолио',
        description: 'Фото работ, сертификаты и визуальная проверка качества мастера.',
        to: MASTERS_PATH,
        accent: 'violet',
      },
      {
        title: 'Отзывы клиентов',
        description: 'Помогают выбрать мастера быстрее и повышают доверие к записи.',
        to: MASTERS_PATH,
        accent: 'green',
      },
      {
        title: 'Запись 24/7',
        description: 'Клиент выбирает услугу, время и отправляет заявку без звонков.',
        to: MASTERS_PATH,
        accent: 'orange',
      },
    ],
  },

  how: {
    label: 'Как это работает',
    anchor: LANDING_ANCHOR_HOW,
    items: [
      {
        title: 'Выбор услуги',
        description: 'Клиент открывает каталог, выбирает категорию, мастера или услугу.',
        anchor: LANDING_ANCHOR_HOW,
        accent: 'pink',
      },
      {
        title: 'Свободное время',
        description: 'Система показывает реальные окна мастера и доступные даты.',
        anchor: LANDING_ANCHOR_HOW,
        accent: 'blue',
      },
      {
        title: 'Заявка на запись',
        description: 'Клиент оставляет заявку, а мастер видит ее в своем кабинете.',
        anchor: LANDING_ANCHOR_HOW,
        accent: 'violet',
      },
      {
        title: 'Telegram-напоминания',
        badge: 'AUTO',
        description: 'Напоминания помогают не забывать о записи и уменьшают неявки.',
        anchor: LANDING_ANCHOR_HOW,
        accent: 'green',
      },
      {
        title: 'История записей',
        description: 'Будущие и прошлые записи хранятся в понятном интерфейсе.',
        anchor: LANDING_ANCHOR_HOW,
        accent: 'orange',
      },
    ],
  },

  mastersFor: {
    label: 'Для мастеров',
    anchor: LANDING_ANCHOR_FOR_MASTERS,
    items: [
      {
        title: 'Профиль мастера',
        badge: 'PRO',
        description: 'Аватар, описание, адрес, контакты, категории, сертификаты и портфолио.',
        anchor: LANDING_ANCHOR_FOR_MASTERS,
        accent: 'pink',
      },
      {
        title: 'Заявки клиентов',
        description: 'Новые, предстоящие и завершенные записи в одном удобном месте.',
        anchor: LANDING_ANCHOR_FOR_MASTERS,
        accent: 'blue',
      },
      {
        title: 'Услуги и цены',
        description: 'Мастер сам добавляет услуги, длительность, стоимость и описание.',
        anchor: LANDING_ANCHOR_FOR_MASTERS,
        accent: 'violet',
      },
      {
        title: 'График и окна',
        description: 'Рабочие дни, время приема, свободные окна и управление расписанием.',
        anchor: LANDING_ANCHOR_FOR_MASTERS,
        accent: 'green',
      },
      {
        title: 'Сводка и аналитика',
        description: 'Записи, выручка, активность клиентов и подсказки для роста.',
        anchor: LANDING_ANCHOR_FOR_MASTERS,
        accent: 'orange',
      },
    ],
  },

  tariffs: {
    label: 'Тарифы',
    anchor: LANDING_ANCHOR_TARIFFS,
    items: [
      {
        title: 'Free',
        badge: 'START',
        description: 'Базовый профиль мастера и возможность принимать первые заявки.',
        anchor: LANDING_ANCHOR_TARIFFS,
        accent: 'pink',
      },
      {
        title: 'Pro',
        badge: 'BEST',
        description: 'Больше возможностей для мастера, продвижения и управления записями.',
        anchor: LANDING_ANCHOR_TARIFFS,
        accent: 'blue',
      },
      {
        title: 'Умные акции',
        description: 'Автоматические предложения на свободные окна, чтобы не терять время.',
        anchor: LANDING_ANCHOR_TARIFFS,
        accent: 'violet',
      },
      {
        title: 'Приоритет',
        description: 'Больше видимости в каталоге и лучшее оформление карточки мастера.',
        anchor: LANDING_ANCHOR_TARIFFS,
        accent: 'green',
      },
      {
        title: 'Подключение',
        description: 'Быстрый старт: профиль, услуги, расписание и первые клиенты.',
        anchor: LANDING_ANCHOR_TARIFFS,
        accent: 'orange',
      },
    ],
  },
};

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <div className="relative h-5 w-5" aria-hidden>
      <span
        className={`absolute left-0 top-1/2 h-[2px] w-5 rounded-full bg-black transition-all duration-300 ${
          open ? 'translate-y-0 rotate-45' : '-translate-y-[6px]'
        }`}
      />
      <span
        className={`absolute left-0 top-1/2 h-[2px] w-5 rounded-full bg-black transition-all duration-300 ${
          open ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <span
        className={`absolute left-0 top-1/2 h-[2px] w-5 rounded-full bg-black transition-all duration-300 ${
          open ? 'translate-y-0 -rotate-45' : 'translate-y-[6px]'
        }`}
      />
    </div>
  );
}

function HeaderShell({
  variant,
  children,
  innerClassName = '',
}: {
  variant: Variant;
  children: ReactNode;
  innerClassName?: string;
}) {
  if (variant === 'bar') {
    return (
      <header className="sticky top-0 z-50 hidden border-b border-[#F3F4F6] bg-[#FFFCFC]/95 backdrop-blur-md lg:block">
        <div className={`mx-auto max-w-[1100px] px-6 ${innerClassName}`}>{children}</div>
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-[calc(0.5rem+env(safe-area-inset-top,0px))]">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <div
          className={`overflow-visible rounded-[30px] bg-[#F1EFEF]/95 shadow-[0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 ${innerClassName}`}
        >
          {children}
        </div>
      </div>
    </header>
  );
}

export function SlottyHeader({ variant = 'landing' }: SlottyHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isTelegramWebApp } = useTelegram();
  const { isAuthenticated, profile, logout } = useAuth();
  const isMasterUser = useIsMasterUser();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [megaOpenKey, setMegaOpenKey] = useState<MegaMenuKey | null>(null);
  const [megaPanelKey, setMegaPanelKey] = useState<MegaMenuKey | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const megaCloseTimerRef = useRef<number | null>(null);

  const masterHref = resolveMasterEntryPath({ isAuthenticated, isMasterUser });
  const masterCtaLabel = isMasterUser ? 'Кабинет мастера' : 'Стать мастером';
  const loginReturnPath = `${location.pathname}${location.search}`;
  const loginHref = getLoginPath(loginReturnPath);
  const appointmentsHref = isAuthenticated ? getProfilePath('appointments') : loginHref;
  const loginMethodsHref = isMasterUser ? ADMIN_LOGIN_METHODS_PATH : getProfilePath('settings');

  const showDesktopChrome = !isTelegramWebApp && variant === 'bar';
  const showLandingDesktop = !isTelegramWebApp && variant === 'landing';
  const compactMobile = isTelegramWebApp || variant === 'bar';

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const cancelMegaClose = useCallback(() => {
    if (megaCloseTimerRef.current) {
      window.clearTimeout(megaCloseTimerRef.current);
      megaCloseTimerRef.current = null;
    }
  }, []);

  const closeMegaMenu = useCallback(() => {
    cancelMegaClose();
    setMegaOpenKey(null);
  }, [cancelMegaClose]);

  const scheduleMegaClose = useCallback(() => {
    cancelMegaClose();
    megaCloseTimerRef.current = window.setTimeout(() => {
      setMegaOpenKey(null);
      megaCloseTimerRef.current = null;
    }, 180);
  }, [cancelMegaClose]);

  const scrollToLandingAnchor = useCallback(
    (anchor: string) => {
      closeMobileMenu();
      closeMegaMenu();

      const onHub = location.pathname === HUB_PATH || location.pathname === '/';

      if (onHub) {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `${HUB_PATH}#${anchor}`);
        return;
      }

      navigate(landingAnchorHref(anchor));
    },
    [closeMobileMenu, closeMegaMenu, location.pathname, navigate],
  );

  const goAppointments = useCallback(() => {
    closeMobileMenu();
    closeMegaMenu();
    void setProfileRole('client');
    navigate(appointmentsHref);
  }, [appointmentsHref, closeMegaMenu, closeMobileMenu, navigate]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!profileOpen) return;

    const onPointer = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };

    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [profileOpen]);

  useEffect(() => {
    return () => {
      cancelMegaClose();
    };
  }, [cancelMegaClose]);

  useEffect(() => {
    if (megaOpenKey) {
      setMegaPanelKey(megaOpenKey);
      return;
    }

    const timer = window.setTimeout(() => setMegaPanelKey(null), MEGA_PANEL_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [megaOpenKey]);

  const megaMenuOpen = megaOpenKey !== null;
  const megaHostProps = {
    onMouseEnter: cancelMegaClose,
    onMouseLeave: scheduleMegaClose,
  };

  if (variant === 'bar' && isTelegramWebApp) {
    return null;
  }

  const desktopCenterNav = (
    <DesktopMegaNav
      openKey={megaOpenKey}
      onOpen={setMegaOpenKey}
      onForceClose={closeMegaMenu}
      onAnchorClick={scrollToLandingAnchor}
    />
  );

  const goCatalog = useCallback(() => {
    closeMobileMenu();
    closeMegaMenu();
    void setProfileRole('client');
    navigate(SERVICES_PATH);
  }, [closeMegaMenu, closeMobileMenu, navigate]);

  const goClientProfile = useCallback(() => {
    closeMobileMenu();
    closeMegaMenu();
    void setProfileRole('client');
    navigate(isAuthenticated ? PROFILE_PATH : loginHref);
  }, [closeMegaMenu, closeMobileMenu, isAuthenticated, loginHref, navigate]);

  const desktopActions = (
    <div className="hidden shrink-0 items-center gap-2 lg:flex">
      <button
        type="button"
        onClick={() => void goCatalog()}
        className={iconBtn}
        aria-label="Каталог"
        title="Каталог услуг"
      >
        <HiSquares2X2 className="h-5 w-5" aria-hidden />
      </button>

      {isAuthenticated && isMasterUser ? (
        <Link
          to={ADMIN_NOTIFICATIONS_PATH}
          className={iconBtn}
          aria-label="Уведомления"
          title="Уведомления"
        >
          <HiBell className="h-5 w-5" aria-hidden />
        </Link>
      ) : null}

      {isAuthenticated ? (
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className={`${iconBtn} gap-1.5 px-2.5 pr-3`}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            aria-label="Профиль"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <HiUser className="h-5 w-5" aria-hidden />
            )}

            <HiChevronDown className="h-4 w-4 opacity-60" aria-hidden />
          </button>

          {profileOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-[90] min-w-[13.5rem] overflow-hidden rounded-[20px] border border-[#F3F4F6] bg-white py-1.5 shadow-[0_16px_48px_rgba(17,24,39,0.12)]"
            >
              <ProfileMenuItem
                onClick={() => {
                  setProfileOpen(false);
                  void goAppointments();
                }}
              >
                Мои записи
              </ProfileMenuItem>

              <ProfileMenuItem
                to={PROFILE_PATH}
                onNavigate={() => {
                  setProfileOpen(false);
                  void setProfileRole('client');
                }}
              >
                Профиль
              </ProfileMenuItem>

              <ProfileMenuItem to={loginMethodsHref} onNavigate={() => setProfileOpen(false)}>
                Способы входа
              </ProfileMenuItem>

              {isMasterUser ? (
                <ProfileMenuItem to={ADMIN_PATH} onNavigate={() => setProfileOpen(false)}>
                  Кабинет мастера
                </ProfileMenuItem>
              ) : (
                <ProfileMenuItem to={BECOME_MASTER_PATH} onNavigate={() => setProfileOpen(false)}>
                  Стать мастером
                </ProfileMenuItem>
              )}

              <div className="my-1 border-t border-[#F3F4F6]" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="block w-full px-4 py-2.5 text-left text-[14px] font-medium text-[#374151] transition hover:bg-[#F7F7F8]"
              >
                Выйти
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <Link
          to={loginHref}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#F1EFEF] px-3.5 text-[14px] font-semibold text-[#111827] transition hover:bg-[#E9E6E6]"
        >
          <HiUser className="h-5 w-5 text-[#6B7280]" aria-hidden />
          Войти
        </Link>
      )}

      <Link to={masterHref} className={masterCtaClass}>
        {masterCtaLabel}
      </Link>
    </div>
  );

  const topBar = (
    <div className="flex items-center justify-between gap-3 px-4 py-2 sm:px-5 sm:py-2.5">
      <Link
        to={HUB_PATH}
        aria-label="SLOTTY — на главную"
        className="inline-flex h-9 shrink-0 items-center overflow-visible outline-none transition hover:opacity-60 sm:h-10"
        onClick={closeMegaMenu}
      >
        <img
          src={HEADER_LOGO_SRC}
          alt=""
          decoding="async"
          loading="eager"
          fetchPriority="high"
          className="h-9 w-auto origin-center object-contain [transform:translateY(0.25rem)_scale(1.56)] sm:h-10 sm:[transform:translateY(0.35rem)_scale(1.5)]"
        />
      </Link>

      {showLandingDesktop || showDesktopChrome ? (
        <>
          {desktopCenterNav}
          {desktopActions}
        </>
      ) : null}

      {compactMobile ? (
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => void goCatalog()}
            className={iconBtn}
            aria-label="Каталог"
            title="Каталог"
          >
            <HiSquares2X2 className="h-5 w-5" aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => void goClientProfile()}
            className={iconBtn}
            aria-label={isAuthenticated ? 'Профиль' : 'Войти'}
            title={isAuthenticated ? 'Профиль' : 'Войти'}
          >
            {isAuthenticated && profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <HiUser className="h-5 w-5" aria-hidden />
            )}
          </button>

          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="slotty-mobile-menu"
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="relative z-50 flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5 active:scale-95"
          >
            <BurgerIcon open={mobileMenuOpen} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-controls="slotty-mobile-menu"
          aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="relative z-50 flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5 active:scale-95 lg:hidden"
        >
          <BurgerIcon open={mobileMenuOpen} />
        </button>
      )}
    </div>
  );

  const mobileMenu = (
    <div
      id="slotty-mobile-menu"
      className={`overflow-hidden transition-all duration-300 lg:hidden ${
        mobileMenuOpen ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="pb-5 pl-7 pr-4 pt-1 sm:pl-9 sm:pr-5">
        <nav aria-label="Меню">
          <ul className="flex flex-col">
            <li>
              <Link
                to={SERVICES_PATH}
                className="block py-3.5 text-[18px] font-medium text-neutral-900"
                onClick={() => {
                  closeMobileMenu();
                  void setProfileRole('client');
                }}
              >
                Каталог
              </Link>
            </li>

            <li>
              <Link
                to={MASTERS_PATH}
                className="block py-3.5 text-[18px] font-medium text-neutral-900"
                onClick={() => {
                  closeMobileMenu();
                  void setProfileRole('client');
                }}
              >
                Мастера
              </Link>
            </li>

            <li>
              <button
                type="button"
                className="block w-full py-3.5 text-left text-[18px] font-medium text-neutral-900"
                onClick={() => {
                  closeMobileMenu();
                  void goAppointments();
                }}
              >
                Мои записи
              </button>
            </li>

            <li>
              <button
                type="button"
                className="block w-full py-3.5 text-left text-[18px] font-medium text-neutral-900"
                onClick={() => scrollToLandingAnchor(LANDING_ANCHOR_HOW)}
              >
                Как это работает
              </button>
            </li>

            <li>
              <button
                type="button"
                className="block w-full py-3.5 text-left text-[18px] font-medium text-neutral-900"
                onClick={() => scrollToLandingAnchor(LANDING_ANCHOR_FOR_MASTERS)}
              >
                Для мастеров
              </button>
            </li>

            <li>
              <button
                type="button"
                className="block w-full py-3.5 text-left text-[18px] font-medium text-neutral-900"
                onClick={() => scrollToLandingAnchor(LANDING_ANCHOR_TARIFFS)}
              >
                Тарифы
              </button>
            </li>

            <li>
              <button
                type="button"
                className="block w-full py-3.5 text-left text-[18px] font-medium text-neutral-900"
                onClick={() => scrollToLandingAnchor(LANDING_ANCHOR_FAQ)}
              >
                FAQ
              </button>
            </li>

            <li>
              {isAuthenticated ? (
                <Link
                  to={PROFILE_PATH}
                  className="block py-3.5 text-[18px] font-medium text-neutral-900"
                  onClick={closeMobileMenu}
                >
                  Профиль
                </Link>
              ) : (
                <Link
                  to={loginHref}
                  className="block py-3.5 text-[18px] font-medium text-neutral-900"
                  onClick={closeMobileMenu}
                >
                  Войти
                </Link>
              )}
            </li>
          </ul>
        </nav>

        <div className="mt-4">
          <Link
            to={masterHref}
            onClick={closeMobileMenu}
            className={`${masterCtaClass} w-full text-center`}
          >
            {masterCtaLabel}
          </Link>
        </div>
      </div>
    </div>
  );

  if (variant === 'bar') {
    return (
      <HeaderShell variant="bar">
        <div className="flex flex-col" {...megaHostProps}>
          <div className="flex h-[4.25rem] items-center gap-4">
            <Link to={HUB_PATH} className="inline-flex shrink-0" aria-label="SLOTTY" onClick={closeMegaMenu}>
              <img src={HEADER_LOGO_SRC} alt="" className="h-9 w-auto object-contain" decoding="async" />
            </Link>

            {desktopCenterNav}
            {desktopActions}
          </div>

          <HeaderMegaDropdown
            isOpen={megaMenuOpen}
            panelKey={megaPanelKey}
            onAnchorClick={scrollToLandingAnchor}
            onForceClose={closeMegaMenu}
          />
        </div>
      </HeaderShell>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-40 cursor-default bg-transparent transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Закрыть меню"
        tabIndex={-1}
        onClick={closeMobileMenu}
      />

      <HeaderShell
        variant="landing"
        innerClassName={
          megaMenuOpen
            ? 'shadow-[0_24px_70px_rgba(244,124,140,0.14),0_12px_40px_rgba(17,24,39,0.08)]'
            : ''
        }
      >
        <div className="relative" {...megaHostProps}>
          {topBar}
          <HeaderMegaDropdown
            isOpen={megaMenuOpen}
            panelKey={megaPanelKey}
            onAnchorClick={scrollToLandingAnchor}
            onForceClose={closeMegaMenu}
          />
          {mobileMenu}
        </div>
      </HeaderShell>
    </>
  );
}

function DesktopMegaNav({
  openKey,
  onOpen,
  onForceClose,
  onAnchorClick,
}: {
  openKey: MegaMenuKey | null;
  onOpen: (key: MegaMenuKey) => void;
  onForceClose: () => void;
  onAnchorClick: (anchor: string) => void;
}) {
  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      onForceClose();
    }
  };

  return (
    <div className="relative hidden min-w-0 flex-1 items-center justify-center lg:flex" onBlur={handleBlur}>
      <nav className="flex items-center justify-center gap-6 xl:gap-8" aria-label="Основное меню">
        <MegaTrigger
          menuKey="catalog"
          label={SLOTTY_NAV_CATALOG.label}
          to={SLOTTY_NAV_CATALOG.to}
          openKey={openKey}
          onOpen={onOpen}
          onForceClose={onForceClose}
        />

        <MegaTrigger
          menuKey="masters"
          label={SLOTTY_NAV_MASTERS.label}
          to={SLOTTY_NAV_MASTERS.to}
          openKey={openKey}
          onOpen={onOpen}
          onForceClose={onForceClose}
        />

        <MegaTrigger
          menuKey="how"
          label="Как это работает"
          anchor={LANDING_ANCHOR_HOW}
          openKey={openKey}
          onOpen={onOpen}
          onForceClose={onForceClose}
          onAnchorClick={onAnchorClick}
        />

        <MegaTrigger
          menuKey="mastersFor"
          label="Для мастеров"
          anchor={LANDING_ANCHOR_FOR_MASTERS}
          openKey={openKey}
          onOpen={onOpen}
          onForceClose={onForceClose}
          onAnchorClick={onAnchorClick}
        />

        <MegaTrigger
          menuKey="tariffs"
          label="Тарифы"
          anchor={LANDING_ANCHOR_TARIFFS}
          openKey={openKey}
          onOpen={onOpen}
          onForceClose={onForceClose}
          onAnchorClick={onAnchorClick}
        />
      </nav>
    </div>
  );
}

const MEGA_PANEL_CLOSE_MS = 520;

function useMegaCardReveal(animateIn: boolean) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!animateIn) {
      setRevealed(false);
      return;
    }

    const frame = requestAnimationFrame(() => {
      setRevealed(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [animateIn]);

  return revealed;
}

function HeaderMegaDropdown({
  isOpen,
  panelKey,
  onAnchorClick,
  onForceClose,
}: {
  isOpen: boolean;
  panelKey: MegaMenuKey | null;
  onAnchorClick: (anchor: string) => void;
  onForceClose: () => void;
}) {
  const group = panelKey ? MEGA_MENU[panelKey] : null;

  return (
    <div
      className={`hidden transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:grid ${
        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="min-h-0 overflow-hidden">
        {group ? (
          <MegaPanel
            key={panelKey}
            group={group}
            animateIn={isOpen}
            onAnchorClick={onAnchorClick}
            onForceClose={onForceClose}
          />
        ) : null}
      </div>
    </div>
  );
}

function MegaTrigger({
  menuKey,
  label,
  to,
  anchor,
  openKey,
  onOpen,
  onForceClose,
  onAnchorClick,
}: {
  menuKey: MegaMenuKey;
  label: string;
  to?: string;
  anchor?: string;
  openKey: MegaMenuKey | null;
  onOpen: (key: MegaMenuKey) => void;
  onForceClose: () => void;
  onAnchorClick?: (anchor: string) => void;
}) {
  const opened = openKey === menuKey;

  if (to) {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `${navTriggerClass} ${isActive || opened ? activeNavTriggerClass : ''}`
        }
        onMouseEnter={() => onOpen(menuKey)}
        onFocus={() => onOpen(menuKey)}
        onClick={() => {
          onForceClose();
          void setProfileRole('client');
        }}
      >
        {label}
      </NavLink>
    );
  }

  return (
    <button
      type="button"
      className={`${navTriggerClass} ${opened ? activeNavTriggerClass : ''}`}
      onMouseEnter={() => onOpen(menuKey)}
      onFocus={() => onOpen(menuKey)}
      onClick={() => {
        if (anchor && onAnchorClick) onAnchorClick(anchor);
      }}
    >
      {label}
    </button>
  );
}

function MegaPanel({
  group,
  animateIn,
  onAnchorClick,
  onForceClose,
}: {
  group: MegaMenuGroup;
  animateIn: boolean;
  onAnchorClick: (anchor: string) => void;
  onForceClose: () => void;
}) {
  return (
    <div className="relative px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
      <div className="pointer-events-none absolute -bottom-16 left-1/2 h-32 w-[70%] -translate-x-1/2 rounded-full bg-[#F47C8C]/10 blur-3xl" />

      <div className="relative grid grid-cols-5 gap-3">
        {group.items.map((item, index) => (
          <MegaCard
            key={`${item.title}-${index}`}
            item={item}
            index={index}
            animateIn={animateIn}
            fallbackTo={group.to}
            fallbackAnchor={group.anchor}
            onAnchorClick={onAnchorClick}
            onForceClose={onForceClose}
          />
        ))}
      </div>
    </div>
  );
}

function MegaCard({
  item,
  index,
  animateIn,
  fallbackTo,
  fallbackAnchor,
  onAnchorClick,
  onForceClose,
}: {
  item: MegaMenuItem;
  index: number;
  animateIn: boolean;
  fallbackTo?: string;
  fallbackAnchor?: string;
  onAnchorClick: (anchor: string) => void;
  onForceClose: () => void;
}) {
  const revealed = useMegaCardReveal(animateIn);

  const content = (
    <>
      <LightMegaCardDecor accent={item.accent ?? 'pink'} index={index} />

      <div className="relative z-10 flex flex-1 flex-col items-start justify-start text-left">
        <div className="mb-4 flex items-start gap-2">
          <span className="text-[20px] font-black leading-[1.05] tracking-[-0.03em] text-[#171717]">
            {item.title}
          </span>

          {item.badge ? (
            <span className="rounded-full bg-[#F47C8C] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-[0_8px_20px_rgba(244,124,140,0.28)]">
              {item.badge}
            </span>
          ) : null}
        </div>

        <p className="max-w-[13.5rem] text-[15px] font-semibold leading-[1.25] text-[#69707D]">
          {item.description}
        </p>
      </div>

      <div className="absolute bottom-4 left-5 right-5 z-10 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.18em] text-[#D1A6B0]">
        <span>SLOTTY</span>
        <span>0{index + 1}</span>
      </div>
    </>
  );

  const cardMotionClass = revealed ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0';

  const className = `group relative flex min-h-[19.5rem] overflow-hidden rounded-[24px] border border-white/75 bg-[#FFFBFC] p-5 transition-[transform,opacity,border-color,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-[#F47C8C]/35 hover:bg-white hover:shadow-[0_24px_60px_rgba(244,124,140,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C8C] motion-reduce:transition-none ${cardMotionClass}`;

  const to = item.to ?? fallbackTo;
  const anchor = item.anchor ?? fallbackAnchor;

  const motionStyle = { transitionDelay: `${index * 55}ms` };

  if (to) {
    return (
      <Link
        to={to}
        className={className}
        style={motionStyle}
        onClick={() => {
          onForceClose();
          void setProfileRole('client');
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={motionStyle}
      onClick={() => {
        if (anchor) onAnchorClick(anchor);
      }}
    >
      {content}
    </button>
  );
}

function LightMegaCardDecor({
  accent,
  index,
}: {
  accent: 'pink' | 'violet' | 'blue' | 'green' | 'orange';
  index: number;
}) {
  const color = {
    pink: '244,124,140',
    violet: '167,139,250',
    blue: '96,165,250',
    green: '52,211,153',
    orange: '251,146,60',
  }[accent];

  if (index === 0) {
    return (
      <>
        <div
          className="absolute inset-x-0 bottom-0 h-[70%] opacity-80 transition duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at 50% 100%, rgba(${color},0.22), transparent 58%)`,
          }}
        />
        <div className="absolute bottom-0 left-1/2 h-[14rem] w-px -translate-x-1/2 bg-[#F47C8C]/12" />
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute bottom-0 left-1/2 h-[13rem] w-px origin-bottom bg-[#F47C8C]/10"
            style={{ transform: `translateX(-50%) rotate(${i * 15}deg)` }}
          />
        ))}
      </>
    );
  }

  if (index === 1) {
    return (
      <>
        <div
          className="absolute left-1/2 top-[58%] h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
          style={{ background: `rgba(${color},0.18)` }}
        />
        <div className="absolute left-1/2 top-[58%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#F47C8C]/15 bg-white/60" />
        <div className="absolute left-1/2 top-[58%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#F47C8C]/12" />
        <div className="absolute left-1/2 top-[58%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#F47C8C]/10" />
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-[58%] h-36 w-56 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-[#F47C8C]/12"
            style={{ transform: `translate(-50%, -50%) rotate(${i * 25}deg)` }}
          />
        ))}
      </>
    );
  }

  if (index === 2) {
    return (
      <>
        <div
          className="absolute bottom-0 left-0 h-48 w-full blur-xl"
          style={{
            background: `linear-gradient(to top, rgba(${color},0.22), transparent)`,
          }}
        />
        <svg className="absolute bottom-8 left-0 h-52 w-full text-[#F47C8C]/35" viewBox="0 0 260 220" fill="none">
          <path
            d="M0 172C34 92 72 46 110 62C144 76 132 158 176 142C207 130 210 90 260 112"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="5 7"
          />
          <path
            d="M0 202H260V118C235 105 221 124 202 144C183 164 154 176 130 133C105 90 89 54 58 86C32 113 17 154 0 172V202Z"
            fill={`rgba(${color},0.16)`}
          />
        </svg>
      </>
    );
  }

  if (index === 3) {
    return (
      <>
        <div
          className="absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-2xl"
          style={{ background: `rgba(${color},0.18)` }}
        />
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="absolute bottom-20 left-1/2 h-28 w-44 -translate-x-1/2 rounded-[50%] border border-[#F47C8C]/12"
            style={{ transform: `translateX(-50%) rotate(${i * 12}deg)` }}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <div
        className="absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-2xl"
        style={{ background: `rgba(${color},0.18)` }}
      />
      <div className="absolute bottom-24 left-1/2 h-20 w-32 -translate-x-1/2 rotate-45 rounded-[22px] border border-[#F47C8C]/18 bg-white/70" />
      <div className="absolute bottom-20 left-1/2 h-20 w-32 -translate-x-1/2 rotate-45 rounded-[22px] border border-[#F47C8C]/14 bg-white/50" />
      <div className="absolute bottom-16 left-1/2 h-20 w-32 -translate-x-1/2 rotate-45 rounded-[22px] border border-[#F47C8C]/10 bg-white/40" />
    </>
  );
}

function ProfileMenuItem({
  children,
  to,
  onClick,
  onNavigate,
}: {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  onNavigate?: () => void;
}) {
  const className =
    'block w-full px-4 py-2.5 text-left text-[14px] font-medium text-[#374151] transition hover:bg-[#F7F7F8] hover:text-[#F47C8C]';

  if (to) {
    return (
      <Link to={to} role="menuitem" className={className} onClick={onNavigate}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" className={className} onClick={onClick}>
      {children}
    </button>
  );
}