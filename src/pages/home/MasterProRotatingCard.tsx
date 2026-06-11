import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export const MASTER_PRO_ROTATE_MS = 2000;

type ThemeVariant = 'dark' | 'light';

type CategoryTheme = {
  key: string;
  label: string;
  image: string;
  variant: ThemeVariant;
  accent: string;
  scrim?: string;
};

export const MASTER_PRO_CATEGORY_THEMES: CategoryTheme[] = [
  {
    key: 'barbers',
    label: 'Барбершоп',
    image: '/photos/plan/barber.webp',
    variant: 'dark',
    accent: '#FFE566',
    scrim: 'bg-black/25',
  },
  {
    key: 'tattoo',
    label: 'Тату',
    image: '/photos/plan/tattoo.webp',
    variant: 'dark',
    accent: '#F0C8A8',
    scrim: 'bg-black/30',
  },
  {
    key: 'massage',
    label: 'Массаж',
    image: '/photos/plan/massage.webp',
    variant: 'light',
    accent: '#3D6B52',
    scrim: 'bg-white/15',
  },
  {
    key: 'manicure',
    label: 'Маникюр',
    image: '/photos/plan/manicure.webp',
    variant: 'light',
    accent: '#C45C7A',
    scrim: 'bg-white/20',
  },
  {
    key: 'brows',
    label: 'Брови и ресницы',
    image: '/photos/plan/brows.webp',
    variant: 'light',
    accent: '#8B4A5C',
    scrim: 'bg-white/18',
  },
  {
    key: 'fitness',
    label: 'Фитнес',
    image: '/photos/plan/fitness.webp',
    variant: 'dark',
    accent: '#7EC8FF',
    scrim: 'bg-black/35',
  },
];

export const MASTER_PRO_DEFAULT_FEATURES = [
  'Профиль мастера',
  'Услуги и цены',
  'График работы',
  'Заявки клиентов',
  'Акции и свободные окна',
  'Telegram-уведомления',
] as const;

function textPalette(variant: ThemeVariant) {
  if (variant === 'dark') {
    return {
      primary: '#FFFFFF',
      muted: 'rgba(255, 255, 255, 0.75)',
      body: 'rgba(255, 255, 255, 0.88)',
      feature: '#FFFFFF',
      badgeBg: 'rgba(255, 255, 255, 0.2)',
      badgeText: '#FFFFFF',
      checkBg: 'rgba(255, 255, 255, 0.2)',
      checkIcon: '#FFFFFF',
      ctaBg: '#FFFFFF',
      ctaText: '#111827',
    };
  }
  return {
    primary: '#111827',
    muted: '#6B7280',
    body: '#4B5563',
    feature: '#374151',
    badgeBg: 'rgba(17, 24, 39, 0.08)',
    badgeText: '#374151',
    checkBg: 'rgba(255, 255, 255, 0.9)',
    checkIcon: '#111827',
    ctaBg: '#111827',
    ctaText: '#FFFFFF',
  };
}

function accentGlow(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return `rgba(244, 124, 140, ${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function IconCheck({ className, color }: { className?: string; color: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      aria-hidden
    >
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type MasterProRotatingCardProps = {
  priceValue: string;
  priceUnit: string;
  description: string;
  features?: readonly string[];
  topBadge?: string;
  /** Кастомная кнопка; если не задана — Link по `ctaHref` + `ctaLabel`. */
  cta?: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
  /** Кнопка сразу под списком, без растягивания (кабинет «Тарифы»). */
  denseCta?: boolean;
  /** Слот под заголовком (период оплаты в кабинете). */
  slotAfterTitle?: ReactNode;
  className?: string;
};

export function MasterProRotatingCard({
  priceValue,
  priceUnit,
  description,
  features = MASTER_PRO_DEFAULT_FEATURES,
  topBadge = 'Рекомендуем',
  cta,
  ctaHref,
  ctaLabel,
  denseCta = false,
  slotAfterTitle,
  className = '',
}: MasterProRotatingCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotionOk(!mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    MASTER_PRO_CATEGORY_THEMES.forEach((item) => {
      const img = new Image();
      img.src = item.image;
    });
  }, []);

  useEffect(() => {
    if (!motionOk) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % MASTER_PRO_CATEGORY_THEMES.length);
    }, MASTER_PRO_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [motionOk]);

  const theme = MASTER_PRO_CATEGORY_THEMES[activeIndex];
  const colors = textPalette(theme.variant);
  const isDark = theme.variant === 'dark';

  const cardShadow = isDark
    ? '0 20px 56px rgba(0,0,0,0.35)'
    : '0 20px 56px rgba(17,24,39,0.14)';

  return (
    <div
      className={`rounded-[22px] p-[2px] transition-[background-color,box-shadow] duration-700 ease-in-out sm:rounded-[22px] ${className}`}
      style={{
        backgroundColor: theme.accent,
        boxShadow: `0 0 32px ${accentGlow(theme.accent, 0.55)}, ${cardShadow}`,
      }}
    >
      <article
        className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] px-5 pb-6 pt-5 sm:rounded-[20px] sm:p-7 ${
          denseCta ? 'min-h-[28rem] lg:min-h-0' : 'min-h-[20rem]'
        }`}
      >
      {MASTER_PRO_CATEGORY_THEMES.map((item, index) => (
        <div
          key={item.key}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${item.image}')` }}
          aria-hidden={index !== activeIndex}
        >
          {item.scrim ? <div className={`absolute inset-0 ${item.scrim}`} /> : null}
        </div>
      ))}

      {topBadge ? (
        <span
          className="absolute right-4 top-4 z-10 rounded-full px-3 py-1 font-landing text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-700"
          style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}
        >
          {topBadge}
        </span>
      ) : null}

      <div className={`relative z-10 flex flex-col ${denseCta ? 'flex-1' : 'flex-1'}`}>
        <p
          className="font-hero-display text-[18px] font-medium tracking-tight transition-colors duration-700"
          style={{ color: colors.primary }}
          aria-live={motionOk ? 'polite' : 'off'}
        >
          Мастер Pro
          <span
            className="font-landing mt-1 block text-[15px] font-semibold transition-colors duration-700"
            style={{ color: theme.accent }}
          >
            {theme.label}
          </span>
        </p>

        {slotAfterTitle ? <div className="mt-4">{slotAfterTitle}</div> : null}

        <div className="mt-4 flex items-baseline gap-1">
          <span
            className="font-hero-display text-[36px] font-medium tracking-tight transition-colors duration-700"
            style={{ color: colors.primary }}
          >
            {priceValue}
          </span>
          <span
            className="font-landing text-[14px] font-medium transition-colors duration-700"
            style={{ color: colors.muted }}
          >
            {priceUnit}
          </span>
        </div>

        <p
          className="font-landing mt-3 text-[14px] leading-relaxed transition-colors duration-700"
          style={{ color: colors.body }}
        >
          {description}
        </p>

        <ul className={`mt-4 flex flex-col gap-2 ${denseCta ? '' : 'flex-1'}`}>
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-700"
                style={{ backgroundColor: colors.checkBg }}
              >
                <IconCheck
                  className="h-3.5 w-3.5"
                  color={theme.variant === 'light' ? theme.accent : colors.checkIcon}
                />
              </span>
              <span
                className="font-landing text-[14px] font-medium transition-colors duration-700"
                style={{ color: colors.feature }}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <div className={denseCta ? 'mt-4' : 'mt-5'}>
          {cta ??
            (ctaHref && ctaLabel ? (
              <Link
                to={ctaHref}
                className="font-landing flex min-h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold transition active:scale-[0.98]"
                style={{
                  backgroundColor: colors.ctaBg,
                  color: colors.ctaText,
                  boxShadow: isDark ? '0 10px 28px rgba(0,0,0,0.12)' : '0 10px 28px rgba(17,24,39,0.18)',
                }}
              >
                {ctaLabel}
              </Link>
            ) : null)}
        </div>
      </div>
      </article>
    </div>
  );
}
