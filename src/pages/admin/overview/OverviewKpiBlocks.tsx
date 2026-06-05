import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  overviewDesktopKpiCarouselCard,
  overviewDesktopKpiTile,
  overviewIconCircle,
} from './adminOverviewTheme';

export function OverviewTrendBadge({
  value,
  tone = 'positive',
}: {
  value: string;
  tone?: 'positive' | 'warning' | 'neutral';
}) {
  const toneClass =
    tone === 'warning'
      ? 'bg-[#FFF7ED] text-[#F59E0B]'
      : tone === 'neutral'
        ? 'bg-[#F3F4F6] text-[#6B7280]'
        : 'bg-[#ECFDF3] text-[#16A34A]';

  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${toneClass}`}>
      {value}
    </span>
  );
}

type KpiCardProps = {
  label: string;
  value: string;
  hint?: ReactNode;
  icon: ReactNode;
  trailing?: ReactNode;
  /** `carousel` — белая карточка в ленте сводки; `tile` — серая плитка (доход и т.д.). */
  surface?: 'tile' | 'carousel';
  /** Подсветка «требует внимания» (например, отзывы без ответа). */
  alert?: boolean;
  /** Переопределение стиля иконки (например, синий акцент расписания). */
  iconClassName?: string;
};

export function OverviewKpiStatCard({
  label,
  value,
  hint,
  icon,
  trailing,
  surface = 'tile',
  alert = false,
  iconClassName,
}: KpiCardProps) {
  const surfaceClass = surface === 'carousel' ? overviewDesktopKpiCarouselCard : overviewDesktopKpiTile;
  const alertClass = alert
    ? 'shadow-[0_0_0_2px_rgba(255,95,122,0.18),0_0_20px_rgba(255,95,122,0.22)] ring-1 ring-[#FDE8ED]'
    : '';

  return (
    <article
      className={`${surfaceClass} ${alertClass} flex min-h-[8.25rem] flex-col justify-between`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 pt-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
          {label}
        </p>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {trailing}
          <span className={`${iconClassName ?? overviewIconCircle} h-11 w-11 rounded-[18px]`}>{icon}</span>
        </div>
      </div>

      <div className="min-w-0">
        <p
          className={`truncate text-[clamp(1.5rem,2.4vw,1.75rem)] font-black tabular-nums leading-none tracking-[-0.06em] ${
            alert ? 'text-[#ff5f7a]' : 'text-[#111827]'
          }`}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-snug text-[#6B7280]">
            {hint}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function OverviewKpiGrid({
  children,
  columns = 4,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}) {
  const colClass =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-4';

  return <section className={`grid grid-cols-1 gap-3 ${colClass}`}>{children}</section>;
}

const KPI_CAROUSEL_AUTOPLAY_MS = 4500;

/** Одна KPI-карточка на экран + точки-индикатор (сводка). */
export function OverviewKpiCarousel({
  children,
  autoPlay = true,
  autoPlayIntervalMs = KPI_CAROUSEL_AUTOPLAY_MS,
  indicatorBgClass = 'bg-[#ff5f7a]',
}: {
  children: ReactNode;
  /** Автолистание слайдов (пауза при наведении и если включён reduced motion). */
  autoPlay?: boolean;
  autoPlayIntervalMs?: number;
  /** Цвет точек карусели (Tailwind bg-*). */
  indicatorBgClass?: string;
}) {
  const slides = Children.toArray(children);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const pauseAutoPlayRef = useRef(false);

  const syncActiveFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || slides.length === 0) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const index = Math.min(slides.length - 1, Math.max(0, Math.round(el.scrollLeft / w)));
    activeRef.current = index;
    setActive(index);
  }, [slides.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    syncActiveFromScroll();
    el.addEventListener('scroll', syncActiveFromScroll, { passive: true });
    const ro = new ResizeObserver(syncActiveFromScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', syncActiveFromScroll);
      ro.disconnect();
    };
  }, [syncActiveFromScroll]);

  const goTo = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const safe = Math.min(slides.length - 1, Math.max(0, index));
    const w = el.clientWidth;
    el.scrollTo({ left: safe * w, behavior: 'smooth' });
    activeRef.current = safe;
    setActive(safe);
  }, [slides.length]);

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return undefined;

    const tick = () => {
      if (pauseAutoPlayRef.current || document.visibilityState === 'hidden') return;
      const next = activeRef.current >= slides.length - 1 ? 0 : activeRef.current + 1;
      goTo(next);
    };

    const id = window.setInterval(tick, autoPlayIntervalMs);
    return () => window.clearInterval(id);
  }, [autoPlay, autoPlayIntervalMs, goTo, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className="min-w-0 overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Показатели сводки"
      onPointerEnter={() => {
        pauseAutoPlayRef.current = true;
      }}
      onPointerLeave={() => {
        pauseAutoPlayRef.current = false;
      }}
      onFocusCapture={() => {
        pauseAutoPlayRef.current = true;
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          pauseAutoPlayRef.current = false;
        }
      }}
    >
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="w-full shrink-0 snap-center snap-always"
            aria-roledescription="slide"
            aria-hidden={active !== index}
          >
            {slide}
          </div>
        ))}
      </div>

      <div
        className="mt-4 flex shrink-0 items-center justify-center gap-2.5 py-1"
        role="tablist"
        aria-label="Показатель"
      >
        {slides.map((_, index) => {
          const selected = active === index;
          return (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={`Показатель ${index + 1} из ${slides.length}`}
              onClick={() => {
                pauseAutoPlayRef.current = true;
                goTo(index);
                window.setTimeout(() => {
                  pauseAutoPlayRef.current = false;
                }, autoPlayIntervalMs);
              }}
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${indicatorBgClass} transition hover:opacity-90 ${
                selected ? 'opacity-100' : 'opacity-45'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
