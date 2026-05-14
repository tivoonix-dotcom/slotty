import type { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  BOOKING_PATH,
  HUB_PATH,
  LEGAL_PD_CONSENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_TERMS_PATH,
} from '../app/paths';
import { TIVONIX_SITE_URL } from './legal/legalSiteInfo';

const FOOTER_IMAGE = '/photos/FOOTER.png';
const FOOTER_LOGO_SRC = '/photos/logo.png';

/** Сдвиг логотипа по горизонтали; при ширине как у хедера обычно достаточно 0. */
const FOOTER_LOGO_TRANSLATE_X = '0';

const FOOTER_LINKS = [
  { key: 'booking', label: 'Запись', to: BOOKING_PATH },
  { key: 'tarify', label: 'Тарифы', to: `${HUB_PATH}#tarify` },
  { key: 'trust', label: 'Команды', to: `${HUB_PATH}#nagrady` },
  { key: 'faq', label: 'FAQ', to: `${HUB_PATH}#faq` },
  { key: 'telegram', label: 'Telegram', to: `${HUB_PATH}#telegram-showcase` },
  { key: 'settings', label: 'Настройки', to: '/settings' },
] as const;

const LEGAL_LINKS = [
  { key: 'privacy', label: 'Политика ПД', to: LEGAL_PRIVACY_PATH },
  { key: 'consent', label: 'Согласие на обработку ПД', to: LEGAL_PD_CONSENT_PATH },
  { key: 'terms', label: 'Пользовательское соглашение', to: LEGAL_TERMS_PATH },
] as const;

export const HomeFooter: FC = () => {
  return (
    <footer
      className="
        mt-16
        pb-[max(1.75rem,env(safe-area-inset-bottom))]
        sm:mt-20
      "
    >
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <div
          className="
            overflow-hidden
            rounded-[42px]
            bg-[#F1EFEF]
            p-3
            shadow-[0_24px_70px_rgba(17,17,17,0.06)]
            sm:rounded-[48px]
          "
        >
          <div
            className="
              overflow-hidden
              rounded-[34px]
              bg-white
              pt-0
              shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]
              sm:rounded-[40px]
            "
          >
            <div className="px-6 pb-0 pt-0 sm:px-8">
              <div
                className="
                  -mx-6
                  m-0
                  flex
                  items-start
                  justify-start
                  p-0
                  leading-[0]
                  sm:-mx-8
                "
              >
                <img
                  src={FOOTER_LOGO_SRC}
                  alt="SLOTTY"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  style={{
                    transform: `translateX(${FOOTER_LOGO_TRANSLATE_X})`,
                    margin: 0,
                    padding: 0,
                    display: 'block',
                  }}
                  className="
                    m-0
                    block
                    h-auto
                    max-w-full
                    p-0
                    leading-[0]
                    select-none
                    object-contain
                    object-left
                    w-[min(100%,240px)]
                    sm:w-[min(100%,320px)]
                  "
                />
              </div>

              <nav
                aria-label="Нижнее меню"
                className="
                  -mt-5
                  grid
                  grid-cols-2
                  gap-x-8
                  gap-y-2
                  sm:-mt-6
                "
              >
                {FOOTER_LINKS.map((item) => (
                  <Link
                    key={item.key}
                    to={item.to}
                    className="
                      text-[15px]
                      font-semibold
                      tracking-[-0.03em]
                      text-neutral-800
                      transition
                      active:scale-[0.98]
                      hover:text-neutral-950
                    "
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-6 border-t border-neutral-200/80 pt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Документы</p>
                <nav aria-label="Юридические документы" className="mt-2 flex flex-col gap-2">
                  {LEGAL_LINKS.map((item) => (
                    <Link
                      key={item.key}
                      to={item.to}
                      className="text-[14px] font-semibold text-neutral-700 underline-offset-2 transition hover:text-neutral-950 hover:underline active:scale-[0.99]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <p className="mt-6 text-center text-[13px] font-medium leading-snug text-neutral-500">
                Разработка и сопровождение —{' '}
                <a
                  href={TIVONIX_SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#E29595] underline decoration-[#E29595]/35 underline-offset-2 transition hover:decoration-[#E29595]"
                >
                  tivonix.tech
                </a>
              </p>
            </div>

            <div className="mt-[calc(1.5rem+15px)] sm:mt-[calc(2rem+15px)]">
              <img
                src={FOOTER_IMAGE}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="
                  block
                  w-full
                  select-none
                  object-cover
                  object-bottom
                "
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
