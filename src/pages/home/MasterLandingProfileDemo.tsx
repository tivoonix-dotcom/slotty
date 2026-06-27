import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { BY } from 'country-flag-icons/react/1x1';
import { sheetFieldClass, sheetLabelClass } from '../admin/profile/adminProfileCabinetTheme';
import { centerInLandingStage, LandingDemoCursor } from './homeLandingDemoCursor';
import { masterDemoFieldActive, masterDemoFormPanel, masterDemoMobileHubClass, masterDemoMobileHubUnderSheetClass } from './homeLandingMasterDemoTheme';
import { MasterLandingDemoDrawer } from './MasterLandingDemoDrawer';
import {
  MASTER_LANDING_DEMO_MASTER_NAME,
} from './masterLandingDemoPersona';
import { MasterLandingProfileHub } from './masterLandingProfileDemoUi';
import {
  afterDemoLayout,
  demoFooterPair,
  MasterLandingDemoSheet,
  scrollDemoToSelector,
  scrollDemoToTop,
} from './MasterLandingDemoSheet';
import {
  landingDemoTap,
  landingDemoType,
  useLandingDemoLayout,
  useLandingDemoReducedMotion,
} from './masterLandingDemoShared';

const DEMO_NAME = MASTER_LANDING_DEMO_MASTER_NAME;
const DEMO_ABOUT =
  'Мастер маникюра в Минске. Аккуратная работа, стерильность и уютная атмосфера.';

type DemoPhase =
  | 'idle'
  | 'to-edit'
  | 'pick-edit'
  | 'to-name'
  | 'fill-name'
  | 'to-about'
  | 'fill-about'
  | 'to-save'
  | 'save'
  | 'reset';

export const MasterLandingProfileDemo: FC = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useLandingDemoReducedMotion();
  const { mobile } = useLandingDemoLayout();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editPressed, setEditPressed] = useState(false);
  const [savedName, setSavedName] = useState('');
  const [savedAbout, setSavedAbout] = useState('');
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [activeField, setActiveField] = useState<'name' | 'about' | null>(null);
  const [phase, setPhase] = useState<DemoPhase>('idle');
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
      setSavedName(DEMO_NAME);
      setSavedAbout(DEMO_ABOUT);
      setName(DEMO_NAME);
      setAbout(DEMO_ABOUT);
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
        setEditPressed(false);
        setSavedName('');
        setSavedAbout('');
        setName('');
        setAbout('');
        setActiveField(null);
        setPhase('idle');
        setCursorVisible(false);
        setCursorPressing(false);
        scrollDemoToTop(scrollRef.current);
        await wait(700);
        if (cancelled) break;

        setCursorVisible(true);
        setPhase('to-edit');
        moveCursorToSelector('[data-master-demo="edit-profile"]');
        await wait(850);
        if (cancelled) break;

        setPhase('pick-edit');
        await landingDemoTap(setCursorPressing);
        setEditPressed(true);
        setDrawerOpen(true);
        await wait(550);
        if (cancelled) break;

        setPhase('to-name');
        moveCursorToSelector('[data-master-demo-name]');
        await wait(650);
        if (cancelled) break;

        setPhase('fill-name');
        await landingDemoTap(setCursorPressing);
        setActiveField('name');
        await landingDemoType(setName, DEMO_NAME, 45);
        await wait(350);
        if (cancelled) break;

        setPhase('to-about');
        scrollDemoToSelector(scrollRef.current, '[data-master-demo-about]');
        moveCursorToSelector('[data-master-demo-about]');
        await wait(650);
        if (cancelled) break;

        setPhase('fill-about');
        await landingDemoTap(setCursorPressing);
        setActiveField('about');
        await landingDemoType(setAbout, DEMO_ABOUT, 28);
        await wait(400);
        if (cancelled) break;

        setPhase('to-save');
        moveCursorToSelector('[data-master-demo-primary="save"]');
        await wait(750);
        if (cancelled) break;

        setPhase('save');
        await landingDemoTap(setCursorPressing);
        setSavedName(DEMO_NAME);
        setSavedAbout(DEMO_ABOUT);
        setDrawerOpen(false);
        setActiveField(null);
        await wait(2200);
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

  const savePressing = cursorPressing && phase === 'save';
  const editPressing = cursorPressing && phase === 'pick-edit';

  return (
    <div
      ref={stageRef}
      className="pointer-events-none relative flex h-full min-h-0 select-none touch-none flex-col overflow-hidden [&_*]:!cursor-default"
      aria-label="Демо: редактирование профиля мастера"
      aria-hidden
    >
      <div
        className={`${masterDemoMobileHubClass} ${
          mobile && drawerOpen ? masterDemoMobileHubUnderSheetClass : ''
        }`}
      >
        <MasterLandingProfileHub
          name={savedName}
          about={savedAbout}
          editPressed={editPressed || editPressing}
        />
      </div>

      {drawerOpen ? (
        <MasterLandingDemoDrawer>
          <MasterLandingDemoSheet
              scrollRef={scrollRef}
              title="Редактировать профиль"
              ariaLabel="Демо: форма редактирования профиля"
              footer={demoFooterPair({
                leftLabel: 'Отмена',
                rightLabel: 'Сохранить',
                rightPressing: savePressing,
                rightDataAttr: 'save',
                compact: mobile,
              })}
            >
              <div className={masterDemoFormPanel}>
                <label className="block">
                  <span className={`${sheetLabelClass} !text-[11px]`}>Имя</span>
                  <div
                    data-master-demo-name
                    className={`${sheetFieldClass} mt-1 !py-2 !text-[13px] ${
                      activeField === 'name' ? masterDemoFieldActive : ''
                    }`}
                  >
                    {name || <span className="text-[#8E8E93]">Как вас зовут</span>}
                  </div>
                </label>

                <label className="mt-3 block">
                  <span className={`flex items-center gap-2 ${sheetLabelClass} !text-[11px]`}>
                    Телефон
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EBEBEB]">
                      <BY title="Беларусь" className="h-full w-full object-cover" />
                    </span>
                  </span>
                  <div className={`${sheetFieldClass} mt-1 !py-2 !text-[13px] text-[#111827]`}>
                    +375 29 123-45-67
                  </div>
                </label>

                <label className="mt-3 block">
                  <span className={`${sheetLabelClass} !text-[11px]`}>О себе</span>
                  <div
                    data-master-demo-about
                    className={`${sheetFieldClass} mt-1 min-h-[5.5rem] whitespace-pre-wrap !py-2 !text-[12px] leading-relaxed ${
                      activeField === 'about' ? masterDemoFieldActive : ''
                    }`}
                  >
                    {about || <span className="text-[#8E8E93]">Расскажите о себе клиентам</span>}
                  </div>
                </label>
              </div>
            </MasterLandingDemoSheet>
        </MasterLandingDemoDrawer>
      ) : null}

      {!reducedMotion ? (
        <LandingDemoCursor point={cursorPoint} visible={cursorVisible} pressing={cursorPressing} />
      ) : null}
    </div>
  );
};
