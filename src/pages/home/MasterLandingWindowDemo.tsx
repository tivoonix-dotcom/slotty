import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { AdminFormSheetStepper } from '../admin/shared/AdminFormSheetLayout';
import { ADD_WINDOW_FORM_STEPS } from '../admin/schedule/addWindowFormSteps';
import { AddWindowFormSummary } from '../admin/schedule/AddWindowFormSummary';
import { DEFAULT_REPEAT_SETTINGS } from '../admin/schedule/RepeatSettings';
import { formatPreviewSummaryParts } from '../admin/schedule/scheduleUtils';
import { catalogSheetField, catalogSheetLabel } from '../admin/shared/adminCatalogSheetTheme';
import { centerInLandingStage, LandingDemoCursor } from './homeLandingDemoCursor';
import {
  masterDemoFieldActiveSchedule,
  masterDemoFormPanel,
  masterDemoMobileHubClass,
  masterDemoMobileHubUnderSheetClass,
} from './homeLandingMasterDemoTheme';
import { MasterLandingDemoDrawer } from './MasterLandingDemoDrawer';
import { MasterLandingScheduleCreateHub } from './masterLandingScheduleSetupDemoUi';
import {
  MASTER_LANDING_SCHEDULE_DEMO_DEFAULT_SERVICE_ID,
  MasterLandingScheduleDemoServiceSelect,
  masterLandingScheduleDemoServiceLabel,
  type MasterLandingScheduleDemoServiceId,
} from './masterLandingScheduleDemoServiceSelect';
import {
  afterDemoLayout,
  demoFooterPair,
  MasterLandingDemoSheet,
  scrollDemoToSelector,
  scrollDemoToTop,
} from './MasterLandingDemoSheet';
import {
  landingDemoTap,
  useLandingDemoLayout,
  useLandingDemoReducedMotion,
} from './masterLandingDemoShared';

const DEMO_DATE_ISO = '2026-06-12';
const DEMO_START = '10:00';
const DEMO_END = '12:00';
const DEMO_DATE_LINE = formatPreviewSummaryParts(DEMO_DATE_ISO, DEMO_START, DEMO_END).dateLine;

type DemoPhase =
  | 'idle'
  | 'to-today'
  | 'pick-today'
  | 'to-date'
  | 'pick-date'
  | 'to-start'
  | 'pick-start'
  | 'to-end'
  | 'pick-end'
  | 'to-next-0'
  | 'next-0'
  | 'to-service'
  | 'open-service'
  | 'to-service-option'
  | 'pick-service-option'
  | 'to-next-1'
  | 'next-1'
  | 'to-save'
  | 'save'
  | 'reset';

export const MasterLandingWindowDemo: FC = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hubScrollRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useLandingDemoReducedMotion();
  const { mobile } = useLandingDemoLayout();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [todayPressed, setTodayPressed] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>('idle');
  const [dateActive, setDateActive] = useState(false);
  const [startActive, setStartActive] = useState(false);
  const [endActive, setEndActive] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] =
    useState<MasterLandingScheduleDemoServiceId | null>(null);
  const [serviceTriggerActive, setServiceTriggerActive] = useState(false);
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
      setDrawerOpen(true);
      setTodayPressed(true);
      setFormStep(2);
      setDateActive(true);
      setStartActive(true);
      setEndActive(true);
      setServiceDropdownOpen(false);
      setSelectedServiceId(MASTER_LANDING_SCHEDULE_DEMO_DEFAULT_SERVICE_ID);
      setServiceTriggerActive(false);
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
        setDrawerOpen(false);
        setTodayPressed(false);
        setFormStep(0);
        setPhase('idle');
        setDateActive(false);
        setStartActive(false);
        setEndActive(false);
        setServiceDropdownOpen(false);
        setSelectedServiceId(null);
        setServiceTriggerActive(false);
        setCursorVisible(false);
        setCursorPressing(false);
        scrollDemoToTop(hubScrollRef.current);
        scrollDemoToTop(scrollRef.current);
        await wait(700);
        if (cancelled) break;

        setCursorVisible(true);
        setPhase('to-today');
        moveCursorToSelector('[data-master-demo="quick-today"]');
        await wait(850);
        if (cancelled) break;

        setPhase('pick-today');
        await landingDemoTap(setCursorPressing);
        setTodayPressed(true);
        setDrawerOpen(true);
        await wait(550);
        if (cancelled) break;

        setPhase('to-date');
        moveCursorToSelector('[data-master-demo-date]');
        await wait(700);
        if (cancelled) break;

        setPhase('pick-date');
        await landingDemoTap(setCursorPressing);
        setDateActive(true);
        await wait(450);
        if (cancelled) break;

        setPhase('to-start');
        scrollDemoToSelector(scrollRef.current, '[data-master-demo-start]');
        moveCursorToSelector('[data-master-demo-start]');
        await wait(650);
        if (cancelled) break;

        setPhase('pick-start');
        await landingDemoTap(setCursorPressing);
        setStartActive(true);
        await wait(400);
        if (cancelled) break;

        setPhase('to-end');
        moveCursorToSelector('[data-master-demo-end]');
        await wait(650);
        if (cancelled) break;

        setPhase('pick-end');
        await landingDemoTap(setCursorPressing);
        setEndActive(true);
        await wait(450);
        if (cancelled) break;

        setPhase('to-next-0');
        moveCursorToSelector('[data-master-demo-primary="next"]');
        await wait(700);
        if (cancelled) break;

        setPhase('next-0');
        await landingDemoTap(setCursorPressing);
        setFormStep(1);
        scrollDemoToTop(scrollRef.current);
        await wait(700);
        if (cancelled) break;

        setPhase('to-service');
        moveCursorToSelector('[data-master-demo-service]');
        await wait(700);
        if (cancelled) break;

        setPhase('open-service');
        await landingDemoTap(setCursorPressing);
        setServiceTriggerActive(true);
        setServiceDropdownOpen(true);
        scrollDemoToSelector(scrollRef.current, '[data-master-demo="service-dropdown"]');
        await wait(550);
        if (cancelled) break;

        setPhase('to-service-option');
        moveCursorToSelector(`[data-master-demo="service-option-${MASTER_LANDING_SCHEDULE_DEMO_DEFAULT_SERVICE_ID}"]`);
        await wait(700);
        if (cancelled) break;

        setPhase('pick-service-option');
        await landingDemoTap(setCursorPressing);
        setSelectedServiceId(MASTER_LANDING_SCHEDULE_DEMO_DEFAULT_SERVICE_ID);
        setServiceDropdownOpen(false);
        await wait(500);
        if (cancelled) break;

        setPhase('to-next-1');
        moveCursorToSelector('[data-master-demo-primary="next"]');
        await wait(700);
        if (cancelled) break;

        setPhase('next-1');
        await landingDemoTap(setCursorPressing);
        setFormStep(2);
        scrollDemoToTop(scrollRef.current);
        await wait(1100);
        if (cancelled) break;

        setPhase('to-save');
        moveCursorToSelector('[data-master-demo-primary="save"]');
        await wait(750);
        if (cancelled) break;

        setPhase('save');
        await landingDemoTap(setCursorPressing);
        await wait(2000);
        if (cancelled) break;

        setPhase('reset');
        setCursorVisible(false);
        await wait(650);
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [moveCursorToSelector, reducedMotion]);

  const serviceOptionPressing = cursorPressing && phase === 'pick-service-option';
  const serviceTriggerPressing = cursorPressing && phase === 'open-service';
  const primaryPressing =
    cursorPressing && (phase === 'next-0' || phase === 'next-1' || phase === 'save');
  const todayPressing = cursorPressing && phase === 'pick-today';

  const demoServiceLabel = masterLandingScheduleDemoServiceLabel(
    selectedServiceId ?? MASTER_LANDING_SCHEDULE_DEMO_DEFAULT_SERVICE_ID,
  );

  const footer =
    formStep < 2
      ? demoFooterPair({
          leftLabel: formStep === 0 ? 'Отмена' : 'Назад',
          rightLabel: 'Далее',
          rightPressing: primaryPressing,
          rightDataAttr: 'next',
          accent: 'schedule',
          compact: mobile,
        })
      : demoFooterPair({
          leftLabel: 'Назад',
          rightLabel: 'Добавить окно',
          rightPressing: primaryPressing,
          rightDataAttr: 'save',
          accent: 'schedule',
          compact: mobile,
        });

  return (
    <div
      ref={stageRef}
      className="pointer-events-none relative flex h-full min-h-0 select-none touch-none flex-col overflow-hidden bg-[#f6f7fb] [&_*]:!cursor-default"
      aria-label="Демо: создание расписания"
      aria-hidden
    >
      <div
        className={`${masterDemoMobileHubClass} ${
          mobile && drawerOpen ? masterDemoMobileHubUnderSheetClass : ''
        }`}
      >
        <MasterLandingScheduleCreateHub
          todayPressed={todayPressed || todayPressing}
          scrollRef={hubScrollRef}
        />
      </div>

      {drawerOpen ? (
        <MasterLandingDemoDrawer>
          <MasterLandingDemoSheet
              scrollRef={scrollRef}
              title="Новое окно"
              ariaLabel="Демо: форма нового окна"
              stepper={
                <AdminFormSheetStepper
                  step={formStep}
                  steps={ADD_WINDOW_FORM_STEPS}
                  variant="catalog"
                  accent="schedule"
                />
              }
              footer={footer}
            >
              {formStep === 0 ? (
                <div className={masterDemoFormPanel}>
                  <label className="block">
                    <p className={`${catalogSheetLabel} !text-[11px]`}>Дата</p>
                    <div
                      data-master-demo-date
                      className={`${catalogSheetField} mt-1 !py-2 !text-[13px] ${
                        dateActive ? masterDemoFieldActiveSchedule : ''
                      }`}
                    >
                      {dateActive ? DEMO_DATE_LINE : <span className="text-[#8E8E93]">Выберите дату</span>}
                    </div>
                  </label>

                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <label className="block">
                      <p className={`${catalogSheetLabel} !text-[11px]`}>Начало</p>
                      <div
                        data-master-demo-start
                        className={`${catalogSheetField} mt-1 !py-2 !text-[13px] ${
                          startActive ? masterDemoFieldActiveSchedule : ''
                        }`}
                      >
                        {startActive ? DEMO_START : <span className="text-[#8E8E93]">10:00</span>}
                      </div>
                    </label>
                    <label className="block">
                      <p className={`${catalogSheetLabel} !text-[11px]`}>Окончание</p>
                      <div
                        data-master-demo-end
                        className={`${catalogSheetField} mt-1 !py-2 !text-[13px] ${
                          endActive ? masterDemoFieldActiveSchedule : ''
                        }`}
                      >
                        {endActive ? DEMO_END : <span className="text-[#8E8E93]">12:00</span>}
                      </div>
                    </label>
                  </div>

                  {startActive && endActive ? (
                    <p className="mt-2 text-[12px] font-medium text-[#6B7280]">Длительность: 2 ч</p>
                  ) : null}
                </div>
              ) : null}

              {formStep === 1 ? (
                <div className={masterDemoFormPanel}>
                  <MasterLandingScheduleDemoServiceSelect
                    open={serviceDropdownOpen}
                    selectedId={selectedServiceId}
                    triggerActive={serviceTriggerActive || serviceTriggerPressing}
                    highlightedOptionId={
                      phase === 'to-service-option' || phase === 'pick-service-option'
                        ? MASTER_LANDING_SCHEDULE_DEMO_DEFAULT_SERVICE_ID
                        : null
                    }
                    optionPressing={serviceOptionPressing}
                  />
                </div>
              ) : null}

              {formStep === 2 ? (
                <div className={`origin-top ${mobile ? 'scale-[0.92]' : 'scale-[0.96]'}`}>
                  <AddWindowFormSummary
                    dateIso={DEMO_DATE_ISO}
                    startTime={DEMO_START}
                    endTime={DEMO_END}
                    serviceLabel={demoServiceLabel}
                    selectedTemplate={null}
                    manualMode
                    repeatSettings={DEFAULT_REPEAT_SETTINGS}
                    creatableCount={1}
                    totalPlanned={1}
                  />
                </div>
              ) : null}
            </MasterLandingDemoSheet>
        </MasterLandingDemoDrawer>
      ) : null}

      {!reducedMotion ? (
        <LandingDemoCursor point={cursorPoint} visible={cursorVisible} pressing={cursorPressing} />
      ) : null}
    </div>
  );
};
