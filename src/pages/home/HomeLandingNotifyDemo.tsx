import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import {
  centerInLandingStage,
  LandingDemoCursor,
  LandingNotifyChannelIcons,
  LandingNotifyChannelLogo,
  type LandingNotifyChannel,
} from './homeLandingDemoCursor';
import {
  homeLandingNotifyBody,
  homeLandingNotifyBookingIcon,
  homeLandingNotifyBookingMeta,
  homeLandingNotifyBookingRow,
  homeLandingNotifyBookingTitle,
  homeLandingNotifyBrand,
  homeLandingNotifyChannel,
  homeLandingNotifyContent,
  homeLandingNotifyDivider,
  homeLandingNotifyHeadline,
  homeLandingNotifyHeader,
  homeLandingNotifyLogo,
  homeLandingNotifyPanel,
  homeLandingNotifyShell,
  homeLandingNotifyStage,
  homeLandingNotifyTime,
} from './homeTheme';

const DEMO_ITEMS = [
  {
    channelKey: 'telegram' as const,
    channel: 'Telegram · напоминание',
    brand: 'Telegram',
    timeLabel: 'сейчас',
    notifyHeadline: 'Напоминание о записи',
    notifyBody: 'Завтра в 16:00 — Маникюр с покрытием',
    bookingTitle: 'Запись подтверждена',
    bookingMeta: 'Маникюр · завтра, 16:00',
    bookingMaster: 'Мастер: Анна Смирнова',
  },
  {
    channelKey: 'google' as const,
    channel: 'Google · напоминание',
    brand: 'Google',
    timeLabel: '1 мин',
    notifyHeadline: 'Скоро ваш визит',
    notifyBody: 'Через 1 час — Мужская стрижка',
    bookingTitle: 'Вы записаны',
    bookingMeta: 'Стрижка · сегодня, 14:30',
    bookingMaster: 'Мастер: Игорь Волков',
  },
  {
    channelKey: 'mail' as const,
    channel: 'Почта · напоминание',
    brand: 'Почта',
    timeLabel: 'сейчас',
    notifyHeadline: 'Не забудьте о визите',
    notifyBody: 'Завтра в 12:00 — Ламинирование ресниц',
    bookingTitle: 'Запись в календаре',
    bookingMeta: 'Ресницы · завтра, 12:00',
    bookingMaster: 'Мастер: Мария Лебедева',
  },
] as const;

export const HomeLandingNotifyDemo: FC = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const demoIndexRef = useRef(0);

  const [activeChannel, setActiveChannel] = useState<LandingNotifyChannel | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [demo, setDemo] = useState(DEMO_ITEMS[0]!);
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

  const tapCursor = useCallback(async (waitMs = 320) => {
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
      setActiveChannel('telegram');
      setShowPanel(true);
      setShowBooking(false);
      setDemo(DEMO_ITEMS[0]!);
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
        const item = DEMO_ITEMS[demoIndexRef.current % DEMO_ITEMS.length]!;
        setDemo(item);
        setActiveChannel(null);
        setShowPanel(false);
        setShowBooking(false);
        setCursorVisible(false);
        setCursorPressing(false);
        await wait(700);
        if (cancelled) break;

        setCursorVisible(true);
        moveCursorToSelector(`[data-landing-channel="${item.channelKey}"]`);
        await wait(750);
        if (cancelled) break;

        await tapCursor();
        setActiveChannel(item.channelKey);
        setShowPanel(true);
        await wait(1200);
        if (cancelled) break;

        moveCursorToSelector('[data-landing-notification]');
        await wait(750);
        if (cancelled) break;

        await tapCursor();
        setShowBooking(true);
        await wait(2400);
        if (cancelled) break;

        setCursorVisible(false);
        setShowPanel(false);
        setShowBooking(false);
        setActiveChannel(null);
        demoIndexRef.current += 1;
        await wait(600);
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [moveCursorToSelector, reducedMotion, tapCursor]);

  return (
    <div className={homeLandingNotifyShell} aria-label="Демо: уведомление и запись">
      <div ref={stageRef} className={homeLandingNotifyStage}>
        <LandingNotifyChannelIcons activeChannel={activeChannel} />

        <div
          data-landing-notification
          className={`${homeLandingNotifyPanel} ${
            showPanel || reducedMotion
              ? 'translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none -translate-y-3 scale-[0.98] opacity-0'
          }`}
        >
          <div className={homeLandingNotifyHeader}>
            <div className={homeLandingNotifyLogo}>
              <LandingNotifyChannelLogo channel={demo.channelKey} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={homeLandingNotifyBrand}>{demo.brand}</p>
              <p className={homeLandingNotifyChannel}>{demo.channel}</p>
            </div>
            <span className={homeLandingNotifyTime}>{demo.timeLabel}</span>
          </div>

          <div className={homeLandingNotifyContent}>
            {!showBooking || reducedMotion ? (
              <div key={`notify-${demo.channelKey}-${showBooking}`} className="animate-fade-enter">
                <p className={homeLandingNotifyHeadline}>{demo.notifyHeadline}</p>
                <p className={homeLandingNotifyBody}>{demo.notifyBody}</p>
              </div>
            ) : (
              <div key={`booking-${demo.channelKey}`} className="animate-fade-enter">
                <div className={homeLandingNotifyDivider} aria-hidden />
                <div className={homeLandingNotifyBookingRow}>
                  <span className={homeLandingNotifyBookingIcon} aria-hidden>
                    ✓
                  </span>
                  <p className={homeLandingNotifyBookingTitle}>{demo.bookingTitle}</p>
                </div>
                <p className={homeLandingNotifyBookingMeta}>{demo.bookingMeta}</p>
                <p className={homeLandingNotifyBookingMeta}>{demo.bookingMaster}</p>
              </div>
            )}
          </div>
        </div>

        {!reducedMotion ? (
          <LandingDemoCursor point={cursorPoint} visible={cursorVisible} pressing={cursorPressing} />
        ) : null}
      </div>
    </div>
  );
};
