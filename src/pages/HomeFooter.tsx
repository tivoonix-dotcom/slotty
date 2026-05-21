import type { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  BECOME_MASTER_PATH,
  BOOKING_PATH,
  HUB_PATH,
  LEGAL_PD_CONSENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_TERMS_PATH,
} from '../app/paths';
import { TIVONIX_SITE_URL } from './legal/legalSiteInfo';

const FOOTER_BG = '/photos/foooter.png';

const FOOTER_NAV = [
  { key: 'booking', label: 'Запись', to: BOOKING_PATH },
  { key: 'tarify', label: 'Тарифы', to: `${HUB_PATH}#tarify` },
  { key: 'faq', label: 'FAQ', to: `${HUB_PATH}#faq` },
  { key: 'master', label: 'Кабинет мастера', to: BECOME_MASTER_PATH },
] as const;

const LEGAL_LINKS = [
  { key: 'privacy', label: 'Политика ПД', to: LEGAL_PRIVACY_PATH },
  { key: 'consent', label: 'Согласие на обработку ПД', to: LEGAL_PD_CONSENT_PATH },
  { key: 'terms', label: 'Пользовательское соглашение', to: LEGAL_TERMS_PATH },
] as const;

const linkClass =
  'text-[15px] font-semibold text-white/90 transition hover:text-white active:opacity-80';

const legalLinkClass =
  'text-[14px] font-semibold text-white/75 underline-offset-2 transition hover:text-white hover:underline';

export const HomeFooter: FC = () => {
  return (
    <footer className="mt-14 pb-[max(2rem,env(safe-area-inset-bottom))] sm:mt-16">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <div
          className="relative overflow-hidden rounded-[28px] bg-cover bg-center bg-no-repeat px-5 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.2)] sm:rounded-[32px] sm:px-7 sm:py-8"
          style={{ backgroundImage: `url('${FOOTER_BG}')` }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-black/25 to-black/40" aria-hidden />

          <div className="relative z-10 text-white">
            <p className="text-[20px] font-bold tracking-tight text-white">SLOTTY</p>
            <p className="mt-1 max-w-sm text-[14px] leading-relaxed text-white/80">
              Онлайн-запись к мастерам прямо в Telegram.
            </p>

            <nav aria-label="Навигация" className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Навигация</p>
              <ul className="mt-2 flex flex-col gap-2">
                {FOOTER_NAV.map((item) => (
                  <li key={item.key}>
                    <Link to={item.to} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Документы</p>
              <nav aria-label="Юридические документы" className="mt-2 flex flex-col gap-2">
                {LEGAL_LINKS.map((item) => (
                  <Link key={item.key} to={item.to} className={legalLinkClass}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <p className="mt-8 text-center text-[13px] font-medium text-white/65">
              Разработка и сопровождение —{' '}
              <a
                href={TIVONIX_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#FFB8C6] underline decoration-white/30 underline-offset-2 transition hover:text-white"
              >
                tivonix.tech
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
