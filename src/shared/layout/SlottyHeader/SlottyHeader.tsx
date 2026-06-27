import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type LegacyRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  HiBell,
  HiBolt,
  HiChevronDown,
  HiChevronRight,
  HiClock,
  HiMapPin,
  HiSparkles,
  HiSquares2X2,
  HiStar,
  HiUser,
} from 'react-icons/hi2';
import type { IconType } from 'react-icons';

import { HEADER_LOGO_SRC, LANDING_HEADER_LOGO_SRC } from '../../../app/headerLogo';
import {
  ADMIN_NOTIFICATIONS_PATH,
  BOOKING_PATH,
  BECOME_MASTER_PATH,
  PLATFORM_ADMIN_PATH,
  getLoginPath,
  getProfilePath,
  HUB_PATH,
  PROFILE_PATH,
  PROFILE_NOTIFICATIONS_PATH,
  PROFILE_SETTINGS_PATH,
  MASTER_START_PATH,
  SERVICES_PATH,
} from '../../../app/paths';
import { useAuth } from '../../../features/auth/AuthProvider';
import { isPlatformAdmin } from '../../../features/auth/lib/isPlatformAdmin';
import { resolveMasterEntryPath } from '../../../features/auth/lib/resolveMasterEntryPath';
import { useIsMasterUser } from '../../../features/profile/hooks/useIsMasterUser';
import { setProfileRole } from '../../../features/profile/lib/setProfileRole';
import {
  CLIENT_CATALOG_DESKTOP_SHELL_CLASS,
  CLIENT_DESKTOP_SHELL_CLASS,
} from '../clientShellLayout';
import { catalogPrimaryBtn } from '../../../pages/client/servicesCatalog/servicesCatalogTheme';
import { scrollCatalogPageToTop } from '../../../pages/client/servicesCatalog/scrollCatalogPageToTop';
import { useTelegram } from '../../hooks/useTelegram';
import { HeaderProfileAvatar } from './HeaderProfileAvatar';
import {
  landingAnchorHref,
  masterLandingAnchorHref,
  LANDING_ANCHOR_FAQ,
  LANDING_ANCHOR_FOR_MASTERS,
  LANDING_ANCHOR_HOW,
  LANDING_ANCHOR_MASTER_HOME,
  LANDING_ANCHOR_TARIFFS,
  isClientLandingAnchor,
  isLandingHowTab,
  isLandingMastersTab,
  isMasterLandingAnchor,
  parseLandingHowTab,
  parseLandingMastersTab,
  SLOTTY_NAV_CATALOG,
  SLOTTY_NAV_MASTERS,
} from './headerNav';
import { SlottyImg } from '../../ui/SlottyImg';
import { resolveMegaMenuGroup, type MegaMenuKey, type MegaMenuGroup, type MegaMenuItem } from './megaMenuConfig';
import {
  AccountDropdownPanel,
  type AccountDropdownColumn,
  type AccountDropdownItem,
} from './AccountDropdownPanel';
import { AccountMenuIcons } from './accountMenuIcons';
import {
  LANDING_HEADER_LOGO_CELL_CLASS,
  LANDING_HEADER_LOGO_IMG_CLASS,
  LANDING_HEADER_LOGO_LINK_CLASS,
  CATALOG_LANDING_HEADER_WIDTH_CLASS,
  LANDING_HEADER_MAX_WIDTH_CLASS,
  LANDING_HEADER_NAV_CELL_CLASS,
  CATALOG_LANDING_HEADER_PILL_CLASS,
  LANDING_HEADER_PILL_CLASS,
  LANDING_HEADER_ROW_CLASS,
  LANDING_HEADER_SLOT_H,
  LANDING_HEADER_ACTIONS_CELL_CLASS,
  LANDING_ICON_BTN_CLASS,
  LANDING_NAV_LINK_CLASS,
} from './landingHeaderTheme';

const iconBtn =
  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[#374151] transition hover:bg-[#E9E6E6] hover:text-[#F47C8C] active:scale-[0.97]';

const masterCtaClass = `${catalogPrimaryBtn} h-10 rounded-full px-4 text-[14px]`;

const HEADER_LOGO_IMG_CLASS = 'block h-[72px] w-auto object-contain object-center sm:h-20';

const HEADER_LOGO_COMPACT_CLASS = 'block h-10 w-auto object-contain object-center lg:h-11';

/** Высота строки bar-хедера. */
const HEADER_BAR_ROW_CLASS =
  'relative flex h-14 items-center justify-between gap-4 px-4 sm:px-5 lg:h-[4.25rem] lg:px-0';

function HeaderLogoLink({
  className = '',
  imgClassName,
  onClick,
  size = 'large',
  src,
  fadeOnHover = true,
  bareLink = false,
  to = HUB_PATH,
}: {
  className?: string;
  imgClassName?: string;
  onClick?: () => void;
  size?: 'large' | 'compact';
  src?: string;
  fadeOnHover?: boolean;
  /** Без дефолтных h-9/h-10 — только переданные классы (лендинг). */
  bareLink?: boolean;
  to?: string;
}) {
  const imgClass =
    imgClassName ??
    (size === 'compact' ? HEADER_LOGO_COMPACT_CLASS : HEADER_LOGO_IMG_CLASS);

  const hoverClass = fadeOnHover ? 'transition hover:opacity-60' : 'opacity-100 hover:opacity-100';
  const linkClass = bareLink
    ? `inline-flex shrink-0 outline-none ${hoverClass} ${className}`
    : `inline-flex h-9 shrink-0 items-center justify-center outline-none sm:h-10 lg:h-auto ${hoverClass} ${className}`;

  return (
    <Link
      to={to}
      aria-label="SLOTTY — на главную"
      className={linkClass}
      onClick={onClick}
    >
      <SlottyImg
        src={src ?? HEADER_LOGO_SRC}
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

const HEADER_PILL_BASE_CLASS =
  'overflow-visible rounded-[30px] border border-[#D5D3D3]/80 bg-[#E4E2E2]/96 shadow-[0_1px_3px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-300';

/** Клиентский pill-хедер (#FBEDEC): каталог, категории, запись. */
function isCatalogLandingHeaderPath(pathname: string): boolean {
  if (pathname === BOOKING_PATH || pathname === SERVICES_PATH) return true;
  return pathname.startsWith(`${SERVICES_PATH}/category/`);
}

const MEGA_DROPDOWN_PANEL_CLASS =
  'overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white py-2 shadow-[0_16px_48px_rgba(17,24,39,0.12)]';

const MEGA_ITEM_ICONS: Record<NonNullable<MegaMenuItem['accent']>, IconType> = {
  pink: HiStar,
  blue: HiClock,
  violet: HiMapPin,
  green: HiSparkles,
  orange: HiBolt,
};

function megaMenuSectionTitle(key: MegaMenuKey): string {
  if (key === 'catalog') return 'Категории услуг';
  if (key === 'masters') return 'Подборки мастеров';
  if (key === 'services') return 'Разделы услуг';
  return 'Разделы';
}

type Variant = 'landing' | 'bar';

export type SlottyHeaderProps = {
  variant?: Variant;
  /** Тёмный bar-хедер (legacy). Для legal-страниц предпочтительнее `landingTone="dark"`. */
  barTone?: 'light' | 'dark';
  /** Тёмная pill-шапка лендинга (legal / privacy). */
  landingTone?: 'light' | 'dark';
  /** На mobile при `variant="bar"` — pill-хедер с бургер-меню как на главной. */
  barMobileMenu?: boolean;
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

function BurgerIcon({ open, tone = 'light' }: { open: boolean; tone?: 'light' | 'dark' }) {
  const barColor = tone === 'dark' ? 'bg-white' : 'bg-black';
  return (
    <div className="relative h-5 w-5" aria-hidden>
      <span
        className={`absolute left-0 top-1/2 h-[2px] w-5 rounded-full transition-all duration-300 ${barColor} ${
          open ? 'translate-y-0 rotate-45' : '-translate-y-[6px]'
        }`}
      />
      <span
        className={`absolute left-0 top-1/2 h-[2px] w-5 rounded-full transition-all duration-300 ${barColor} ${
          open ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <span
        className={`absolute left-0 top-1/2 h-[2px] w-5 rounded-full transition-all duration-300 ${barColor} ${
          open ? 'translate-y-0 -rotate-45' : 'translate-y-[6px]'
        }`}
      />
    </div>
  );
}

function HeaderShell({
  variant,
  barTone = 'light',
  landingTone = 'light',
  landingSticky = false,
  landingDesktopOnly = false,
  landingCatalogWidth = false,
  landingCatalogFlushTop = false,
  children,
  innerClassName = '',
  shellRef,
}: {
  variant: Variant;
  barTone?: 'light' | 'dark';
  landingTone?: 'light' | 'dark';
  landingSticky?: boolean;
  landingDesktopOnly?: boolean;
  /** Pill на всю ширину shell каталога (1320px), не узкая капсула лендинга. */
  landingCatalogWidth?: boolean;
  /** Каталог: фон hero до верха экрана — без серого отступа над pill. */
  landingCatalogFlushTop?: boolean;
  children: ReactNode;
  innerClassName?: string;
  shellRef?: RefObject<HTMLElement | null>;
}) {
  const headerElementRef = shellRef as LegacyRef<HTMLElement> | undefined;

  if (variant === 'bar') {
    const isDark = barTone === 'dark';
    const megaOpen = innerClassName.includes('mega-open');

    if (isDark) {
      return (
        <header
          ref={headerElementRef}
          className={`sticky top-0 z-50 hidden overflow-visible backdrop-blur-md lg:block bg-[#0a0a0a]/95 ${
            megaOpen ? 'border-b border-transparent' : 'border-b border-white/10'
          }`}
        >
          <div className={`${CLIENT_DESKTOP_SHELL_CLASS} ${innerClassName}`}>{children}</div>
        </header>
      );
    }

    return (
      <header
        ref={headerElementRef}
        className="sticky top-0 z-50 hidden overflow-visible lg:block pt-[calc(0.5rem+env(safe-area-inset-top,0px))]"
      >
        <div className={CLIENT_DESKTOP_SHELL_CLASS}>
          <div className={`${HEADER_PILL_BASE_CLASS} ${innerClassName}`}>
            {children}
          </div>
        </div>
      </header>
    );
  }

  const landingIsDark = landingTone === 'dark';
  const megaOpen = innerClassName.includes('mega-open');
  const landingPanelClass = landingIsDark
    ? `overflow-visible rounded-[30px] border border-white/12 bg-[#121212]/98 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 ${
        megaOpen
          ? 'rounded-b-none !border-white/10 !bg-[#141414] shadow-[0_20px_56px_rgba(0,0,0,0.65)]'
          : ''
      }`
    : landingCatalogFlushTop
      ? CATALOG_LANDING_HEADER_PILL_CLASS
      : `${LANDING_HEADER_PILL_CLASS}${
          megaOpen && !landingIsDark
            ? ' rounded-b-none shadow-[0_20px_48px_rgba(17,24,39,0.1)]'
            : ''
        }`;

  const landingPositionClass = landingSticky
    ? 'sticky'
    : 'fixed inset-x-0';

  const landingShellClass = landingCatalogWidth
    ? CLIENT_CATALOG_DESKTOP_SHELL_CLASS
    : CLIENT_DESKTOP_SHELL_CLASS;
  const landingWidthClass = landingCatalogWidth
    ? CATALOG_LANDING_HEADER_WIDTH_CLASS
    : LANDING_HEADER_MAX_WIDTH_CLASS;

  const landingTopPadClass = landingCatalogFlushTop
    ? 'pt-[env(safe-area-inset-top,0px)]'
    : 'pt-[calc(0.5rem+env(safe-area-inset-top,0px))]';

  return (
    <header
      ref={headerElementRef}
      className={`${landingDesktopOnly ? 'hidden lg:block' : ''} ${landingPositionClass} top-0 z-50 overflow-visible bg-transparent ${landingTopPadClass}`}
    >
      <div className={`${landingShellClass} ${landingDesktopOnly ? '' : 'max-lg:px-4'}`}>
        <div className={`${landingWidthClass} ${landingPanelClass} ${innerClassName}`}>
          {children}
        </div>
      </div>
    </header>
  );
}

export function SlottyHeader({
  variant = 'landing',
  barTone = 'light',
  landingTone = 'light',
  barMobileMenu = false,
}: SlottyHeaderProps) {
  const isDarkBar = variant === 'bar' && barTone === 'dark';
  const isDarkLanding = variant === 'landing' && landingTone === 'dark';
  const isDarkHeaderTheme = isDarkBar || isDarkLanding;
  const barMobileLandingMenu = variant === 'bar' && barMobileMenu;
  const barMobileMenuDark = barMobileLandingMenu && isDarkBar;
  const mobileMenuDark = barMobileMenuDark || isDarkLanding;
  const mobileNavLinkClass = mobileMenuDark
    ? 'block py-3.5 text-[18px] font-medium text-white/90 transition hover:text-white'
    : 'block py-3.5 text-[18px] font-medium lowercase text-[#1A1A1A]';
  const mobileNavBtnClass = mobileMenuDark
    ? 'block w-full py-3.5 text-left text-[18px] font-medium text-white/90 transition hover:text-white'
    : 'block w-full py-3.5 text-left text-[18px] font-medium lowercase text-[#1A1A1A]';
  const mobileBurgerBtnClass = mobileMenuDark
    ? 'relative z-50 flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10 active:scale-95'
    : 'relative z-50 flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5 active:scale-95';
  const headerIconBtn = isDarkHeaderTheme
    ? 'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-[#ff8fa3] active:scale-[0.97]'
    : iconBtn;
  const landingIconBtnClass = isDarkLanding
    ? headerIconBtn
    : LANDING_ICON_BTN_CLASS;
  const navigate = useNavigate();
  const location = useLocation();
  const { isTelegramWebApp } = useTelegram();
  const { isAuthenticated, profile } = useAuth();
  const isMasterUser = useIsMasterUser();
  const showPlatformAdmin = isPlatformAdmin(profile);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [megaOpenKey, setMegaOpenKey] = useState<MegaMenuKey | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const megaHostRef = useRef<HTMLDivElement>(null);
  const megaCloseTimerRef = useRef<number | null>(null);

  useSyncHeaderHeight(headerRef);

  const masterHref = resolveMasterEntryPath({ isAuthenticated, isMasterUser });
  const masterCtaLabel = isMasterUser ? 'Кабинет мастера' : 'Стать мастером';
  const loginReturnPath = `${location.pathname}${location.search}`;
  const loginHref = getLoginPath(loginReturnPath);
  const appointmentsHref = isAuthenticated ? getProfilePath('appointments') : loginHref;
  const notificationsHref = isMasterUser ? ADMIN_NOTIFICATIONS_PATH : PROFILE_NOTIFICATIONS_PATH;

  const catalogLandingHeader =
    variant === 'bar' && isCatalogLandingHeaderPath(location.pathname);
  const onMasterLanding = location.pathname === MASTER_START_PATH;
  const compactMobile = isTelegramWebApp || (variant === 'bar' && !barMobileMenu);

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
    const accountPanel = document.getElementById('slotty-account-panel');
    const nodes = [megaHostRef.current, accountPanel];
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
      const onMasterLandingPage = location.pathname === MASTER_START_PATH;

      if (onMasterLandingPage && isClientLandingAnchor(anchor)) {
        navigate(landingAnchorHref(anchor));
        return;
      }

      if (!onMasterLandingPage && isMasterLandingAnchor(anchor)) {
        navigate(
          anchor === LANDING_ANCHOR_TARIFFS
            ? masterLandingAnchorHref(LANDING_ANCHOR_TARIFFS)
            : anchor === LANDING_ANCHOR_MASTER_HOME
              ? MASTER_START_PATH
              : masterLandingAnchorHref(
                  isLandingMastersTab(anchor) ? anchor : LANDING_ANCHOR_FOR_MASTERS,
                ),
        );
        return;
      }

      if (onMasterLandingPage) {
        if (anchor === LANDING_ANCHOR_MASTER_HOME) {
          document.getElementById(LANDING_ANCHOR_MASTER_HOME)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
          window.history.replaceState(null, '', MASTER_START_PATH);
          return;
        }

        const scrollTarget =
          isLandingMastersTab(anchor) || anchor === LANDING_ANCHOR_FOR_MASTERS
            ? 'for-masters'
            : anchor;
        document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const hash = isLandingMastersTab(anchor)
          ? anchor
          : anchor === LANDING_ANCHOR_FOR_MASTERS
            ? parseLandingMastersTab('')
            : anchor;
        window.history.replaceState(null, '', masterLandingAnchorHref(hash));
        return;
      }

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

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', onKey);

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    return () => {
      cancelMegaClose();
    };
  }, [cancelMegaClose]);

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

  const accountMenuColumns = useMemo((): AccountDropdownColumn[] => {
    const masterItems: AccountDropdownItem[] = isMasterUser
      ? [
          { title: 'Сегодня', to: masterHref, icon: AccountMenuIcons.masterCabinet },
          { title: 'Оповещения', to: ADMIN_NOTIFICATIONS_PATH, icon: AccountMenuIcons.masterInbox },
        ]
      : [{ title: 'Стать мастером', to: BECOME_MASTER_PATH, icon: AccountMenuIcons.becomeMaster }];

    if (showPlatformAdmin) {
      masterItems.push({
        title: 'Админ',
        to: PLATFORM_ADMIN_PATH,
        icon: AccountMenuIcons.admin,
        badge: 'ADMIN',
      });
    }

    return [
      {
        label: 'Профиль',
        items: [
          { title: 'Мои записи', to: appointmentsHref, icon: AccountMenuIcons.appointments },
          { title: 'Избранное', to: getProfilePath('favorites'), icon: AccountMenuIcons.favorites },
          { title: 'Профиль', to: getProfilePath('profile'), icon: AccountMenuIcons.profile },
          { title: 'Уведомления', to: PROFILE_NOTIFICATIONS_PATH, icon: AccountMenuIcons.notifications },
          { title: 'Настройки', to: PROFILE_SETTINGS_PATH, icon: AccountMenuIcons.settings },
        ],
      },
      {
        label: 'Мастер',
        items: masterItems,
      },
    ];
  }, [appointmentsHref, isMasterUser, showPlatformAdmin]);

  const megaHostProps = {
    onMouseEnter: cancelMegaClose,
    onMouseLeave: scheduleHeaderPanelClose,
  };

  if (variant === 'bar' && isTelegramWebApp) {
    return null;
  }

  const desktopCenterNav = (
    <div
      className={
        isDarkHeaderTheme
          ? '[&_a]:text-white/70 [&_a:hover]:text-[#ff8fa3] [&_button]:text-white/70 [&_button:hover]:text-[#ff8fa3]'
          : undefined
      }
    >
      <DesktopMegaNav
        openKey={megaOpenKey}
        isMasterUser={isMasterUser}
        onOpen={openMegaMenu}
        onForceClose={closeHeaderPanels}
        onAnchorClick={scrollToLandingAnchor}
        onScheduleClose={scheduleHeaderPanelClose}
        onCancelClose={cancelMegaClose}
      />
    </div>
  );

  const goCatalog = useCallback(() => {
    closeMobileMenu();
    closeHeaderPanels();
    void setProfileRole('client');
    navigate(SERVICES_PATH);
    scrollCatalogPageToTop();
  }, [closeHeaderPanels, closeMobileMenu, navigate]);

  const goClientProfile = useCallback(() => {
    closeMobileMenu();
    closeHeaderPanels();
    void setProfileRole('client');
    navigate(isAuthenticated ? PROFILE_PATH : loginHref);
  }, [closeHeaderPanels, closeMobileMenu, isAuthenticated, loginHref, navigate]);

  const openProfilePanel = useCallback(() => {
    cancelMegaClose();
    setMegaOpenKey(null);
    setProfilePanelOpen(true);
  }, [cancelMegaClose]);

  const toggleProfilePanel = useCallback(() => {
    cancelMegaClose();
    setProfilePanelOpen((open) => {
      if (!open) setMegaOpenKey(null);
      return !open;
    });
  }, [cancelMegaClose]);

  const landingDesktopActions = (
    <>
      {isAuthenticated ? (
        <Link
          to={notificationsHref}
          className={landingIconBtnClass}
          aria-label="Уведомления"
          title="Уведомления"
          onClick={closeHeaderPanels}
        >
          <HiBell className="h-5 w-5 shrink-0" aria-hidden />
        </Link>
      ) : null}

      {isAuthenticated ? (
        <div
          className="relative"
          onMouseEnter={openProfilePanel}
          onMouseLeave={scheduleHeaderPanelClose}
        >
          <button
            type="button"
            onClick={toggleProfilePanel}
            className={`${landingIconBtnClass} overflow-hidden p-0 ${profilePanelOpen ? 'ring-2 ring-[#E29595]/35' : ''}`}
            aria-expanded={profilePanelOpen}
            aria-controls="slotty-account-panel"
            aria-label="Аккаунт"
          >
            <HeaderProfileAvatar profile={profile} fill />
          </button>

          <AccountDropdownPanel
            id="slotty-account-panel"
            columns={accountMenuColumns}
            isOpen={profilePanelOpen}
            align="right"
            onForceClose={closeHeaderPanels}
            onMouseEnter={cancelMegaClose}
            onMouseLeave={scheduleHeaderPanelClose}
          />
        </div>
      ) : (
        <Link
          to={loginHref}
          className={landingIconBtnClass}
          aria-label="Войти"
          title="Войти"
          onClick={closeHeaderPanels}
        >
          <HiUser className="h-5 w-5" aria-hidden />
        </Link>
      )}
    </>
  );

  const desktopActions = (
    <div className="hidden shrink-0 items-center gap-3 self-center lg:flex">
      <button
        type="button"
        onClick={() => void goCatalog()}
        className={headerIconBtn}
        aria-label="Каталог"
        title="Каталог услуг"
      >
        <HiSquares2X2 className="h-5 w-5" aria-hidden />
      </button>

      {isAuthenticated && isMasterUser ? (
        <Link
          to={ADMIN_NOTIFICATIONS_PATH}
          className={headerIconBtn}
          aria-label="Уведомления"
          title="Уведомления"
        >
          <HiBell className="h-5 w-5 shrink-0" aria-hidden />
        </Link>
      ) : null}

      {isAuthenticated ? (
        <div
          className="relative"
          onMouseEnter={openProfilePanel}
          onMouseLeave={scheduleHeaderPanelClose}
        >
          <button
            type="button"
            onClick={toggleProfilePanel}
            className={`${headerIconBtn} overflow-hidden p-0 ${profilePanelOpen ? 'ring-2 ring-[#F47C8C]/35' : ''}`}
            aria-expanded={profilePanelOpen}
            aria-controls="slotty-account-panel"
            aria-label="Аккаунт"
          >
            <HeaderProfileAvatar profile={profile} fill />
          </button>

          <AccountDropdownPanel
            id="slotty-account-panel"
            columns={accountMenuColumns}
            isOpen={profilePanelOpen}
            align="right"
            onForceClose={closeHeaderPanels}
            onMouseEnter={cancelMegaClose}
            onMouseLeave={scheduleHeaderPanelClose}
          />
        </div>
      ) : (
        <Link
          to={loginHref}
          className={
            isDarkHeaderTheme
              ? 'inline-flex h-10 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 text-[14px] font-semibold text-white/85 transition hover:bg-white/15'
              : 'inline-flex h-10 items-center gap-1.5 rounded-full bg-[#F1EFEF] px-3.5 text-[14px] font-semibold text-[#111827] transition hover:bg-[#E9E6E6]'
          }
        >
          <HiUser className={`h-5 w-5 ${isDarkHeaderTheme ? 'text-white/55' : 'text-[#6B7280]'}`} aria-hidden />
          Войти
        </Link>
      )}

      {showPlatformAdmin ? (
        <Link
          to={PLATFORM_ADMIN_PATH}
          className={
            isDarkHeaderTheme
              ? 'inline-flex h-10 shrink-0 items-center rounded-full border border-white/15 bg-transparent px-4 text-[14px] font-semibold text-white/75 transition hover:border-[#ff5f7a]/40 hover:text-[#ff8fa3]'
              : 'inline-flex h-10 shrink-0 items-center rounded-full border border-[#e5e7eb] bg-white px-4 text-[14px] font-semibold text-[#374151] transition hover:border-[#ff5f7a]/40 hover:text-[#ff5f7a]'
          }
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
    <div className={LANDING_HEADER_ROW_CLASS}>
      <div className={LANDING_HEADER_LOGO_CELL_CLASS}>
        <HeaderLogoLink
          to={onMasterLanding ? MASTER_START_PATH : HUB_PATH}
          src={LANDING_HEADER_LOGO_SRC}
          fadeOnHover={false}
          bareLink
          onClick={closeHeaderPanels}
          className={LANDING_HEADER_LOGO_LINK_CLASS}
          imgClassName={LANDING_HEADER_LOGO_IMG_CLASS}
        />
      </div>

      <LandingDesktopNav
        className={`${LANDING_HEADER_NAV_CELL_CLASS} ${
          isDarkLanding
            ? '[&_a]:!text-white/75 [&_a:hover]:!text-[#ff8fa3] [&_button]:!text-white/75 [&_button:hover]:!text-[#ff8fa3]'
            : ''
        }`.trim()}
        onAnchorClick={scrollToLandingAnchor}
        onCatalogClick={() => void goCatalog()}
        onMasterLanding={onMasterLanding}
      />

      <div className={LANDING_HEADER_ACTIONS_CELL_CLASS}>
        <div className={`hidden flex-nowrap items-center gap-3 ${LANDING_HEADER_SLOT_H} lg:flex`}>
          {landingDesktopActions}
        </div>

        {compactMobile ? (
          <div className="flex shrink-0 flex-nowrap items-center gap-2 lg:hidden">
            {isAuthenticated ? (
              <Link
                to={notificationsHref}
                className={landingIconBtnClass}
                aria-label="Уведомления"
                title="Уведомления"
                onClick={closeHeaderPanels}
              >
                <HiBell className="h-5 w-5" aria-hidden />
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() => void goClientProfile()}
              className={`${landingIconBtnClass} overflow-hidden p-0`}
              aria-label={isAuthenticated ? 'Профиль' : 'Войти'}
              title={isAuthenticated ? 'Профиль' : 'Войти'}
            >
              {isAuthenticated ? (
                <HeaderProfileAvatar profile={profile} fill />
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
              className={`${mobileBurgerBtnClass} lg:hidden`}
            >
              <BurgerIcon open={mobileMenuOpen} tone={mobileMenuDark ? 'dark' : 'light'} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="slotty-mobile-menu"
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setMobileMenuOpen((o) => !o)}
            className={`${mobileBurgerBtnClass} lg:hidden`}
          >
            <BurgerIcon open={mobileMenuOpen} tone={barMobileMenuDark ? 'dark' : 'light'} />
          </button>
        )}
      </div>
    </div>
  );

  const mobileMenu = (
    <div
      id="slotty-mobile-menu"
      aria-hidden={!mobileMenuOpen}
      className={`scrollbar-hidden absolute inset-x-0 top-full z-50 overflow-hidden rounded-b-[25px] transition-[opacity,transform,visibility] duration-300 lg:hidden ${
        mobileMenuDark
          ? 'border-t border-white/10 bg-[#141414] shadow-[0_20px_56px_rgba(0,0,0,0.65)]'
          : 'bg-[#FBEDEC] shadow-[0_20px_48px_rgba(17,24,39,0.1)]'
      } ${
        mobileMenuOpen
          ? 'visible translate-y-0 opacity-100'
          : 'pointer-events-none invisible -translate-y-2 opacity-0'
      }`}
    >
      <div className="pb-5 pl-7 pr-7 pt-1 sm:pl-9 sm:pr-9">
        <nav aria-label="Меню">
          <ul className="flex flex-col">
            <li>
              <Link
                to={SERVICES_PATH}
                className={mobileNavLinkClass}
                onClick={() => {
                  closeMobileMenu();
                  void setProfileRole('client');
                }}
              >
                Каталог
              </Link>
            </li>

            {onMasterLanding ? (
              <>
                <li>
                  <button
                    type="button"
                    className={mobileNavBtnClass}
                    onClick={() => scrollToLandingAnchor(LANDING_ANCHOR_MASTER_HOME)}
                  >
                    Главная
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className={mobileNavBtnClass}
                    onClick={() => scrollToLandingAnchor(LANDING_ANCHOR_FOR_MASTERS)}
                  >
                    Возможности
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className={mobileNavBtnClass}
                    onClick={() => scrollToLandingAnchor(LANDING_ANCHOR_TARIFFS)}
                  >
                    Тарифы
                  </button>
                </li>

                <li>
                  <Link to={HUB_PATH} className={mobileNavLinkClass} onClick={closeMobileMenu}>
                    Клиентам
                  </Link>
                </li>

                <li>
                  <button
                    type="button"
                    className={mobileNavBtnClass}
                    onClick={() => scrollToLandingAnchor(LANDING_ANCHOR_FAQ)}
                  >
                    Вопросы мастеров
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to={HUB_PATH} className={mobileNavLinkClass} onClick={closeMobileMenu}>
                    Клиентам
                  </Link>
                </li>

                <li>
                  <Link to={MASTER_START_PATH} className={mobileNavLinkClass} onClick={closeMobileMenu}>
                    Стать мастером
                  </Link>
                </li>

                <li>
                  <button
                    type="button"
                    className={mobileNavBtnClass}
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
                    className={mobileNavBtnClass}
                    onClick={() => scrollToLandingAnchor(LANDING_ANCHOR_HOW)}
                  >
                    Как это работает
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className={mobileNavBtnClass}
                    onClick={() => scrollToLandingAnchor(LANDING_ANCHOR_FAQ)}
                  >
                    FAQ
                  </button>
                </li>
              </>
            )}

            <li>
              {isAuthenticated ? (
                <Link to={PROFILE_PATH} className={mobileNavLinkClass} onClick={closeMobileMenu}>
                  Профиль
                </Link>
              ) : (
                <Link to={loginHref} className={mobileNavLinkClass} onClick={closeMobileMenu}>
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
              className={
                barMobileMenuDark
                  ? 'block w-full rounded-2xl border border-white/15 py-3 text-center text-[15px] font-semibold text-white/80'
                  : 'block w-full rounded-2xl border border-[#e5e7eb] py-3 text-center text-[15px] font-semibold text-[#374151]'
              }
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
      <>
        {barMobileLandingMenu ? (
          <>
            <button
              type="button"
              className={`fixed inset-0 z-40 cursor-default transition-opacity duration-300 lg:hidden ${
                barMobileMenuDark ? 'bg-black/55' : 'bg-transparent'
              } ${
                mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
              }`}
              aria-label="Закрыть меню"
              tabIndex={-1}
              onClick={closeMobileMenu}
            />
            <HeaderShell
              variant="landing"
              landingTone={barMobileMenuDark ? 'dark' : 'light'}
              shellRef={headerRef}
              innerClassName={mobileMenuOpen ? 'mega-open' : ''}
            >
              <div className="relative lg:hidden">
                {topBar}
                {mobileMenu}
              </div>
            </HeaderShell>
          </>
        ) : null}

        {catalogLandingHeader ? (
          <HeaderShell
            variant="landing"
            landingSticky
            landingDesktopOnly
            landingCatalogWidth
            shellRef={headerRef}
          >
            <div ref={megaHostRef} className="relative" {...megaHostProps}>
              {topBar}
            </div>
          </HeaderShell>
        ) : (
          <HeaderShell
            variant="bar"
            barTone={barTone}
            shellRef={headerRef}
            innerClassName={megaOpenKey ? 'mega-open' : ''}
          >
            <div ref={megaHostRef} className="relative" {...megaHostProps}>
              <div className={`${HEADER_BAR_ROW_CLASS} lg:px-5 xl:px-6`}>
                <div className="flex min-w-0 items-center gap-5 xl:gap-8">
                  <HeaderLogoLink onClick={closeHeaderPanels} size="compact" />

                  {desktopCenterNav}
                </div>

                {desktopActions}
              </div>
            </div>
          </HeaderShell>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-40 cursor-default transition-opacity duration-300 lg:hidden ${
          isDarkLanding ? 'bg-black/55' : 'bg-black/15'
        } ${
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Закрыть меню"
        tabIndex={-1}
        onClick={closeMobileMenu}
      />

      <HeaderShell
        variant="landing"
        landingTone={landingTone}
        shellRef={headerRef}
        innerClassName={mobileMenuOpen ? 'mega-open' : ''}
      >
        <div ref={megaHostRef} className="relative" {...megaHostProps}>
          {topBar}
          {mobileMenu}
        </div>
      </HeaderShell>
    </>
  );
}

const LANDING_NAV_LINK_ACTIVE_CLASS = 'text-[#C97B7B]';

function LandingDesktopNav({
  className = '',
  onAnchorClick,
  onCatalogClick,
  onMasterLanding = false,
}: {
  className?: string;
  onAnchorClick: (anchor: string) => void;
  onCatalogClick: () => void;
  onMasterLanding?: boolean;
}) {
  const location = useLocation();
  const catalogActive =
    location.pathname === SERVICES_PATH ||
    location.pathname.startsWith(`${SERVICES_PATH}/category/`);
  const clientHomeActive =
    !onMasterLanding && (location.pathname === HUB_PATH || location.pathname === '/');
  const masterHomeActive =
    onMasterLanding &&
    (location.hash === '' ||
      location.hash === `#${LANDING_ANCHOR_MASTER_HOME}` ||
      location.hash === '#');
  const masterLandingActive = location.pathname === MASTER_START_PATH;

  const navLink = (active: boolean) =>
    `${LANDING_HEADER_SLOT_H} ${LANDING_NAV_LINK_CLASS} ${
      active ? LANDING_NAV_LINK_ACTIVE_CLASS : ''
    }`;

  return (
    <nav
      className={`flex shrink-0 flex-nowrap items-center gap-6 ${LANDING_HEADER_SLOT_H} xl:gap-8 ${className}`}
      aria-label="Основное меню"
    >
      <Link
        to={SERVICES_PATH}
        className={navLink(catalogActive)}
        onClick={onCatalogClick}
        aria-current={catalogActive ? 'page' : undefined}
      >
        каталог
      </Link>

      {onMasterLanding ? (
        <>
          <button
            type="button"
            className={navLink(masterHomeActive)}
            onClick={() => onAnchorClick(LANDING_ANCHOR_MASTER_HOME)}
            aria-current={masterHomeActive ? 'page' : undefined}
          >
            главная
          </button>

          <button
            type="button"
            className={navLink(false)}
            onClick={() => onAnchorClick(LANDING_ANCHOR_FOR_MASTERS)}
          >
            возможности
          </button>

          <button
            type="button"
            className={navLink(false)}
            onClick={() => onAnchorClick(LANDING_ANCHOR_TARIFFS)}
          >
            тарифы
          </button>

          <Link
            to={HUB_PATH}
            className={navLink(false)}
            aria-label="Лендинг для клиентов"
          >
            клиентам
          </Link>

          <button
            type="button"
            className={navLink(false)}
            onClick={() => onAnchorClick(LANDING_ANCHOR_FAQ)}
          >
            вопросы
          </button>
        </>
      ) : (
        <>
          <Link
            to={HUB_PATH}
            className={navLink(clientHomeActive)}
            aria-current={clientHomeActive ? 'page' : undefined}
          >
            клиентам
          </Link>

          <Link
            to={MASTER_START_PATH}
            className={navLink(masterLandingActive)}
            aria-current={masterLandingActive ? 'page' : undefined}
          >
            стать мастером
          </Link>

          <button
            type="button"
            className={navLink(false)}
            onClick={() => onAnchorClick(LANDING_ANCHOR_FAQ)}
          >
            вопросы
          </button>
        </>
      )}
    </nav>
  );
}

function DesktopMegaNav({
  openKey,
  isMasterUser,
  onOpen,
  onForceClose,
  onAnchorClick,
  onScheduleClose,
  onCancelClose,
}: {
  openKey: MegaMenuKey | null;
  isMasterUser: boolean;
  onOpen: (key: MegaMenuKey) => void;
  onForceClose: () => void;
  onAnchorClick: (anchor: string) => void;
  onScheduleClose: () => void;
  onCancelClose: () => void;
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
          isMasterUser={isMasterUser}
          onOpen={onOpen}
          onForceClose={onForceClose}
          onScheduleClose={onScheduleClose}
          onCancelClose={onCancelClose}
        />

        <MegaTrigger
          menuKey="masters"
          label={SLOTTY_NAV_MASTERS.label}
          to={SLOTTY_NAV_MASTERS.to}
          openKey={openKey}
          isMasterUser={isMasterUser}
          onOpen={onOpen}
          onForceClose={onForceClose}
          onScheduleClose={onScheduleClose}
          onCancelClose={onCancelClose}
        />

        <MegaTrigger
          menuKey="services"
          label="Услуги"
          to={SERVICES_PATH}
          openKey={openKey}
          isMasterUser={isMasterUser}
          onOpen={onOpen}
          onForceClose={onForceClose}
          onScheduleClose={onScheduleClose}
          onCancelClose={onCancelClose}
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
  isMasterUser,
  onOpen,
  onForceClose,
  onScheduleClose,
  onCancelClose,
  onAnchorClick,
}: {
  menuKey: MegaMenuKey;
  label: string;
  to?: string;
  anchor?: string;
  openKey: MegaMenuKey | null;
  isMasterUser: boolean;
  onOpen: (key: MegaMenuKey) => void;
  onForceClose: () => void;
  onScheduleClose: () => void;
  onCancelClose: () => void;
  onAnchorClick?: (anchor: string) => void;
}) {
  const opened = openKey === menuKey;
  const group = resolveMegaMenuGroup(menuKey, isMasterUser);
  const triggerClass = `${navTriggerClass} gap-0.5 ${opened ? activeNavTriggerClass : ''}`;

  const labelNode = (
    <>
      {label}
      <HiChevronDown
        className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${opened ? 'rotate-180' : ''}`}
        aria-hidden
      />
    </>
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        onCancelClose();
        onOpen(menuKey);
      }}
      onMouseLeave={onScheduleClose}
      onFocus={() => {
        onCancelClose();
        onOpen(menuKey);
      }}
    >
      {to ? (
        <NavLink
          to={to}
          className={({ isActive }) =>
            `${triggerClass} ${isActive && !opened ? activeNavTriggerClass : ''}`
          }
          onClick={() => {
            onForceClose();
            void setProfileRole('client');
          }}
        >
          {labelNode}
        </NavLink>
      ) : (
        <button
          type="button"
          className={triggerClass}
          onClick={() => {
            if (anchor && onAnchorClick) onAnchorClick(anchor);
          }}
        >
          {labelNode}
        </button>
      )}

      <MegaDropdownPanel
        group={group}
        sectionTitle={megaMenuSectionTitle(menuKey)}
        isOpen={opened}
        onAnchorClick={onAnchorClick ?? (() => {})}
        onForceClose={onForceClose}
      />
    </div>
  );
}

function MegaDropdownPanel({
  id,
  sectionTitle,
  items,
  group,
  isOpen,
  align = 'left',
  onAnchorClick,
  onForceClose,
  onMouseEnter,
  onMouseLeave,
}: {
  id?: string;
  sectionTitle?: string;
  items?: MegaMenuItem[];
  group?: MegaMenuGroup;
  isOpen: boolean;
  align?: 'left' | 'right';
  onAnchorClick: (anchor: string) => void;
  onForceClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const resolvedItems = items ?? group?.items ?? [];
  const title = sectionTitle ?? group?.label ?? '';
  const fallbackTo = group?.to;
  const fallbackAnchor = group?.anchor;

  if (resolvedItems.length === 0) return null;

  const titleClass = 'px-4 pb-1 pt-2 text-[12px] font-medium text-[#9CA3AF]';

  return (
    <div
      id={id}
      className={`absolute top-full z-[70] hidden pt-2 lg:block ${align === 'right' ? 'right-0' : 'left-0'} ${
        isOpen
          ? 'pointer-events-auto opacity-100 translate-y-0'
          : 'pointer-events-none opacity-0 -translate-y-1'
      } transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none`}
      aria-hidden={!isOpen}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`w-[min(22rem,calc(100vw-2rem))] ${MEGA_DROPDOWN_PANEL_CLASS}`}>
        {title ? <p className={titleClass}>{title}</p> : null}
        <ul className="py-1">
          {resolvedItems.map((item, index) => (
            <li key={`${item.title}-${index}`}>
              <MegaDropdownRow
                item={item}
                fallbackTo={fallbackTo}
                fallbackAnchor={fallbackAnchor}
                onAnchorClick={onAnchorClick}
                onForceClose={onForceClose}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MegaDropdownRow({
  item,
  fallbackTo,
  fallbackAnchor,
  onAnchorClick,
  onForceClose,
}: {
  item: MegaMenuItem;
  fallbackTo?: string;
  fallbackAnchor?: string;
  onAnchorClick: (anchor: string) => void;
  onForceClose: () => void;
}) {
  const Icon = item.icon ?? MEGA_ITEM_ICONS[item.accent ?? 'pink'];
  const to =
    item.to ??
    (item.anchor ? landingAnchorHref(item.anchor) : undefined) ??
    (fallbackAnchor && !fallbackTo ? landingAnchorHref(fallbackAnchor) : fallbackTo);
  const anchor = !to ? (item.anchor ?? fallbackAnchor) : undefined;

  const className =
    'group flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#F9FAFB] focus:outline-none focus-visible:bg-[#F9FAFB]';

  const content = (
    <>
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[#111827]">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold leading-tight text-[#111827]">{item.title}</span>
          {item.badge ? (
            <span className="rounded-full bg-[#FFF1F4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F47C8C]">
              {item.badge}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block line-clamp-1 leading-snug text-[12px] text-[#9CA3AF]">
          {item.description}
        </span>
      </span>
      <HiChevronRight
        className="mt-1 h-4 w-4 shrink-0 text-[#D1D5DB] transition group-hover:translate-x-0.5 group-hover:text-[#9CA3AF]"
        aria-hidden
      />
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={className}
        onClick={() => {
          onForceClose();
          void setProfileRole('client');
          if (to.startsWith(SERVICES_PATH)) {
            scrollCatalogPageToTop();
          }
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
      onClick={() => {
        if (anchor) onAnchorClick(anchor);
        onForceClose();
      }}
    >
      {content}
    </button>
  );
}
