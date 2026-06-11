import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { AdminFormSheetStepper } from '../admin/shared/AdminFormSheetLayout';
import { SERVICE_FORM_STEPS } from '../admin/services/serviceFormSteps';
import { servicesFormSegmentTrack } from '../admin/services/adminServicesTheme';
import { ServicesFormSummary } from '../admin/services/ServicesFormSummary';
import { catalogSheetField, catalogSheetLabel } from '../admin/shared/adminCatalogSheetTheme';
import { centerInLandingStage, LandingDemoCursor } from './homeLandingDemoCursor';
import {
  masterDemoChipCabinet,
  masterDemoChipCabinetActive,
  masterDemoChipCabinetIdle,
  masterDemoFieldActive,
  masterDemoFormPanel,
  masterDemoSegmentClass,
  masterDemoSegmentTrack,
} from './homeLandingMasterDemoTheme';
import {
  MASTER_LANDING_SERVICE_DEMO_CATEGORIES,
  type MasterLandingServiceDemoCategory,
} from './masterLandingServiceDemoData';
import {
  demoFooterPair,
  MasterLandingDemoSheet,
  scrollDemoToSelector,
  scrollDemoToTop,
  afterDemoLayout,
} from './MasterLandingDemoSheet';
import {
  landingDemoTap,
  landingDemoType,
  useLandingDemoReducedMotion,
} from './masterLandingDemoShared';

type DemoPhase =
  | 'idle'
  | 'to-chip'
  | 'pick-chip'
  | 'to-title'
  | 'fill-title'
  | 'to-price'
  | 'fill-price'
  | 'to-next-0'
  | 'next-0'
  | 'to-cover'
  | 'to-segment'
  | 'pick-segment'
  | 'to-next-1'
  | 'next-1'
  | 'to-save'
  | 'save'
  | 'reset';

const DEFAULT_CATEGORY = MASTER_LANDING_SERVICE_DEMO_CATEGORIES[0];

export const MasterLandingServiceDemo: FC = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useLandingDemoReducedMotion();

  const [formStep, setFormStep] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>('idle');
  const [scenario, setScenario] = useState<MasterLandingServiceDemoCategory | null>(null);
  const [activeChipId, setActiveChipId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [coverReady, setCoverReady] = useState(false);
  const [priceTypeFixed, setPriceTypeFixed] = useState(true);
  const [activeField, setActiveField] = useState<'title' | 'price' | null>(null);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPressing, setCursorPressing] = useState(false);
  const [cursorPoint, setCursorPoint] = useState({ x: 0, y: 0 });

  const display = scenario ?? DEFAULT_CATEGORY;

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
      setFormStep(2);
      setScenario(DEFAULT_CATEGORY);
      setActiveChipId(DEFAULT_CATEGORY.id);
      setTitle(DEFAULT_CATEGORY.title);
      setPrice(DEFAULT_CATEGORY.price);
      setCoverReady(true);
      setPriceTypeFixed(true);
      return;
    }

    let cancelled = false;
    let categoryIndex = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(() => !cancelled && resolve(), ms));
      });

    const run = async () => {
      while (!cancelled) {
        const category = MASTER_LANDING_SERVICE_DEMO_CATEGORIES[categoryIndex];
        categoryIndex = (categoryIndex + 1) % MASTER_LANDING_SERVICE_DEMO_CATEGORIES.length;

        setFormStep(0);
        setPhase('idle');
        setScenario(null);
        setActiveChipId(null);
        setTitle('');
        setPrice('');
        setCoverReady(false);
        setPriceTypeFixed(true);
        setActiveField(null);
        setCursorVisible(false);
        setCursorPressing(false);
        scrollDemoToTop(scrollRef.current);
        await wait(500);
        if (cancelled) break;

        setCursorVisible(true);
        setPhase('to-chip');
        moveCursorToSelector(`[data-master-demo-chip="${category.id}"]`);
        await wait(700);
        if (cancelled) break;

        setPhase('pick-chip');
        setScenario(category);
        setActiveChipId(category.id);
        await landingDemoTap(setCursorPressing);
        await wait(450);
        if (cancelled) break;

        setPhase('to-title');
        moveCursorToSelector('[data-master-demo-title]');
        await wait(650);
        if (cancelled) break;

        setPhase('fill-title');
        setActiveField('title');
        await landingDemoTap(setCursorPressing);
        await landingDemoType(setTitle, category.title);
        await wait(350);
        if (cancelled) break;

        setPhase('to-price');
        scrollDemoToSelector(scrollRef.current, '[data-master-demo-price]');
        moveCursorToSelector('[data-master-demo-price]');
        await wait(500);
        if (cancelled) break;

        setPhase('fill-price');
        setActiveField('price');
        await landingDemoTap(setCursorPressing);
        await landingDemoType(setPrice, category.price, 80);
        setActiveField(null);
        await wait(400);
        if (cancelled) break;

        setPhase('to-next-0');
        moveCursorToSelector('[data-master-demo-primary="next"]');
        await wait(700);
        if (cancelled) break;

        setPhase('next-0');
        await landingDemoTap(setCursorPressing);
        setFormStep(1);
        setCoverReady(false);
        scrollDemoToTop(scrollRef.current);
        await wait(900);
        if (cancelled) break;

        setPhase('to-cover');
        moveCursorToSelector('[data-master-demo-cover]');
        await wait(650);
        if (cancelled) break;

        await landingDemoTap(setCursorPressing);
        setCoverReady(true);
        await wait(500);
        if (cancelled) break;

        setPhase('to-segment');
        scrollDemoToSelector(scrollRef.current, '[data-master-demo-segment-fixed]');
        moveCursorToSelector('[data-master-demo-segment-fixed]');
        await wait(750);
        if (cancelled) break;

        setPhase('pick-segment');
        await landingDemoTap(setCursorPressing);
        setPriceTypeFixed(true);
        await wait(450);
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
        await wait(1800);
        if (cancelled) break;

        setPhase('reset');
        setCursorVisible(false);
        await wait(450);
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [moveCursorToSelector, reducedMotion]);

  const primaryPressing =
    cursorPressing &&
    (phase === 'next-0' || phase === 'next-1' || phase === 'save');

  const footer =
    formStep < 2
      ? demoFooterPair({
          leftLabel: formStep === 0 ? 'Отмена' : 'Назад',
          rightLabel: 'Далее',
          rightPressing: primaryPressing,
          rightDataAttr: 'next',
        })
      : demoFooterPair({
          leftLabel: 'Назад',
          rightLabel: 'Сохранить',
          rightPressing: primaryPressing,
          rightDataAttr: 'save',
        });

  return (
    <>
      <MasterLandingDemoSheet
        stageRef={stageRef}
        scrollRef={scrollRef}
        title="Новая услуга"
        ariaLabel="Демо: создание услуги в кабинете"
        overlay={
          !reducedMotion ? (
            <LandingDemoCursor point={cursorPoint} visible={cursorVisible} pressing={cursorPressing} />
          ) : null
        }
        stepper={<AdminFormSheetStepper step={formStep} steps={SERVICE_FORM_STEPS} variant="catalog" accent="brand" />}
        footer={footer}
      >
        {formStep === 0 ? (
          <div className="space-y-2.5">
            <div>
              <p className={`${catalogSheetLabel} !text-[11px]`}>Популярные услуги</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {MASTER_LANDING_SERVICE_DEMO_CATEGORIES.map((cat) => (
                  <span
                    key={cat.id}
                    data-master-demo-chip={cat.id}
                    className={`${masterDemoChipCabinet} ${
                      activeChipId === cat.id ? masterDemoChipCabinetActive : masterDemoChipCabinetIdle
                    } ${cursorPressing && phase === 'pick-chip' && scenario?.id === cat.id ? 'scale-[0.96]' : ''}`}
                  >
                    {cat.chip}
                  </span>
                ))}
              </div>
            </div>

            <div className={masterDemoFormPanel}>
              <label className="block">
                <p className={`${catalogSheetLabel} !text-[11px]`}>Название услуги</p>
                <div
                  data-master-demo-title
                  className={`${catalogSheetField} mt-1 !py-2 !text-[13px] ${
                    activeField === 'title' ? masterDemoFieldActive : ''
                  }`}
                >
                  {title || (
                    <span className="text-[#8E8E93]">
                      {scenario?.titlePlaceholder ?? 'Например, название услуги'}
                    </span>
                  )}
                </div>
              </label>

              <label className="mt-2.5 block">
                <p className={`${catalogSheetLabel} !text-[11px]`}>Цена, BYN</p>
                <div
                  data-master-demo-price
                  className={`${catalogSheetField} mt-1 !py-2 !text-[13px] ${
                    activeField === 'price' ? masterDemoFieldActive : ''
                  }`}
                >
                  {price || (
                    <span className="text-[#8E8E93]">
                      {scenario?.pricePlaceholder ?? '45'}
                    </span>
                  )}
                </div>
              </label>
            </div>
          </div>
        ) : null}

        {formStep === 1 ? (
          <div className="space-y-2.5">
            <div className={masterDemoFormPanel}>
              <p className="text-[13px] font-bold tracking-[-0.02em] text-[#111827]">Фото для каталога</p>
              <div
                data-master-demo-cover
                className={`mt-2 overflow-hidden rounded-[14px] border border-[#EEEEEE] bg-white shadow-[0_8px_24px_rgba(17,17,17,0.06)] transition ${
                  cursorPressing && phase === 'to-cover' ? 'scale-[0.98]' : ''
                }`}
              >
                <div className="relative aspect-[5/3] w-full overflow-hidden bg-[#EBEBEB]">
                  {coverReady ? (
                    <img
                      src={display.coverSrc}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      decoding="async"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-[#9CA3AF]">
                      + Загрузить фото
                    </div>
                  )}
                </div>
                {coverReady ? (
                  <div className="space-y-1 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#F47C8C]">
                      {display.chip}
                    </p>
                    <p className="line-clamp-1 text-[15px] font-bold leading-snug text-[#111827]">
                      {display.title}
                    </p>
                    <p className="text-[16px] font-bold text-[#111827]">{display.price} BYN</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={masterDemoFormPanel}>
              <p className={`${catalogSheetLabel} !text-[11px]`}>Тип цены</p>
              <div className={`mt-1.5 ${masterDemoSegmentTrack}`}>
                <div
                  data-master-demo-segment-fixed
                  className={`${masterDemoSegmentClass(priceTypeFixed, 'brand')} ${
                    cursorPressing && phase === 'pick-segment' ? 'scale-[0.97]' : ''
                  }`}
                >
                  Точная цена
                </div>
                <div className={masterDemoSegmentClass(!priceTypeFixed, 'brand')}>Цена от</div>
              </div>

              <div className="mt-2.5">
                <p className={`${catalogSheetLabel} !text-[11px]`}>Видимость</p>
                <div className={`mt-1.5 ${servicesFormSegmentTrack}`}>
                  <div className={masterDemoSegmentClass(true, 'brand')}>Видна</div>
                  <div className={masterDemoSegmentClass(false, 'brand')}>Скрыта</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {formStep === 2 ? (
          <div className="origin-top scale-[0.96]">
            <ServicesFormSummary
              title={display.title}
              priceLabel={`${display.price} BYN`}
              priceTypeLabel="Точная цена"
              visibilityLabel="Видна"
              categoryLabel={display.chip}
            />
          </div>
        ) : null}
      </MasterLandingDemoSheet>
    </>
  );
};
