import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { HiCheck, HiCreditCard, HiEnvelope } from 'react-icons/hi2';
import { LANDING_HEADER_LOGO_SRC } from '../../app/headerLogo';
import { AdminFormSheetStepper } from '../admin/shared/AdminFormSheetLayout';
import { centerInLandingStage, LandingDemoCursor } from '../home/homeLandingDemoCursor';
import { landingDemoTap, useLandingDemoReducedMotion } from '../home/masterLandingDemoShared';
import { SlottyImg } from '../../shared/ui/SlottyImg';
import { legalDocFontBody, legalDocFontDisplay } from './legalDocumentUi';
import {
  legalFlowDemoHeaderPad,
  legalFlowDemoInnerCard,
  legalFlowDemoPanel,
  legalFlowDemoPrimaryBtn,
  legalFlowDemoShell,
  legalFlowDemoStage,
} from './legalFlowDemoTheme';
import { SITE_SUPPORT_EMAIL } from './legalSiteInfo';

const REFUND_FLOW_STEP_LABELS = ['Обращение', 'Проверка', 'Возврат'] as const;

const STEPS = [
  {
    id: 'request',
    label: 'Обращение',
    title: 'Напишите в поддержку',
    body: 'Укажите дату платежа, сумму и кратко опишите ситуацию — мы ответим на {email}.',
  },
  {
    id: 'review',
    label: 'Проверка',
    title: 'Сверяем платёж',
    body: 'Проверяем оплату в системе и условия возврата по вашему случаю.',
  },
  {
    id: 'refund',
    label: 'Возврат',
    title: 'Средства на карту',
    body: 'После одобрения возврат уходит на карту в сроки платёжной системы.',
  },
] as const;

type StepId = (typeof STEPS)[number]['id'];

export const RefundFlowDemo: FC = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useLandingDemoReducedMotion();

  const [activeStep, setActiveStep] = useState<StepId>('request');
  const [phase, setPhase] = useState<'idle' | 'typing' | 'send' | 'reviewing' | 'approved' | 'refund'>('idle');
  const [emailDraft, setEmailDraft] = useState('');
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPressing, setCursorPressing] = useState(false);
  const [cursorPoint, setCursorPoint] = useState({ x: 0, y: 0 });

  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);

  const moveCursorToSelector = useCallback((selector: string) => {
    const stage = stageRef.current;
    const el = stage?.querySelector<HTMLElement>(selector);
    if (!stage || !el) return;
    setCursorPoint(centerInLandingStage(el, stage));
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setActiveStep('refund');
      setPhase('refund');
      setEmailDraft('Возврат за тариф Pro, 12.05');
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(() => !cancelled && resolve(), ms));
      });

    const typeEmail = async (value: string) => {
      setEmailDraft('');
      for (let i = 1; i <= value.length; i += 1) {
        setEmailDraft(value.slice(0, i));
        await wait(42);
        if (cancelled) return;
      }
    };

    const run = async () => {
      while (!cancelled) {
        setActiveStep('request');
        setPhase('idle');
        setEmailDraft('');
        setCursorVisible(false);
        setCursorPressing(false);
        await wait(700);
        if (cancelled) break;

        setPhase('typing');
        await typeEmail('Возврат за тариф Pro, 12.05');
        await wait(450);
        if (cancelled) break;

        setCursorVisible(true);
        moveCursorToSelector('[data-refund-demo-send]');
        await wait(750);
        if (cancelled) break;

        setPhase('send');
        await landingDemoTap(setCursorPressing);
        await wait(650);
        if (cancelled) break;

        setActiveStep('review');
        setPhase('reviewing');
        setCursorVisible(false);
        await wait(1400);
        if (cancelled) break;

        setPhase('approved');
        await wait(1100);
        if (cancelled) break;

        setActiveStep('refund');
        setPhase('refund');
        await wait(2600);
        if (cancelled) break;

        setPhase('idle');
        await wait(500);
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [moveCursorToSelector, reducedMotion]);

  const step = STEPS[activeIndex] ?? STEPS[0]!;

  return (
    <section className="mt-8" aria-label="Как происходит возврат">
      <h2 className={`${legalDocFontDisplay} text-[20px] font-medium leading-snug text-[#111827] sm:text-[22px]`}>
        Как происходит возврат
      </h2>
      <p className={`${legalDocFontBody} mt-2 w-full text-[15px] leading-relaxed text-[#6B7280] sm:text-[16px]`}>
        Типовой сценарий: обращение → проверка платежа → возврат на карту.
      </p>

      <div className={legalFlowDemoShell}>
        <div className={legalFlowDemoHeaderPad}>
          <div className="mb-4 flex justify-center sm:mb-5">
            <SlottyImg
              src={LANDING_HEADER_LOGO_SRC}
              alt="SLOTTY"
              className="h-12 w-auto object-contain sm:h-14 lg:h-16"
              decoding="async"
            />
          </div>
          <div className="min-w-0 w-full overflow-visible">
            <AdminFormSheetStepper
              step={activeIndex}
              steps={[...REFUND_FLOW_STEP_LABELS]}
              variant="catalog"
              accent="brand"
            />
          </div>
        </div>

        <div ref={stageRef} className={legalFlowDemoStage}>
          <div className={legalFlowDemoPanel}>
            <div className={legalFlowDemoInnerCard}>
              <p className={`${legalDocFontDisplay} text-[15px] font-medium text-[#111827] sm:text-[16px]`}>
                {step.title}
              </p>
              <p className={`${legalDocFontBody} mt-1.5 text-[13px] leading-relaxed text-[#6B7280] sm:text-[14px]`}>
                {step.body.replace('{email}', SITE_SUPPORT_EMAIL)}
              </p>

              {activeStep === 'request' ? (
                <div className="mt-4 space-y-3">
                  <label className={`${legalDocFontBody} block text-[12px] font-medium text-[#9CA3AF]`}>
                    Сообщение в поддержку
                  </label>
                  <div className="flex items-start gap-2.5 rounded-[14px] bg-[#F8F8F6] px-3 py-3">
                    <HiEnvelope className="mt-0.5 h-4 w-4 shrink-0 text-[#E29595]" aria-hidden />
                    <p className={`${legalDocFontBody} min-h-[2.5rem] flex-1 text-[13px] leading-snug text-[#111827] sm:text-[14px]`}>
                      {emailDraft}
                      {phase === 'typing' ? (
                        <span className="ml-0.5 inline-block h-[1em] w-px animate-pulse bg-[#111827]" aria-hidden />
                      ) : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-refund-demo-send
                    className={`${legalFlowDemoPrimaryBtn} ${phase === 'send' ? 'scale-[0.98]' : ''}`}
                    tabIndex={-1}
                    aria-hidden
                  >
                    Отправить
                  </button>
                </div>
              ) : null}

              {activeStep === 'review' ? (
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between rounded-[14px] bg-[#F8F8F6] px-3 py-3">
                    <div>
                      <p className={`${legalDocFontBody} text-[12px] font-medium text-[#9CA3AF]`}>Платёж</p>
                      <p className={`${legalDocFontDisplay} mt-0.5 text-[15px] font-medium text-[#111827]`}>
                        Тариф Pro · 45 BYN
                      </p>
                    </div>
                    <span
                      className={[
                        `${legalDocFontBody} rounded-full px-2.5 py-1 text-[11px] font-semibold`,
                        phase === 'approved'
                          ? 'bg-[#DCFCE7] text-[#166534]'
                          : 'bg-[#FFF7ED] text-[#C2410C]',
                      ].join(' ')}
                    >
                      {phase === 'approved' ? 'Подтверждено' : 'Проверяем…'}
                    </span>
                  </div>
                  {phase === 'approved' ? (
                    <p className={`${legalDocFontBody} animate-fade-enter text-[13px] text-[#6B7280]`}>
                      Условия возврата выполнены — готовим перевод.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {activeStep === 'refund' ? (
                <div className="mt-4 animate-fade-enter">
                  <div className="flex items-center gap-3 rounded-[14px] bg-[#F8F8F6] px-3 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#111827] text-white">
                      <HiCreditCard className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className={`${legalDocFontDisplay} text-[15px] font-medium text-[#111827]`}>
                        Возврат отправлен
                      </p>
                      <p className={`${legalDocFontBody} mt-0.5 text-[13px] text-[#6B7280]`}>
                        45 BYN · до 5 рабочих дней
                      </p>
                    </div>
                    <HiCheck className="ml-auto h-5 w-5 shrink-0 text-[#22C55E]" aria-hidden />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {!reducedMotion ? (
            <LandingDemoCursor point={cursorPoint} visible={cursorVisible} pressing={cursorPressing} />
          ) : null}
        </div>
      </div>
    </section>
  );
};
