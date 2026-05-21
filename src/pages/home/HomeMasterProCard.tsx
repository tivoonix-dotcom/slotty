import { useEffect, useState, type FC } from 'react';
import { Link } from 'react-router-dom';

const ROTATE_MS = 2000;
const PLAN = '/photos/план';

type ThemeVariant = 'dark' | 'light';

type CategoryTheme = {
  key: string;
  label: string;
  image: string;
  variant: ThemeVariant;
  accent: string;
  scrim?: string;
};

const CATEGORY_THEMES: CategoryTheme[] = [
  {
    key: 'barbers',
    label: 'Барбершоп',
    image: `${PLAN}/барбер.png`,
    variant: 'dark',
    accent: '#FFE566',
    scrim: 'bg-black/25',
  },
  {
    key: 'tattoo',
    label: 'Тату',
    image: `${PLAN}/тату.png`,
    variant: 'dark',
    accent: '#F0C8A8',
    scrim: 'bg-black/30',
  },
  {
    key: 'massage',
    label: 'Массаж',
    image: `${PLAN}/массаж.png`,
    variant: 'light',
    accent: '#3D6B52',
    scrim: 'bg-white/15',
  },
  {
    key: 'manicure',
    label: 'Маникюр',
    image: `${PLAN}/маниюко.png`,
    variant: 'light',
    accent: '#C45C7A',
    scrim: 'bg-white/20',
  },
  {
    key: 'brows',
    label: 'Брови и ресницы',
    image: `${PLAN}/брови.png`,
    variant: 'light',
    accent: '#8B4A5C',
    scrim: 'bg-white/18',
  },
  {
    key: 'fitness',
    label: 'Фитнес',
    image: `${PLAN}/фитнес.png`,
    variant: 'dark',
    accent: '#7EC8FF',
    scrim: 'bg-black/35',
  },
];

const FEATURES = [
  'Профиль мастера',
  'Услуги и цены',
  'График работы',
  'Заявки клиентов',
  'Акции и свободные окна',
  'Telegram-уведомления',
] as const;

/** Явные цвета — не зависят от purge Tailwind для динамических классов */
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

export type HomeMasterProCardProps = {
  cta: string;
  to: string;
};

export const HomeMasterProCard: FC<HomeMasterProCardProps> = ({ cta, to }) => {
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
    if (!motionOk) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % CATEGORY_THEMES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [motionOk]);

  const theme = CATEGORY_THEMES[activeIndex];
  const colors = textPalette(theme.variant);
  const isDark = theme.variant === 'dark';

  return (
    <article
      className={`relative flex min-h-[20rem] flex-col overflow-hidden rounded-[26px] px-5 pb-6 pt-5 ring-2 transition-[box-shadow] duration-700 ${
        isDark ? 'ring-white/15' : 'ring-[#111827]/10'
      }`}
      style={{
        boxShadow: isDark ? '0 20px 56px rgba(0,0,0,0.35)' : '0 20px 56px rgba(17,24,39,0.14)',
      }}
    >
      {CATEGORY_THEMES.map((item, index) => (
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

      <span
        className="absolute right-4 top-4 z-10 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-700"
        style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}
      >
        Рекомендуем
      </span>

      <div className="relative z-10 flex flex-1 flex-col">
        <p
          className="text-[18px] font-semibold tracking-tight transition-colors duration-700"
          style={{ color: colors.primary }}
          aria-live={motionOk ? 'polite' : 'off'}
        >
          Мастер Pro
          <span className="mt-1 block text-[15px] font-bold transition-colors duration-700" style={{ color: theme.accent }}>
            {theme.label}
          </span>
        </p>

        <div className="mt-4 flex items-baseline gap-1">
          <span
            className="text-[36px] font-bold tracking-tight transition-colors duration-700"
            style={{ color: colors.primary }}
          >
            29 BYN
          </span>
          <span className="text-[14px] font-medium transition-colors duration-700" style={{ color: colors.muted }}>
            / месяц
          </span>
        </div>

        <p
          className="mt-3 text-[14px] leading-relaxed transition-colors duration-700"
          style={{ color: colors.body }}
        >
          Для мастеров, которые хотят принимать записи онлайн и управлять услугами в одном кабинете.
        </p>

        <ul className="mt-4 flex flex-1 flex-col gap-2">
          {FEATURES.map((feature) => (
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
                className="text-[14px] font-medium transition-colors duration-700"
                style={{ color: colors.feature }}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <Link
          to={to}
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold transition-colors duration-700 active:scale-[0.98]"
          style={{
            backgroundColor: colors.ctaBg,
            color: colors.ctaText,
            boxShadow: isDark ? '0 10px 28px rgba(0,0,0,0.12)' : '0 10px 28px rgba(17,24,39,0.18)',
          }}
        >
          {cta}
        </Link>
      </div>
    </article>
  );
};
