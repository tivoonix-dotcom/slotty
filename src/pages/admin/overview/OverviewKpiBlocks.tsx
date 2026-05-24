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
};

export function OverviewKpiStatCard({
  label,
  value,
  hint,
  icon,
  trailing,
  surface = 'tile',
}: KpiCardProps) {
  const surfaceClass = surface === 'carousel' ? overviewDesktopKpiCarouselCard : overviewDesktopKpiTile;

  return (
    <article
      className={`${surfaceClass} flex min-h-[8.25rem] flex-col justify-between`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 pt-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
          {label}
        </p>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {trailing}
          <span className={`${overviewIconCircle} h-11 w-11 rounded-[18px]`}>{icon}</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="truncate text-[clamp(1.5rem,2.4vw,1.75rem)] font-black tabular-nums leading-none tracking-[-0.06em] text-[#111827]">
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

/** Одна KPI-карточка на экран + точки-индикатор (сводка). */
export function OverviewKpiCarousel({ children }: { children: ReactNode }) {
  const slides = Children.toArray(children);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const syncActiveFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || slides.length === 0) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const index = Math.min(slides.length - 1, Math.max(0, Math.round(el.scrollLeft / w)));
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

  const goTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: index * w, behavior: 'smooth' });
    setActive(index);
  };

  if (slides.length === 0) return null;

  return (
    <section className="min-w-0" aria-roledescription="carousel" aria-label="Показатели сводки">
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
              onClick={() => goTo(index)}
              className={`h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff5f7a] transition hover:opacity-90 ${
                selected ? 'opacity-100 ring-2 ring-[#ff5f7a]/25 ring-offset-2 ring-offset-white' : 'opacity-45'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
