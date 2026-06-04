import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type LegacyRef,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  HiBell,
  HiSquares2X2,
  HiUser,
} from 'react-icons/hi2';

import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import {
  MASTER_SETTINGS_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_PATH,
  PLATFORM_ADMIN_PATH,
  BECOME_MASTER_PATH,
  getLoginPath,
  getProfilePath,
  HUB_PATH,
  MASTERS_PATH,
  PROFILE_PATH,
  SERVICES_PATH,
} from '../../../app/paths';
import { useAuth } from '../../../features/auth/AuthProvider';
import { isPlatformAdmin } from '../../../features/auth/lib/isPlatformAdmin';
import { resolveMasterEntryPath } from '../../../features/auth/lib/resolveMasterEntryPath';
import { useIsMasterUser } from '../../../features/profile/hooks/useIsMasterUser';
import { setProfileRole } from '../../../features/profile/lib/setProfileRole';
import { CLIENT_DESKTOP_SHELL_CLASS } from '../clientShellLayout';
import { catalogPrimaryBtn } from '../../../pages/client/servicesCatalog/servicesCatalogTheme';
import { useTelegram } from '../../hooks/useTelegram';
import { HeaderProfileAvatar } from './HeaderProfileAvatar';
import {
  landingAnchorHref,
  LANDING_ANCHOR_FAQ,
  LANDING_ANCHOR_FOR_MASTERS,
  LANDING_ANCHOR_HOW,
  LANDING_ANCHOR_TARIFFS,
  isLandingHowTab,
  isLandingMastersTab,
  parseLandingHowTab,
  parseLandingMastersTab,
  SLOTTY_NAV_CATALOG,
  SLOTTY_NAV_MASTERS,
} from './headerNav';
import { SlottyImg } from '../../ui/SlottyImg';
import { getMastersCatalogPath, getServicesCatalogPath } from '../../../app/paths';
import {
  MASTERS_VIEW_TABS,
  type MastersViewTab,
} from '../../../pages/client/lib/categoryMasterFilters';
import {
  CATALOG_VIEW_TABS,
  type CatalogViewTab,
} from '../../../pages/client/servicesCatalog/catalogFiltersState';
import { catalogViewTabIdle } from '../../../pages/client/servicesCatalog/servicesCatalogTheme';
import { resolveMegaMenuGroup, type MegaMenuKey, type MegaMenuGroup, type MegaMenuItem } from './megaMenuConfig';

function servicesCatalogTabHref(tab: CatalogViewTab): string {
  if (tab === 'all') return SERVICES_PATH;
  return getServicesCatalogPath({ tab });
}

function mastersCatalogTabHref(tab: MastersViewTab): string {
  if (tab === 'all') return MASTERS_PATH;
  return getMastersCatalogPath({ tab });
}

const iconBtn =
  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[#374151] transition hover:bg-[#E9E6E6] hover:text-[#F47C8C] active:scale-[0.97]';

const masterCtaClass = `${catalogPrimaryBtn} h-10 rounded-full px-4 text-[14px]`;

const HEADER_LOGO_IMG_CLASS = 'block h-[72px] w-auto object-contain object-center sm:h-20';

const HEADER_LOGO_COMPACT_CLASS = 'block h-10 w-auto object-contain object-center lg:h-11';

/** Высота строки = кнопка бургера (h-9) + вертикальные отступы, без лишнего зазора снизу. */
const HEADER_LANDING_ROW_CLASS =
  'relative flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:px-4 lg:h-[5.5rem] lg:gap-4 lg:px-5 xl:px-6';

/**
 * Лендинг mobile: базовый слот h-9, визуальный размер — через scale (не трогает padding строки).
 * lg+ — обычный крупный логотип без scale.
 */
const HEADER_LANDING_LOGO_CLASS =
  'relative z-[1] h-9 w-9 shrink-0 origin-left scale-[1.72] translate-x-[1px] sm:scale-[1.78] lg:h-auto lg:w-auto lg:origin-center lg:scale-100 lg:translate-x-[-22px] xl:translate-x-[-18px]';

const HEADER_LANDING_LOGO_IMG_CLASS =
  'block h-9 w-auto max-w-none object-contain object-left object-center lg:h-20 lg:object-center';

const HEADER_BAR_ROW_CLASS =
  'relative flex h-14 items-center justify-between gap-4 px-4 sm:px-5 lg:h-[4.25rem] lg:px-0';

function HeaderLogoLink({
  className = '',
  imgClassName,
  onClick,
  size = 'large',
}: {
  className?: string;
  imgClassName?: string;
  onClick?: () => void;
  size?: 'large' | 'compact';
}) {
  const imgClass =
    imgClassName ??
    (size === 'compact' ? HEADER_LOGO_COMPACT_CLASS : HEADER_LOGO_IMG_CLASS);

  return (
    <Link
      to={HUB_PATH}
      aria-label="SLOTTY — на главную"
      className={`inline-flex h-9 shrink-0 items-center justify-center outline-none transition hover:opacity-60 sm:h-10 lg:h-auto ${className}`}
      onClick={onClick}
    >
      <SlottyImg
        src={HEADER_LOGO_SRC}
        alt=""
        decoding="async"
        loading="eager"
        fetchPriority="high"
        className={imgClass}
      />
    </Link>
  );
}

const navTriggerClass =
  'inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-[14px] font-semibold leading-none text-[#374151] transition hover:text-[#F47C8C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C8C]/40 xl:px-3 xl:text-[15px]';

const activeNavTriggerClass = 'text-[#F47C8C]';

type Variant = 'landing' | 'bar';

export type SlottyHeaderProps = {
  variant?: Variant;
};

function useSyncHeaderHeight(headerRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const sync = () => {
      document.documentElement.style.setProperty(
        '--slotty-header-height',
        `${Math.ceil(el.getBoundingClientRect().height)}px`,
      );
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);

    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--slotty-header-height');
    };
  }, [headerRef]);
}

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
  shellRef,
}: {
  variant: Variant;
  children: ReactNode;
  innerClassName?: string;
  shellRef?: RefObject<HTMLElement | null>;
}) {
  const headerElementRef = shellRef as LegacyRef<HTMLElement> | undefined;

  if (variant === 'bar') {
    return (
      <header
        ref={headerElementRef}
        className={`sticky top-0 z-50 hidden overflow-visible bg-[#FFFCFC]/95 backdrop-blur-md lg:block ${
          innerClassName.includes('mega-open') ? 'border-b border-transparent' : 'border-b border-[#F3F4F6]'
        }`}
      >
        <div className={`${CLIENT_DESKTOP_SHELL_CLASS} ${innerClassName}`}>{children}</div>
      </header>
    );
  }

  return (
    <header
      ref={headerElementRef}
      className="fixed inset-x-0 top-0 z-50 pt-[calc(0.5rem+env(safe-area-inset-top,0px))]"
    >
      <div className={`${CLIENT_DESKTOP_SHELL_CLASS} max-lg:px-4`}>
        <div
          className={`overflow-visible rounded-[30px] border border-[#D5D3D3]/80 bg-[#E4E2E2]/96 shadow-[0_1px_3px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-300 ${
            innerClassName.includes('mega-open')
              ? '!bg-[#E8E6E6] shadow-[0_24px_70px_rgba(244,124,140,0.14),0_12px_40px_rgba(17,24,39,0.08)]'
              : ''
          } ${innerClassName}`}
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
  const { isAuthenticated, profile } = useAuth();
  const isMasterUser = useIsMasterUser();
  const showPlatformAdmin = isPlatformAdmin(profile);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [megaOpenKey, setMegaOpenKey] = useState<MegaMenuKey | null>(null);
  const [megaPanelKey, setMegaPanelKey] = useState<MegaMenuKey | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const megaHostRef = useRef<HTMLDivElement>(null);
  const megaPanelRef = useRef<HTMLDivElement>(null);
  const megaCloseTimerRef = useRef<number | null>(null);

  useSyncHeaderHeight(headerRef);

  const masterHref = resolveMasterEntryPath({ isAuthenticated, isMasterUser });
  const masterCtaLabel = isMasterUser ? 'Кабинет мастера' : 'Стать мастером';
  const loginReturnPath = `${location.pathname}${location.search}`;
  const loginHref = getLoginPath(loginReturnPath);
  const appointmentsHref = isAuthenticated ? getProfilePath('appointments') : loginHref;
  const loginMethodsHref = isMasterUser ? MASTER_SETTINGS_PATH : getProfilePath('settings');

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

  const closeHeaderPanels = useCallback(() => {
    closeMegaMenu();
    setProfilePanelOpen(false);
  }, [closeMegaMenu]);

  const scheduleHeaderPanelClose = useCallback(() => {
    cancelMegaClose();
    megaCloseTimerRef.current = window.setTimeout(() => {
      closeHeaderPanels();
      megaCloseTimerRef.current = null;
    }, MEGA_CLOSE_DELAY_MS);
  }, [cancelMegaClose, closeHeaderPanels]);

  const openMegaMenu = useCallback((key: MegaMenuKey) => {
    setProfilePanelOpen(false);
    setMegaOpenKey(key);
  }, []);

  const isPointerInsideMegaZone = useCallback((clientX: number, clientY: number) => {
    const nodes = [megaHostRef.current, megaPanelRef.current];
    return nodes.some((el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    });
  }, []);

  const scrollToLandingAnchor = useCallback(
    (anchor: string) => {
      closeMobileMenu();
      closeHeaderPanels();

      const onHub = location.pathname === HUB_PATH || location.pathname === '/';

      if (onHub) {
        const isHowTab = isLandingHowTab(anchor);
        const isMastersTab = isLandingMastersTab(anchor);
        const scrollTarget =
          isHowTab || anchor === LANDING_ANCHOR_HOW
            ? 'how-it-works'
            : isMastersTab || anchor === LANDING_ANCHOR_FOR_MASTERS
              ? 'for-masters'
              : anchor;
        document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const hash = isHowTab
          ? anchor
          : isMastersTab
            ? anchor
            : anchor === LANDING_ANCHOR_HOW
              ? parseLandingHowTab('')
              : anchor === LANDING_ANCHOR_FOR_MASTERS
                ? parseLandingMastersTab('')
                : anchor;
        window.history.replaceState(null, '', `${HUB_PATH}#${hash}`);
        return;
      }

      navigate(landingAnchorHref(anchor));
    },
    [closeMobileMenu, closeHeaderPanels, location.pathname, navigate],
  );

  const goAppointments = useCallback(() => {
    closeMobileMenu();
    closeHeaderPanels();
    void setProfileRole('client');
    navigate(appointmentsHref);
  }, [appointmentsHref, closeHeaderPanels, closeMobileMenu, navigate]);

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
    return () => {
      cancelMegaClose();
    };
  }, [cancelMegaClose]);

  useEffect(() => {
    if (megaOpenKey) {
      setMegaPanelKey(megaOpenKey);
      return;
    }
    setMegaPanelKey(null);
  }, [megaOpenKey]);

  useEffect(() => {
    if (!megaOpenKey && !profilePanelOpen) return;

    const onPointerMove = (e: PointerEvent) => {
      if (isPointerInsideMegaZone(e.clientX, e.clientY)) {
        cancelMegaClose();
        return;
      }
      scheduleHeaderPanelClose();
    };

    document.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      document.removeEventListener('pointermove', onPointerMove);
    };
  }, [
    megaOpenKey,
    profilePanelOpen,
    cancelMegaClose,
    isPointerInsideMegaZone,
    scheduleHeaderPanelClose,
  ]);

  useEffect(() => {
    if (!megaOpenKey && !profilePanelOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeHeaderPanels();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [megaOpenKey, profilePanelOpen, closeHeaderPanels]);

  const megaMenuOpen = megaOpenKey !== null;
  const headerPanelOpen = megaMenuOpen || profilePanelOpen;

  const accountMegaItems = useMemo((): MegaMenuItem[] => {
    const items: MegaMenuItem[] = [
      {
        title: 'Мои записи',
        description: 'Будущие и прошлые визиты к мастерам — статусы и детали в одном месте.',
        to: appointmentsHref,
        accent: 'pink',
      },
      {
        title: 'Профиль',
        description: 'Личные данные, избранное и настройки клиентского аккаунта.',
        to: PROFILE_PATH,
        accent: 'blue',
      },
      {
        title: 'Способы входа',
        description: 'Telegram, email и привязанные способы авторизации.',
        to: loginMethodsHref,
        accent: 'violet',
      },
    ];

    if (isMasterUser) {
      items.push({
        title: 'Кабинет мастера',
        description: 'Заявки, услуги, расписание и аналитика вашего профиля.',
        to: ADMIN_PATH,
        accent: 'green',
      });
    } else {
      items.push({
        title: 'Стать мастером',
        description: 'Создайте профиль мастера и начните принимать записи онлайн.',
        to: BECOME_MASTER_PATH,
        accent: 'green',
      });
    }

    if (showPlatformAdmin) {
      items.push({
        title: 'Админ',
        badge: 'ADMIN',
        description: 'Платформенная панель управления и модерация.',
        to: PLATFORM_ADMIN_PATH,
        accent: 'orange',
      });
    }

    return items;
  }, [appointmentsHref, isMasterUser, loginMethodsHref, showPlatformAdmin]);

  const megaHostProps = {
    onMouseEnter: cancelMegaClose,
    onMouseLeave: scheduleHeaderPanelClose,
  };

  if (variant === 'bar' && isTelegramWebApp) {
    return null;
  }

  const desktopCenterNav = (
    <DesktopMegaNav
      openKey={megaOpenKey}
      onOpen={openMegaMenu}
      onForceClose={closeHeaderPanels}
      onAnchorClick={scrollToLandingAnchor}
    />
  );

  const goCatalog = useCallback(() => {
    closeMobileMenu();
    closeHeaderPanels();
    void setProfileRole('client');
    navigate(SERVICES_PATH);
  }, [closeHeaderPanels, closeMobileMenu, navigate]);

  const goClientProfile = useCallback(() => {
    closeMobileMenu();
    closeHeaderPanels();
    void setProfileRole('client');
    navigate(isAuthenticated ? PROFILE_PATH : loginHref);
  }, [closeHeaderPanels, closeMobileMenu, isAuthenticated, loginHref, navigate]);

  const toggleProfilePanel = useCallback(() => {
    cancelMegaClose();
    setProfilePanelOpen((open) => {
      if (!open) setMegaOpenKey(null);
      return !open;
    });
  }, [cancelMegaClose]);

  const desktopActions = (
    <div className="hidden shrink-0 items-center gap-3 self-center lg:flex">
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
          <HiBell className="h-5 w-5 shrink-0" aria-hidden />
        </Link>
      ) : null}

      {isAuthenticated ? (
        <button
          type="button"
          onClick={toggleProfilePanel}
          className={`${iconBtn} overflow-hidden p-0 ${profilePanelOpen ? 'ring-2 ring-[#F47C8C]/35' : ''}`}
          aria-expanded={profilePanelOpen}
          aria-controls="slotty-account-panel"
          aria-label="Аккаунт"
        >
          <HeaderProfileAvatar profile={profile} fill />
        </button>
      ) : (
        <Link
          to={loginHref}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#F1EFEF] px-3.5 text-[14px] font-semibold text-[#111827] transition hover:bg-[#E9E6E6]"
        >
          <HiUser className="h-5 w-5 text-[#6B7280]" aria-hidden />
          Войти
        </Link>
      )}

      {showPlatformAdmin ? (
        <Link
          to={PLATFORM_ADMIN_PATH}
          className="inline-flex h-10 shrink-0 items-center rounded-full border border-[#e5e7eb] bg-white px-4 text-[14px] font-semibold text-[#374151] transition hover:border-[#ff5f7a]/40 hover:text-[#ff5f7a]"
        >
          Админ
        </Link>
      ) : null}

      <Link to={masterHref} className={`${masterCtaClass} shrink-0 self-center`}>
        {masterCtaLabel}
      </Link>
    </div>
  );

  const topBar = (
    <div className={HEADER_LANDING_ROW_CLASS}>
      <HeaderLogoLink
        onClick={closeHeaderPanels}
        className={HEADER_LANDING_LOGO_CLASS}
        imgClassName={HEADER_LANDING_LOGO_IMG_CLASS}
      />

      <div className="hidden flex-1 items-center justify-center lg:flex">
        {showLandingDesktop || showDesktopChrome ? desktopCenterNav : null}
      </div>

      <div className="min-w-0 flex-1 lg:hidden" aria-hidden />

      {showLandingDesktop || showDesktopChrome ? desktopActions : null}

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
            {isAuthenticated ? (
              <HeaderProfileAvatar profile={profile} />
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

        <div className="mt-4 space-y-2">
          {showPlatformAdmin ? (
            <Link
              to={PLATFORM_ADMIN_PATH}
              onClick={closeMobileMenu}
              className="block w-full rounded-2xl border border-[#e5e7eb] py-3 text-center text-[15px] font-semibold text-[#374151]"
            >
              Админ
            </Link>
          ) : null}
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
      <HeaderShell variant="bar" shellRef={headerRef} innerClassName={headerPanelOpen ? 'mega-open' : ''}>
        <div ref={megaHostRef} className="relative" {...megaHostProps}>
          <div className={`${HEADER_BAR_ROW_CLASS} lg:px-0`}>
            <div className="flex min-w-0 items-center gap-5 xl:gap-8">
              <HeaderLogoLink onClick={closeHeaderPanels} size="compact" />

              {desktopCenterNav}
            </div>

            {desktopActions}
          </div>

          <HeaderMegaDropdown
            variant="bar"
            isOpen={headerPanelOpen}
            panelKey={megaPanelKey}
            panelRef={megaPanelRef}
            isMasterUser={isMasterUser}
            accountItems={profilePanelOpen ? accountMegaItems : null}
            onAnchorClick={scrollToLandingAnchor}
            onForceClose={closeHeaderPanels}
            onScheduleClose={scheduleHeaderPanelClose}
            onCancelClose={cancelMegaClose}
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
        shellRef={headerRef}
        innerClassName={
          headerPanelOpen
            ? 'mega-open rounded-b-none shadow-[0_24px_70px_rgba(244,124,140,0.14),0_12px_40px_rgba(17,24,39,0.08)]'
            : ''
        }
      >
        <div ref={megaHostRef} className="relative" {...megaHostProps}>
          {topBar}
          <HeaderMegaDropdown
            id="slotty-account-panel"
            variant="landing"
            isOpen={headerPanelOpen}
            panelKey={megaPanelKey}
            panelRef={megaPanelRef}
            isMasterUser={isMasterUser}
            accountItems={profilePanelOpen ? accountMegaItems : null}
            onAnchorClick={scrollToLandingAnchor}
            onForceClose={closeHeaderPanels}
            onScheduleClose={scheduleHeaderPanelClose}
            onCancelClose={cancelMegaClose}
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
    <div className="relative hidden lg:block" onBlur={handleBlur}>
      <nav className="flex shrink-0 items-center gap-4 xl:gap-6" aria-label="Основное меню">
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
          menuKey="services"
          label="Услуги"
          to={SERVICES_PATH}
          openKey={openKey}
          onOpen={onOpen}
          onForceClose={onForceClose}
        />

        <LandingNavAnchor
          label="Для мастеров"
          anchor={LANDING_ANCHOR_FOR_MASTERS}
          onAnchorClick={onAnchorClick}
        />

        <LandingNavAnchor
          label="Тарифы"
          anchor={LANDING_ANCHOR_TARIFFS}
          onAnchorClick={onAnchorClick}
        />
      </nav>
    </div>
  );
}

const MEGA_CLOSE_DELAY_MS = 80;

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
  id,
  variant,
  isOpen,
  panelKey,
  panelRef,
  isMasterUser,
  accountItems,
  onAnchorClick,
  onForceClose,
  onScheduleClose,
  onCancelClose,
}: {
  id?: string;
  variant: Variant;
  isOpen: boolean;
  panelKey: MegaMenuKey | null;
  panelRef: MutableRefObject<HTMLDivElement | null>;
  isMasterUser: boolean;
  accountItems?: MegaMenuItem[] | null;
  onAnchorClick: (anchor: string) => void;
  onForceClose: () => void;
  onScheduleClose: () => void;
  onCancelClose: () => void;
}) {
  const group = panelKey ? resolveMegaMenuGroup(panelKey, isMasterUser) : null;
  const accountGroup: MegaMenuGroup | null =
    accountItems && accountItems.length > 0
      ? { label: 'Аккаунт', items: accountItems }
      : null;
  const panelSurfaceClass =
    variant === 'landing'
      ? 'overflow-hidden rounded-b-[30px] bg-[#F1EFEF]/98 shadow-[0_24px_60px_rgba(17,24,39,0.10)] backdrop-blur-xl'
      : 'overflow-hidden rounded-b-[30px] bg-[#FFFCFC]/98 shadow-[0_24px_60px_rgba(17,24,39,0.10)] backdrop-blur-md';

  const backdrop =
    typeof document !== 'undefined'
      ? createPortal(
          <button
            type="button"
            aria-label="Закрыть меню"
            tabIndex={isOpen ? 0 : -1}
            className={`fixed inset-x-0 bottom-0 z-[45] hidden bg-white/25 backdrop-blur-xl backdrop-saturate-150 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:block ${
              isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            style={{ top: 'var(--slotty-header-height)' }}
            onClick={onForceClose}
          />,
          document.body,
        )
      : null;

  return (
    <>
      {backdrop}

      <div
        id={id}
        ref={panelRef}
        className={`absolute inset-x-0 top-full z-[60] -mt-px hidden overflow-visible transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:block ${
          isOpen ? 'duration-300' : 'duration-150'
        } ${
          isOpen
            ? 'pointer-events-auto opacity-100 translate-y-0'
            : 'pointer-events-none opacity-0 -translate-y-2'
        }`}
        aria-hidden={!isOpen}
        onMouseEnter={onCancelClose}
        onMouseLeave={onScheduleClose}
      >
        <div className={panelSurfaceClass}>
          {accountGroup ? (
            <MegaPanel
              key="account"
              panelKey="catalog"
              group={accountGroup}
              animateIn={isOpen}
              onAnchorClick={onAnchorClick}
              onForceClose={onForceClose}
            />
          ) : group && panelKey ? (
            <MegaPanel
              key={panelKey}
              panelKey={panelKey}
              group={group}
              animateIn={isOpen}
              onAnchorClick={onAnchorClick}
              onForceClose={onForceClose}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}

function LandingNavAnchor({
  label,
  anchor,
  onAnchorClick,
}: {
  label: string;
  anchor: string;
  onAnchorClick: (anchor: string) => void;
}) {
  return (
    <button
      type="button"
      className={navTriggerClass}
      onClick={() => onAnchorClick(anchor)}
    >
      {label}
    </button>
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
  panelKey,
  group,
  animateIn,
  onAnchorClick,
  onForceClose,
}: {
  panelKey: MegaMenuKey;
  group: MegaMenuGroup;
  animateIn: boolean;
  onAnchorClick: (anchor: string) => void;
  onForceClose: () => void;
}) {
  const showServiceTabs = panelKey === 'services';
  const showMasterTabs = panelKey === 'masters';

  return (
    <div className="relative px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
      {showServiceTabs ? (
        <nav
          className="mb-4 flex flex-wrap items-center gap-1"
          aria-label="Разделы каталога услуг"
        >
          {CATALOG_VIEW_TABS.map((tab) => (
            <Link
              key={tab.id}
              to={servicesCatalogTabHref(tab.id)}
              className={`rounded-[10px] px-4 py-2 text-[14px] font-semibold transition ${catalogViewTabIdle}`}
              onClick={() => {
                onForceClose();
                void setProfileRole('client');
              }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      ) : null}

      {showMasterTabs ? (
        <nav
          className="mb-4 flex flex-wrap items-center gap-1"
          aria-label="Разделы каталога мастеров"
        >
          {MASTERS_VIEW_TABS.map((tab) => (
            <Link
              key={tab.id}
              to={mastersCatalogTabHref(tab.id)}
              className={`rounded-[10px] px-4 py-2 text-[14px] font-semibold transition ${catalogViewTabIdle}`}
              onClick={() => {
                onForceClose();
                void setProfileRole('client');
              }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      ) : null}

      <div
        className={`relative grid gap-4 ${
          group.items.length <= 2 ? 'mx-auto max-w-[700px] grid-cols-2' : 'grid-cols-5'
        }`}
      >
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
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]"
        aria-hidden
      >
        <LightMegaCardDecor accent={item.accent ?? 'pink'} index={index} />
      </div>

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

  const className = `group relative isolate flex min-h-[19.5rem] overflow-hidden rounded-[24px] border border-white/75 bg-[#FFFBFC] p-5 transition-[transform,opacity,border-color,background-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:border-[#F47C8C]/30 hover:bg-white hover:shadow-[0_10px_28px_rgba(244,124,140,0.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C8C] motion-reduce:transition-none ${cardMotionClass}`;

  const to =
    item.to ??
    (item.anchor ? landingAnchorHref(item.anchor) : undefined) ??
    (fallbackAnchor && !fallbackTo ? landingAnchorHref(fallbackAnchor) : fallbackTo);
  const anchor = !to ? (item.anchor ?? fallbackAnchor) : undefined;

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
          className="absolute inset-x-0 bottom-0 h-[65%] opacity-80"
          style={{
            background: `radial-gradient(circle at 50% 100%, rgba(${color},0.18), transparent 62%)`,
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
          className="absolute left-1/2 top-[58%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
          style={{ background: `rgba(${color},0.14)` }}
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
          className="absolute inset-x-0 bottom-0 h-40"
          style={{
            background: `linear-gradient(to top, rgba(${color},0.16), transparent)`,
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
          className="absolute bottom-8 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full blur-xl"
          style={{ background: `rgba(${color},0.14)` }}
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
        className="absolute bottom-8 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full blur-xl"
        style={{ background: `rgba(${color},0.14)` }}
      />
      <div className="absolute bottom-24 left-1/2 h-20 w-32 -translate-x-1/2 rotate-45 rounded-[22px] border border-[#F47C8C]/18 bg-white/70" />
      <div className="absolute bottom-20 left-1/2 h-20 w-32 -translate-x-1/2 rotate-45 rounded-[22px] border border-[#F47C8C]/14 bg-white/50" />
      <div className="absolute bottom-16 left-1/2 h-20 w-32 -translate-x-1/2 rotate-45 rounded-[22px] border border-[#F47C8C]/10 bg-white/40" />
    </>
  );
}
