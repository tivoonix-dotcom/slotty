import type { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  BECOME_MASTER_PATH,
  BOOKING_PATH,
  HUB_PATH,
  LEGAL_CONSENT_PATH,
  LEGAL_CROSS_BORDER_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_TERMS_PATH,
  SERVICES_PATH,
} from '../app/paths';
import { homeShell } from './home/homeLayout';
import { TIVONIX_SITE_URL } from './legal/legalSiteInfo';
const FOOTER_MARQUEE_SERVICES = [
  'Лимфодренаж',
  'Кератин',
  'Дизайн',
  'Маникюр',
  'Педикюр',
  'Окрашивание',
  'Ресницы',
  'Брови',
  'Стрижка',
] as const;

const FOOTER_COL_A = [
  { key: 'booking', label: 'Запись', to: BOOKING_PATH },
  { key: 'catalog', label: 'Каталог', to: SERVICES_PATH },
  { key: 'tarify', label: 'Тарифы', to: `${HUB_PATH}#tarify` },
  { key: 'faq', label: 'FAQ', to: `${HUB_PATH}#faq` },
  { key: 'masters', label: 'Для мастеров', to: `${HUB_PATH}#for-masters` },
] as const;

const FOOTER_COL_B = [
  { key: 'master', label: 'Кабинет мастера', to: BECOME_MASTER_PATH },
  { key: 'privacy', label: 'Политика ПД', to: LEGAL_PRIVACY_PATH },
  { key: 'consent', label: 'Согласие на обработку', to: LEGAL_CONSENT_PATH },
  { key: 'cross', label: 'Трансграничная передача', to: LEGAL_CROSS_BORDER_PATH },
  { key: 'terms', label: 'Пользовательское соглашение', to: LEGAL_TERMS_PATH },
] as const;

const navLinkClass =
  'text-[15px] font-medium text-[#171717]/85 transition hover:text-[#171717] active:opacity-80';

const inputClass =
  'h-10 w-full rounded-full bg-white/12 px-4 text-[13px] text-white placeholder:text-white/55 outline-none ring-1 ring-inset ring-white/12 transition focus:ring-white/30';

const ctaClass =
  'inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-white px-4 text-[13px] font-semibold text-[#171717] transition hover:bg-white/90 active:opacity-80';

function FooterLinkList({ items }: { items: readonly { key: string; label: string; to: string }[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.key}>
          <Link to={item.to} className={navLinkClass}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export const HomeFooter: FC = () => {
  const year = new Date().getFullYear();
  const marqueeTrack = Array.from({ length: 6 })
    .flatMap(() => FOOTER_MARQUEE_SERVICES);

  return (
    <footer className="relative w-full overflow-hidden bg-[#E29595] text-[#171717]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background:radial-gradient(800px_circle_at_20%_10%,rgba(255,255,255,0.95),transparent_55%),radial-gradient(900px_circle_at_80%_40%,rgba(255,255,255,0.65),transparent_55%)]" />

      <div className="relative">
        <div className="border-b border-black/10 py-5 sm:py-6">
          <div className="relative left-1/2 w-[100vw] max-w-[100vw] -translate-x-1/2 overflow-hidden">
            <div className="flex w-max items-center gap-8 px-6 text-[30px] font-bold tracking-[-0.04em] text-white sm:text-[40px] motion-reduce:animate-none animate-services-marquee-left">
              {[...marqueeTrack, ...marqueeTrack].map((text, index) => (
                <span key={`${text}-${index}`} className="inline-flex items-center gap-5">
                  <span>{text}</span>
                  <span aria-hidden className="text-white/55">
                    •
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={`${homeShell} px-5 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-10 sm:px-6 sm:pt-12 lg:pt-14`}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
            <div>
              <h3 className="text-pretty text-[18px] font-semibold tracking-[-0.02em] text-[#171717] sm:text-[19px]">
                Подпишись на новости и обновления
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#171717]/70 sm:text-[14px]">
                Новые мастера, акции и полезные материалы — иногда, без спама.
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input className={inputClass} placeholder="Введите email" />
                <button type="button" className={ctaClass}>
                  Подписаться
                </button>
              </div>

              <p className="mt-2 text-[12px] text-[#171717]/55">
                Нажимая «Подписаться», вы соглашаетесь с{' '}
                <Link to={LEGAL_PRIVACY_PATH} className="font-medium underline decoration-black/20 underline-offset-2 hover:decoration-black/40">
                  политикой конфиденциальности
                </Link>
                .
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3 sm:gap-x-14 md:gap-x-20">
              <nav aria-label="Разделы сайта">
                <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-[#171717]/55">РАЗДЕЛЫ</p>
                <FooterLinkList items={FOOTER_COL_A} />
              </nav>
              <nav aria-label="Мастерам и документы">
                <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-[#171717]/55">ДОКУМЕНТЫ</p>
                <FooterLinkList items={FOOTER_COL_B} />
              </nav>
              <nav aria-label="Контакты">
                <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-[#171717]/55">КОНТАКТ</p>
                <ul className="flex flex-col gap-2.5">
                  <li>
                    <a href={TIVONIX_SITE_URL} target="_blank" rel="noopener noreferrer" className="text-[15px] font-medium text-[#171717]/85 transition hover:text-[#171717] active:opacity-80">
                      tivonix.tech
                    </a>
                  </li>
                  <li>
                    <Link to={BECOME_MASTER_PATH} className="text-[15px] font-medium text-[#171717]/85 transition hover:text-[#171717] active:opacity-80">
                      Стать мастером
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <div className="relative mt-12 border-t border-black/10 pt-6 sm:mt-14 sm:pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <p className="text-[13px] text-[#171717]/60">
                  © SLOTTY 2024 – {year}
                </p>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Link to={LEGAL_PRIVACY_PATH} className="text-[13px] font-medium text-[#171717]/60 transition hover:text-[#171717]/80">
                  Политика конфиденциальности
                </Link>
                <Link to={LEGAL_TERMS_PATH} className="text-[13px] font-medium text-[#171717]/60 transition hover:text-[#171717]/80">
                  Условия использования
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 pb-2 sm:mt-8 sm:pb-3">
            <div
              aria-hidden
              className="pointer-events-none relative left-1/2 w-[1200px] max-w-[120vw] -translate-x-1/2 -translate-y-[3%] select-none text-center text-[140px] font-black leading-none tracking-[-0.06em] text-white/60 sm:-translate-y-[4%] sm:text-[220px] md:text-[260px] lg:text-[320px]"
            >
              SLOTTY
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
