import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { centerInLandingStage, LandingDemoCursor } from './homeLandingDemoCursor';
import {
  MasterLandingAppointmentDetail,
  MasterLandingAppointmentsHub,
} from './masterLandingAppointmentsDemoUi';
import { MasterLandingDemoDrawer } from './MasterLandingDemoDrawer';
import { afterDemoLayout, MasterLandingDemoSheet, scrollDemoToTop } from './MasterLandingDemoSheet';
import { masterDemoMobileHubClass, masterDemoMobileHubUnderSheetClass } from './homeLandingMasterDemoTheme';
import {
  landingDemoTap,
  useLandingDemoLayout,
  useLandingDemoReducedMotion,
} from './masterLandingDemoShared';

type DemoTab = 'requests' | 'upcoming';

type DemoPhase =
  | 'idle'
  | 'wait-request'
  | 'to-confirm'
  | 'confirm'
  | 'switch-upcoming'
  | 'to-details'
  | 'open-details'
  | 'hold-details'
  | 'reset';

export const MasterLandingAppointmentsDemo: FC = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useLandingDemoReducedMotion();
  const { mobile } = useLandingDemoLayout();

  const [phase, setPhase] = useState<DemoPhase>('idle');
  const [activeTab, setActiveTab] = useState<DemoTab>('requests');
  const [showRequest, setShowRequest] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [requestPressed, setRequestPressed] = useState(false);
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
      setActiveTab('upcoming');
      setShowRequest(false);
      setShowUpcoming(true);
      setDetailOpen(true);
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
        setActiveTab('requests');
        setShowRequest(false);
        setShowUpcoming(false);
        setDetailOpen(false);
        setRequestPressed(false);
        setCursorVisible(false);
        setCursorPressing(false);
        scrollDemoToTop(scrollRef.current);
        await wait(900);
        if (cancelled) break;

        setPhase('wait-request');
        setShowRequest(true);
        await wait(850);
        if (cancelled) break;

        setCursorVisible(true);
        setPhase('to-confirm');
        moveCursorToSelector('[data-master-demo-confirm-request]');
        await wait(750);
        if (cancelled) break;

        setPhase('confirm');
        await landingDemoTap(setCursorPressing);
        setRequestPressed(true);
        await wait(550);
        if (cancelled) break;

        setPhase('switch-upcoming');
        setShowRequest(false);
        setRequestPressed(false);
        setActiveTab('upcoming');
        await wait(350);
        setShowUpcoming(true);
        await wait(900);
        if (cancelled) break;

        setPhase('to-details');
        moveCursorToSelector('[data-master-demo-appointment-details]');
        await wait(750);
        if (cancelled) break;

        setPhase('open-details');
        await landingDemoTap(setCursorPressing);
        setDetailOpen(true);
        scrollDemoToTop(scrollRef.current);
        await wait(2400);
        if (cancelled) break;

        setPhase('hold-details');
        setDetailOpen(false);
        setCursorVisible(false);
        await wait(900);
        if (cancelled) break;

        setPhase('reset');
        setShowUpcoming(false);
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
  const detailsPressing = cursorPressing && phase === 'open-details';

  return (
    <div
      ref={stageRef}
      className="pointer-events-none relative flex h-full min-h-0 select-none touch-none flex-col overflow-hidden rounded-[inherit] [&_*]:!cursor-default"
      aria-label="Демо: записи мастера"
      aria-hidden
    >
      <div
        className={`${masterDemoMobileHubClass} ${
          mobile && detailOpen ? masterDemoMobileHubUnderSheetClass : ''
        }`}
      >
        <MasterLandingAppointmentsHub
          activeTab={activeTab}
          showRequest={showRequest}
          showUpcoming={showUpcoming}
          requestPressed={requestPressed || confirmPressing}
          confirmPressed={confirmPressing}
          detailsPressed={detailsPressing}
          scrollRef={scrollRef}
        />
      </div>

      {detailOpen ? (
        <MasterLandingDemoDrawer>
          <MasterLandingDemoSheet
              title="Предстоящая запись"
              ariaLabel="Демо: детали записи"
              footer={<div className="hidden" aria-hidden />}
            >
              <MasterLandingAppointmentDetail />
            </MasterLandingDemoSheet>
        </MasterLandingDemoDrawer>
      ) : null}

      {!reducedMotion ? (
        <LandingDemoCursor point={cursorPoint} visible={cursorVisible} pressing={cursorPressing} />
      ) : null}
    </div>
  );
};
