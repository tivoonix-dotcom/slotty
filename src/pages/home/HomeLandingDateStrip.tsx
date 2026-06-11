import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { buildDateStripItems } from '../client/servicesCatalog/catalogFilterDateTime';
import { centerInLandingStage, LandingDemoCursor } from './homeLandingDemoCursor';
import {
  homeLandingDateCard,
  homeLandingDateCardActive,
  homeLandingDateCardIdle,
  homeLandingDateDemoBookBtn,
  homeLandingDateDemoBookBtnPress,
  homeLandingDateDemoPopup,
  homeLandingDateScroll,
  homeLandingDateStripShell,
  homeLandingDateStripStage,
  homeLandingDateStripTrack,
  homeLandingDateTimePill,
  homeLandingDateTimePillActive,
  homeLandingDateTimePillIdle,
  homeLandingDateTimeRow,
} from './homeTheme';

const LANDING_DATE_STRIP_DAYS = 21;
const DEMO_TARGET_OFFSET = 3;
const DEMO_TARGET_TIME = '16:00';

const DEMO_TIME_SLOTS = ['14:00', '15:30', '16:00', '18:00'] as const;

const LANDING_DEMO_SERVICES = [
  { title: 'Маникюр с покрытием', price: 'от 45 BYN' },
  { title: 'Мужская стрижка', price: 'от 35 BYN' },
  { title: 'Ламинирование ресниц', price: 'от 50 BYN' },
  { title: 'Классический массаж', price: 'от 40 BYN' },
  { title: 'Оформление бровей', price: 'от 30 BYN' },
] as const;

type DemoPhase =
  | 'scroll'
  | 'to-date'
  | 'pick-date'
  | 'to-time'
  | 'pick-time'
  | 'show-service'
  | 'to-button'
  | 'click'
  | 'reset';

export const HomeLandingDateStrip: FC = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const serviceIndexRef = useRef(0);
  const items = useMemo(() => buildDateStripItems(LANDING_DATE_STRIP_DAYS), []);

  const [phase, setPhase] = useState<DemoPhase>('scroll');
  const [highlightOffset, setHighlightOffset] = useState<number | null>(null);
  const [highlightTime, setHighlightTime] = useState<string | null>(null);
  const [showTimeRow, setShowTimeRow] = useState(false);
  const [service, setService] = useState<(typeof LANDING_DEMO_SERVICES)[number] | null>(null);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPressing, setCursorPressing] = useState(false);
  const [cursorPoint, setCursorPoint] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  const moveCursorToSelector = useCallback((selector: string) => {
    const stage = stageRef.current;
    const el = stage?.querySelector<HTMLElement>(selector);
    if (!stage || !el) return;
    setCursorPoint(centerInLandingStage(el, stage));
  }, []);

  const scrollToOffset = useCallback((offset: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(`[data-landing-date-offset="${offset}"]`);
    if (!card) return;

    const targetLeft = card.offsetLeft - (el.clientWidth - card.clientWidth) / 2;
    const maxLeft = el.scrollWidth - el.clientWidth;
    el.scrollTo({
      left: Math.max(0, Math.min(targetLeft, maxLeft)),
      behavior: 'smooth',
    });
  }, []);

  const tapCursor = useCallback(async (waitMs = 350) => {
    setCursorPressing(true);
    await new Promise((r) => setTimeout(r, waitMs));
    setCursorPressing(false);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setHighlightOffset(DEMO_TARGET_OFFSET);
      setHighlightTime(DEMO_TARGET_TIME);
      setShowTimeRow(true);
      setService(LANDING_DEMO_SERVICES[0]!);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(
          setTimeout(() => {
            if (!cancelled) resolve();
          }, ms),
        );
      });

    const run = async () => {
      while (!cancelled) {
        const pickedService = LANDING_DEMO_SERVICES[serviceIndexRef.current % LANDING_DEMO_SERVICES.length]!;

        setPhase('scroll');
        setCursorVisible(false);
        setCursorPressing(false);
        setHighlightOffset(null);
        setHighlightTime(null);
        setShowTimeRow(false);
        setService(null);
        await wait(2600);
        if (cancelled) break;

        setPhase('to-date');
        scrollToOffset(DEMO_TARGET_OFFSET);
        await wait(550);
        if (cancelled) break;

        setCursorVisible(true);
        moveCursorToSelector(`[data-landing-date-offset="${DEMO_TARGET_OFFSET}"]`);
        await wait(750);
        if (cancelled) break;

        setPhase('pick-date');
        await tapCursor(420);
        setHighlightOffset(DEMO_TARGET_OFFSET);
        await wait(180);
        setShowTimeRow(true);
        await wait(850);
        if (cancelled) break;

        setPhase('to-time');
        moveCursorToSelector(`[data-landing-time="${DEMO_TARGET_TIME}"]`);
        await wait(900);
        if (cancelled) break;

        setPhase('pick-time');
        await tapCursor(420);
        setHighlightTime(DEMO_TARGET_TIME);
        await wait(750);
        if (cancelled) break;

        setPhase('show-service');
        setService(pickedService);
        await wait(1000);
        if (cancelled) break;

        setPhase('to-button');
        moveCursorToSelector('[data-landing-book-btn]');
        await wait(850);
        if (cancelled) break;

        setPhase('click');
        await tapCursor();
        await wait(500);
        if (cancelled) break;

        setPhase('reset');
        setCursorVisible(false);
        setHighlightOffset(null);
        setHighlightTime(null);
        setShowTimeRow(false);
        setService(null);
        serviceIndexRef.current += 1;
        await wait(800);
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [moveCursorToSelector, reducedMotion, scrollToOffset, tapCursor]);

  useEffect(() => {
    if (reducedMotion) return;
    if (phase !== 'scroll' && phase !== 'reset') return;

    let raf = 0;
    const tick = () => {
      const el = scrollRef.current;
      if (el) {
        el.scrollLeft -= 0.55;
        if (el.scrollLeft <= 0) {
          const max = el.scrollWidth - el.clientWidth;
          if (max > 0) el.scrollLeft = max;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reducedMotion]);

  return (
    <div className={homeLandingDateStripShell} aria-label="Демо: выбор даты, времени и записи">
      <div ref={stageRef} className={homeLandingDateStripStage}>
        <div className={homeLandingDateStripTrack}>
          <div ref={scrollRef} className={homeLandingDateScroll}>
            {items.map((item) => {
              const active = highlightOffset === item.offset;
              const bottomLabel = item.isToday ? 'сегодня' : item.isTomorrow ? 'завтра' : item.monthShort;
              const pressingThisDate = active && cursorPressing && phase === 'pick-date';

              return (
                <div
                  key={item.iso}
                  data-landing-date-offset={item.offset}
                  aria-hidden
                  className={`${homeLandingDateCard} ${active ? homeLandingDateCardActive : homeLandingDateCardIdle} ${
                    pressingThisDate ? '!scale-[0.97]' : ''
                  }`}
                >
                  <span
                    className={`font-landing text-[11px] font-semibold uppercase tracking-wide ${
                      active ? 'text-white/95' : 'text-[#6B7280]'
                    }`}
                  >
                    {item.weekdayShort.toUpperCase()}
                  </span>
                  <span
                    className={`font-hero-display text-[22px] font-medium leading-none ${
                      active ? 'text-white' : 'text-[#111827]'
                    }`}
                  >
                    {item.dayNum}
                  </span>
                  <span
                    className={`font-landing text-[11px] font-medium ${
                      active ? 'text-white/90' : 'text-[#9CA3AF]'
                    }`}
                  >
                    {bottomLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={`${homeLandingDateTimeRow} transition-all duration-300 ${
            showTimeRow ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
          }`}
        >
          {DEMO_TIME_SLOTS.map((time, index) => {
            const active = highlightTime === time;
            const pressingThisTime = active && cursorPressing && phase === 'pick-time';
            return (
              <div
                key={time}
                data-landing-time={time}
                aria-hidden
                className={`font-landing ${homeLandingDateTimePill} ${
                  active ? homeLandingDateTimePillActive : homeLandingDateTimePillIdle
                } ${pressingThisTime ? '!scale-[0.96]' : ''} ${
                  showTimeRow ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
                }`}
                style={{
                  transitionDelay: showTimeRow ? `${120 + index * 70}ms` : '0ms',
                }}
              >
                {time}
              </div>
            );
          })}
        </div>

        <div
          className={`${homeLandingDateDemoPopup} mt-3 transition-all duration-300 ease-out ${
            service ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-3 scale-[0.98] opacity-0'
          }`}
        >
          {service ? (
            <>
              <p className="font-hero-display text-[14px] font-medium text-[#111827]">{service.title}</p>
              <p className="font-landing mt-0.5 text-[12px] font-medium text-[#6B7280]">
                {highlightTime ?? DEMO_TARGET_TIME} · {service.price}
              </p>
              <button
                type="button"
                data-landing-book-btn
                tabIndex={-1}
                aria-hidden
                className={
                  cursorPressing && phase === 'click'
                    ? homeLandingDateDemoBookBtnPress
                    : homeLandingDateDemoBookBtn
                }
              >
                Записаться
              </button>
            </>
          ) : (
            <span className="block h-[4.5rem]" aria-hidden />
          )}
        </div>

        {!reducedMotion ? (
          <LandingDemoCursor point={cursorPoint} visible={cursorVisible} pressing={cursorPressing} />
        ) : null}
      </div>
    </div>
  );
};
