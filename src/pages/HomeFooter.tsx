import { useState, type FormEvent, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  BECOME_MASTER_PATH,
  BOOKING_PATH,
  HUB_PATH,
  LEGAL_CONSENT_PATH,
  LEGAL_CROSS_BORDER_PATH,
  LEGAL_PAYMENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_PUBLIC_OFFER_PATH,
  LEGAL_REFUND_PATH,
  LEGAL_TERMS_PATH,
  SERVICES_PATH,
} from '../app/paths';
import { subscribeToNewsletter } from '../features/newsletter/api/newsletterApi';
import { PaymentLogos } from '../shared/ui/PaymentLogos';
import { homeShell } from './home/homeLayout';
import { SITE_PUBLIC_URL } from './legal/legalSiteInfo';

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
  { key: 'offer', label: 'Публичная оферта', to: LEGAL_PUBLIC_OFFER_PATH },
  { key: 'payment', label: 'Оплата', to: LEGAL_PAYMENT_PATH },
  { key: 'refund', label: 'Возвраты', to: LEGAL_REFUND_PATH },
] as const;

const navLinkBrandClass =
  'text-[15px] font-medium text-[#171717]/85 transition hover:text-[#171717] active:opacity-80';

const navLinkDarkClass =
  'text-[15px] font-medium text-white/75 transition hover:text-white active:opacity-80';

const inputClass =
  'h-10 w-full rounded-full bg-white/12 px-4 text-[13px] text-white placeholder:text-white/55 outline-none ring-1 ring-inset ring-white/12 transition focus:ring-white/30 disabled:opacity-60';

const ctaClass =
  'inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-white px-4 text-[13px] font-semibold text-[#171717] transition hover:bg-white/90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60';

function FooterLinkList({
  items,
  linkClass,
}: {
  items: readonly { key: string; label: string; to: string }[];
  linkClass: string;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.key}>
          <Link to={item.to} className={linkClass}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type HomeFooterProps = {
  tone?: 'brand' | 'dark';
};

export const HomeFooter: FC<HomeFooterProps> = ({ tone = 'brand' }) => {
  const isDark = tone === 'dark';
  const navLinkClass = isDark ? navLinkDarkClass : navLinkBrandClass;
  const year = new Date().getFullYear();
  const marqueeTrack = Array.from({ length: 6 }).flatMap(() => FOOTER_MARQUEE_SERVICES);

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function onSubscribe(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setFeedback({ kind: 'error', text: 'Введите корректный email.' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await subscribeToNewsletter(trimmed);
      setFeedback({ kind: 'success', text: result.message });
      setEmail('');
    } catch {
      setFeedback({ kind: 'error', text: 'Не удалось оформить подписку. Попробуйте позже.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer
      className={`relative w-full overflow-hidden ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#E29595] text-[#171717]'}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? 'opacity-100 [background:radial-gradient(900px_circle_at_15%_0%,rgba(255,95,122,0.12),transparent_55%),radial-gradient(700px_circle_at_85%_30%,rgba(255,255,255,0.04),transparent_50%)]'
            : 'opacity-[0.16] [background:radial-gradient(800px_circle_at_20%_10%,rgba(255,255,255,0.95),transparent_55%),radial-gradient(900px_circle_at_80%_40%,rgba(255,255,255,0.65),transparent_55%)]'
        }`}
      />

      <div className="relative">
        <div className={`border-b py-5 sm:py-6 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <div className="relative left-1/2 w-[100vw] max-w-[100vw] -translate-x-1/2 overflow-hidden">
            <div
              className={`flex w-max items-center gap-8 px-6 text-[30px] font-bold tracking-[-0.04em] sm:text-[40px] motion-reduce:animate-none animate-services-marquee-left ${
                isDark ? 'text-white/15' : 'text-white'
              }`}
            >
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
              <h3
                className={`text-pretty text-[18px] font-semibold tracking-[-0.02em] sm:text-[19px] ${
                  isDark ? 'text-white' : 'text-[#171717]'
                }`}
              >
                Подпишись на новости и обновления
              </h3>
              <p
                className={`mt-2 text-[13px] leading-relaxed sm:text-[14px] ${
                  isDark ? 'text-white/55' : 'text-[#171717]/70'
                }`}
              >
                Новые мастера, акции и полезные материалы — иногда, без спама.
              </p>

              <form className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center" onSubmit={onSubscribe} noValidate>
                <input
                  className={inputClass}
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Введите email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  disabled={submitting}
                  aria-label="Email для подписки на новости"
                />
                <button type="submit" className={ctaClass} disabled={submitting}>
                  {submitting ? 'Отправка…' : 'Подписаться'}
                </button>
              </form>

              {feedback ? (
                <p
                  className={`mt-2 text-[12px] ${
                    feedback.kind === 'success'
                      ? isDark
                        ? 'text-white/65'
                        : 'text-[#171717]/80'
                      : isDark
                        ? 'text-[#fca5a5]'
                        : 'text-[#7f1d1d]'
                  }`}
                  role={feedback.kind === 'error' ? 'alert' : 'status'}
                >
                  {feedback.text}
                </p>
              ) : null}

              <p className={`mt-2 text-[12px] ${isDark ? 'text-white/40' : 'text-[#171717]/55'}`}>
                Нажимая «Подписаться», вы соглашаетесь с{' '}
                <Link
                  to={LEGAL_PRIVACY_PATH}
                  className={`font-medium underline underline-offset-2 ${
                    isDark
                      ? 'decoration-white/25 hover:decoration-[#ff8fa3] text-white/70'
                      : 'decoration-black/20 hover:decoration-black/40'
                  }`}
                >
                  политикой конфиденциальности
                </Link>
                .
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3 sm:gap-x-14 md:gap-x-20">
              <nav aria-label="Разделы сайта">
                <p
                  className={`mb-3 text-[12px] font-semibold tracking-[0.08em] ${
                    isDark ? 'text-white/35' : 'text-[#171717]/55'
                  }`}
                >
                  РАЗДЕЛЫ
                </p>
                <FooterLinkList items={FOOTER_COL_A} linkClass={navLinkClass} />
              </nav>
              <nav aria-label="Мастерам и документы">
                <p
                  className={`mb-3 text-[12px] font-semibold tracking-[0.08em] ${
                    isDark ? 'text-white/35' : 'text-[#171717]/55'
                  }`}
                >
                  ДОКУМЕНТЫ
                </p>
                <FooterLinkList items={FOOTER_COL_B} linkClass={navLinkClass} />
              </nav>
              <nav aria-label="Контакты">
                <p
                  className={`mb-3 text-[12px] font-semibold tracking-[0.08em] ${
                    isDark ? 'text-white/35' : 'text-[#171717]/55'
                  }`}
                >
                  КОНТАКТ
                </p>
                <ul className="flex flex-col gap-2.5">
                  <li>
                    <a
                      href={SITE_PUBLIC_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={navLinkClass}
                    >
                      slotty.of.by
                    </a>
                  </li>
                  <li>
                    <Link to={BECOME_MASTER_PATH} className={navLinkClass}>
                      Стать мастером
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <div className={`mt-10 max-w-2xl ${isDark ? '[&_p]:text-white/45 [&_p]:font-semibold' : ''}`}>
            <PaymentLogos
              variant="footer"
              title="Планируемые способы оплаты"
              showDisclaimer
            />
          </div>

          <div
            className={`relative mt-12 border-t pt-6 sm:mt-14 sm:pt-8 ${
              isDark ? 'border-white/10' : 'border-black/10'
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <p className={`text-[13px] ${isDark ? 'text-white/40' : 'text-[#171717]/60'}`}>
                  © SLOTTY 2024 – {year}
                </p>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Link
                  to={LEGAL_PRIVACY_PATH}
                  className={`text-[13px] font-medium transition ${
                    isDark ? 'text-white/45 hover:text-white/80' : 'text-[#171717]/60 hover:text-[#171717]/80'
                  }`}
                >
                  Политика конфиденциальности
                </Link>
                <Link
                  to={LEGAL_TERMS_PATH}
                  className={`text-[13px] font-medium transition ${
                    isDark ? 'text-white/45 hover:text-white/80' : 'text-[#171717]/60 hover:text-[#171717]/80'
                  }`}
                >
                  Условия использования
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 pb-2 sm:mt-8 sm:pb-3">
            <div
              aria-hidden
              className={`pointer-events-none relative left-1/2 w-[1200px] max-w-[120vw] -translate-x-1/2 -translate-y-[3%] select-none text-center text-[140px] font-black leading-none tracking-[-0.06em] sm:-translate-y-[4%] sm:text-[220px] md:text-[260px] lg:text-[320px] ${
                isDark ? 'text-white/[0.07]' : 'text-white/60'
              }`}
            >
              SLOTTY
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
