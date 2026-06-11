import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { centerInLandingStage, LandingDemoCursor } from './homeLandingDemoCursor';
import {
  MasterLandingDemoNotificationToast,
  MasterLandingNotificationDetail,
  MasterLandingNotificationsHub,
} from './masterLandingNotificationsDemoUi';
import { masterLandingDemoDrawerClass } from './MasterLandingDemoCabinetLogo';
import { masterLandingDemoDrawerOverlayClass } from './masterLandingDemoOverlayTheme';
import { afterDemoLayout, MasterLandingDemoSheet, scrollDemoToTop } from './MasterLandingDemoSheet';
import {
  landingDemoTap,
  useLandingDemoReducedMotion,
} from './masterLandingDemoShared';

type DemoPhase =
  | 'idle'
  | 'toast'
  | 'wait-notif'
  | 'to-notif'
  | 'open-notif'
  | 'to-confirm'
  | 'confirm'
  | 'wait-confirmed'
  | 'reset';

export const MasterLandingBookingNotifyDemo: FC = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useLandingDemoReducedMotion();

  const [phase, setPhase] = useState<DemoPhase>('idle');
  const [showToast, setShowToast] = useState(false);
  const [showIncoming, setShowIncoming] = useState(false);
  const [showConfirmed, setShowConfirmed] = useState(false);
  const [selectedIncoming, setSelectedIncoming] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPressing, setCursorPressing] = useState(false);
  const [cursorPoint, setCursorPoint] = useState({ x: 0, y: 0 });

  const moveCursorToSelector = useCallback((selector: string) => {
    afterDemoLayout(() => {
      const stage = stageRef.current;
      const el = stage?.querySelector<HTMLElement>(selector);
      if (!stage || !el) return;
      setCursorPoint(centerInLandingStage(el, stage));
    });
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setShowToast(false);
      setShowIncoming(true);
      setDetailOpen(true);
      setConfirmed(true);
      setShowConfirmed(true);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(() => !cancelled && resolve(), ms));
      });

    const run = async () => {
      while (!cancelled) {
        setPhase('idle');
        setShowToast(false);
        setShowIncoming(false);
        setShowConfirmed(false);
        setSelectedIncoming(false);
        setDetailOpen(false);
        setConfirmed(false);
        setCursorVisible(false);
        setCursorPressing(false);
        scrollDemoToTop(scrollRef.current);
        await wait(900);
        if (cancelled) break;

        setPhase('toast');
        setShowToast(true);
        await wait(1100);
        if (cancelled) break;

        setPhase('wait-notif');
        setShowToast(false);
        setShowIncoming(true);
        await wait(700);
        if (cancelled) break;

        setCursorVisible(true);
        setPhase('to-notif');
        moveCursorToSelector('[data-master-demo="notif-incoming"]');
        await wait(750);
        if (cancelled) break;

        setPhase('open-notif');
        await landingDemoTap(setCursorPressing);
        setSelectedIncoming(true);
        setDetailOpen(true);
        scrollDemoToTop(scrollRef.current);
        await wait(900);
        if (cancelled) break;

        setPhase('to-confirm');
        moveCursorToSelector('[data-master-demo-confirm]');
        await wait(750);
        if (cancelled) break;

        setPhase('confirm');
        await landingDemoTap(setCursorPressing);
        setConfirmed(true);
        await wait(700);
        if (cancelled) break;

        setPhase('wait-confirmed');
        setDetailOpen(false);
        setSelectedIncoming(false);
        await wait(450);
        setShowConfirmed(true);
        await wait(2200);
        if (cancelled) break;

        setPhase('reset');
        setCursorVisible(false);
        setShowIncoming(false);
        setShowConfirmed(false);
        await wait(650);
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [moveCursorToSelector, reducedMotion]);

  const confirmPressing = cursorPressing && phase === 'confirm';
  const notifPressing = cursorPressing && phase === 'open-notif';

  return (
    <div
      ref={stageRef}
      className="pointer-events-none relative flex h-full min-h-0 select-none touch-none flex-col overflow-hidden rounded-[inherit] [&_*]:!cursor-default"
      aria-label="Демо: уведомления о записи"
      aria-hidden
    >
      <MasterLandingDemoNotificationToast visible={showToast} />

      <MasterLandingNotificationsHub
        showIncoming={showIncoming}
        showConfirmed={showConfirmed}
        selectedIncoming={selectedIncoming || notifPressing}
        scrollRef={scrollRef}
      />

      {detailOpen ? (
        <>
          <div className={masterLandingDemoDrawerOverlayClass} aria-hidden />
          <div className={masterLandingDemoDrawerClass}>
            <MasterLandingDemoSheet
              title="Новая заявка"
              ariaLabel="Демо: детали уведомления"
              footer={<div className="hidden" aria-hidden />}
            >
              <MasterLandingNotificationDetail
                confirmed={confirmed}
                confirmPressed={confirmPressing}
              />
            </MasterLandingDemoSheet>
          </div>
        </>
      ) : null}

      {!reducedMotion ? (
        <LandingDemoCursor point={cursorPoint} visible={cursorVisible} pressing={cursorPressing} />
      ) : null}
    </div>
  );
};
