import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HEADER_LOGO_SRC } from '../app/headerLogo';
import { ADMIN_PATH, BECOME_MASTER_PATH, HUB_PATH, PROFILE_PATH, SERVICES_PATH } from '../app/paths';
import { setProfileRole } from '../features/profile/lib/setProfileRole';

const MOBILE_MENU_LINKS = [
  { key: 'find', label: 'Найти услуги', to: SERVICES_PATH },
  { key: 'profile', label: 'Профиль', to: PROFILE_PATH },
] as const;

export type HomeHeaderProps = {
  isDemoMaster: boolean;
  onProfileTab: (tab: 'appointments' | 'favorites') => void | Promise<void>;
};

export function HomeHeader({
  isDemoMaster,
  onProfileTab,
}: HomeHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const masterNavPath = isDemoMaster ? ADMIN_PATH : BECOME_MASTER_PATH;
  const masterNavLabel = isDemoMaster ? 'Кабинет мастера' : 'Стать мастером';

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const prev = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <button
        type="button"
        className={`
          fixed inset-0 z-40
          cursor-default bg-transparent
          transition-opacity duration-300
          lg:hidden
          ${
            mobileMenuOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          }
        `}
        aria-label="Закрыть меню"
        tabIndex={-1}
        onClick={closeMobileMenu}
      />

      <header className="fixed inset-x-0 top-0 z-50 pt-[calc(0.5rem+env(safe-area-inset-top,0px))]">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
          <div
            className={`
              overflow-visible
              rounded-[30px]
              bg-[#F1EFEF]
              shadow-[0_1px_3px_rgba(0,0,0,0.06)]
              transition-all duration-300
            `}
          >
            {/* TOP BAR */}
            <div className="flex items-center justify-between px-4 py-2 sm:px-5 sm:py-2.5">
              {/* LOGO */}
              <Link
                to={HUB_PATH}
                aria-label="SLOTTY — на главную"
                className="inline-flex h-9 shrink-0 items-center overflow-visible outline-none ring-0 transition hover:opacity-60 sm:h-10"
              >
                <img
                  src={HEADER_LOGO_SRC}
                  alt=""
                  decoding="async"
                  fetchPriority="high"
                  className="h-9 w-auto origin-center object-contain [transform:translateY(0.25rem)_scale(1.56)] sm:h-10 sm:[transform:translateY(0.35rem)_scale(1.5)]"
                />
              </Link>

              {/* DESKTOP NAV */}
              <div className="hidden items-center gap-8 text-[15px] font-medium text-neutral-800 lg:flex">
                <a
                  href="#tarify"
                  className="transition hover:opacity-60"
                >
                  Тарифы
                </a>

                <a
                  href="#nagrady"
                  className="transition hover:opacity-60"
                >
                  Награды
                </a>

                <button
                  type="button"
                  onClick={() => void onProfileTab('appointments')}
                  className="cursor-pointer border-0 bg-transparent p-0 text-inherit transition hover:opacity-60"
                >
                  Мои записи
                </button>

                <Link
                  to={masterNavPath}
                  className="transition hover:opacity-60"
                >
                  {masterNavLabel}
                </Link>

                <Link
                  to="/settings"
                  className="transition hover:opacity-60"
                >
                  Войти
                </Link>
              </div>

              {/* BURGER */}
              <button
                type="button"
                aria-expanded={mobileMenuOpen}
                aria-controls="home-mobile-menu"
                aria-label={
                  mobileMenuOpen
                    ? 'Закрыть меню'
                    : 'Открыть меню'
                }
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="
                  relative z-50
                  flex h-9 w-9
                  items-center justify-center
                  rounded-full
                  transition
                  hover:bg-black/5
                  active:scale-95
                  lg:hidden
                "
              >
                <div className="relative h-5 w-5">
                  {/* TOP */}
                  <span
                    className={`
                      absolute left-0 top-1/2
                      h-[2px] w-5
                      rounded-full bg-black
                      transition-all duration-300
                      ${
                        mobileMenuOpen
                          ? 'translate-y-0 rotate-45'
                          : '-translate-y-[6px]'
                      }
                    `}
                  />

                  {/* MIDDLE */}
                  <span
                    className={`
                      absolute left-0 top-1/2
                      h-[2px] w-5
                      rounded-full bg-black
                      transition-all duration-300
                      ${
                        mobileMenuOpen
                          ? 'opacity-0'
                          : 'opacity-100'
                      }
                    `}
                  />

                  {/* BOTTOM */}
                  <span
                    className={`
                      absolute left-0 top-1/2
                      h-[2px] w-5
                      rounded-full bg-black
                      transition-all duration-300
                      ${
                        mobileMenuOpen
                          ? 'translate-y-0 -rotate-45'
                          : 'translate-y-[6px]'
                      }
                    `}
                  />
                </div>
              </button>
            </div>

            {/* MOBILE MENU */}
            <div
              id="home-mobile-menu"
              className={`
                overflow-hidden
                transition-all duration-300
                lg:hidden
                ${
                  mobileMenuOpen
                    ? 'max-h-[700px] opacity-100'
                    : 'max-h-0 opacity-0'
                }
              `}
            >
              <div className="pb-5 pl-7 pr-4 pt-1 sm:pb-5 sm:pl-9 sm:pr-5 sm:pt-1">
                <nav aria-label="Разделы">
                  <ul className="flex flex-col">
                    {MOBILE_MENU_LINKS.map((row) => (
                      <li key={row.key}>
                        <Link
                          to={row.to}
                          className="
                              block py-4
                              text-[18px]
                              font-medium
                              text-neutral-900
                            "
                          onClick={() => {
                            closeMobileMenu();
                            void setProfileRole('client');
                          }}
                        >
                          {row.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* BUTTONS */}
                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    to={masterNavPath}
                    onClick={closeMobileMenu}
                    className="
                      w-full
                      rounded-full
                      bg-brand-primary
                      py-4
                      text-center
                      text-[15px]
                      font-semibold
                      text-white
                      transition
                      hover:opacity-90
                      active:scale-[0.99]
                    "
                  >
                    {masterNavLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}