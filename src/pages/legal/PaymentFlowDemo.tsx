import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { LANDING_HEADER_LOGO_SRC } from '../../app/headerLogo';
import { AdminFormSheetStepper } from '../admin/shared/AdminFormSheetLayout';
import { centerInLandingStage, LandingDemoCursor } from '../home/homeLandingDemoCursor';
import {
  landingDemoTap,
  landingDemoType,
  useLandingDemoReducedMotion,
} from '../home/masterLandingDemoShared';
import { SlottyImg } from '../../shared/ui/SlottyImg';
import { legalDocFontBody, legalDocFontDisplay } from './legalDocumentUi';
import {
  legalFlowDemoHeaderPad,
  legalFlowDemoPanel,
  legalFlowDemoShell,
  legalFlowDemoStage,
} from './legalFlowDemoTheme';
import {
  PaymentFlowBePaidPanel,
  PaymentFlowCheckoutPanel,
  PaymentFlowProSuccessPanel,
  PaymentFlowTariffPanel,
} from './paymentFlowDemoPanels';

const STEP_LABELS = ['Тариф Pro', 'Переход', 'Данные карты', 'Готово'] as const;

const STEPS = [
  {
    id: 'tariff',
    title: 'Выберите тариф Pro',
    body: 'В кабинете мастера: Настройки → Тариф и оплата → Подключить Pro.',
  },
  {
    id: 'checkout',
    title: 'Перейдите к оплате',
    body: 'Проверьте сумму и нажмите «Перейти к оплате» — откроется bePaid.',
  },
  {
    id: 'card',
    title: 'Введите данные карты',
    body: 'На странице bePaid укажите номер карты, срок действия и CVC, затем подтвердите платёж.',
  },
  {
    id: 'result',
    title: 'Подписка активируется',
    body: 'После подтверждения банком Pro появится в кабинете автоматически.',
  },
] as const;

type StepId = (typeof STEPS)[number]['id'];
type CardFieldId = 'card' | 'expiry' | 'cvc';

const DEMO_CARD = '4276 1234 5678 9012';
const DEMO_EXPIRY = '12 / 28';
const DEMO_CVC = '123';

export const PaymentFlowDemo: FC = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useLandingDemoReducedMotion();

  const [activeStep, setActiveStep] = useState<StepId>('tariff');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [activeField, setActiveField] = useState<CardFieldId | null>(null);
  const [typing, setTyping] = useState(false);
  const [tariffConfirmed, setTariffConfirmed] = useState(false);

  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPressing, setCursorPressing] = useState(false);
  const [cursorPoint, setCursorPoint] = useState({ x: 0, y: 0 });

  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);
  const step = STEPS[activeIndex] ?? STEPS[0]!;

  const moveCursorToSelector = useCallback((selector: string) => {
    const stage = stageRef.current;
    const el = stage?.querySelector<HTMLElement>(selector);
    if (!stage || !el) return;
    setCursorPoint(centerInLandingStage(el, stage));
  }, []);

  const resetCardForm = useCallback(() => {
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setActiveField(null);
    setTyping(false);
    setTariffConfirmed(false);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setActiveStep('result');
      setCardNumber(DEMO_CARD);
      setExpiry(DEMO_EXPIRY);
      setCvc(DEMO_CVC);
      setTariffConfirmed(true);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(() => !cancelled && resolve(), ms));
      });

    const typeField = async (
      field: CardFieldId,
      setter: (v: string) => void,
      value: string,
      charMs: number,
    ) => {
      if (cancelled) return;
      setActiveField(field);
      setTyping(true);
      await landingDemoType(setter, value, charMs);
      setTyping(false);
      await wait(280);
    };

    const run = async () => {
      while (!cancelled) {
        setActiveStep('tariff');
        resetCardForm();
        setCursorVisible(false);
        setCursorPressing(false);
        await wait(700);
        if (cancelled) break;

        setCursorVisible(true);
        moveCursorToSelector('[data-payment-demo-tariff]');
        await wait(700);
        if (cancelled) break;

        await landingDemoTap(setCursorPressing);
        setTariffConfirmed(true);
        await wait(1000);
        if (cancelled) break;

        setActiveStep('checkout');
        moveCursorToSelector('[data-payment-demo-checkout]');
        await wait(750);
        if (cancelled) break;

        await landingDemoTap(setCursorPressing);
        await wait(600);
        if (cancelled) break;

        setActiveStep('card');
        resetCardForm();
        await wait(400);
        if (cancelled) break;

        moveCursorToSelector('[data-payment-demo-field="card"]');
        await wait(500);
        if (cancelled) break;

        await typeField('card', setCardNumber, DEMO_CARD, 38);
        if (cancelled) break;

        moveCursorToSelector('[data-payment-demo-field="expiry"]');
        await wait(450);
        if (cancelled) break;

        await typeField('expiry', setExpiry, DEMO_EXPIRY, 55);
        if (cancelled) break;

        moveCursorToSelector('[data-payment-demo-field="cvc"]');
        await wait(450);
        if (cancelled) break;

        await typeField('cvc', setCvc, DEMO_CVC, 70);
        if (cancelled) break;

        moveCursorToSelector('[data-payment-demo-submit]');
        await wait(650);
        if (cancelled) break;

        await landingDemoTap(setCursorPressing);
        setActiveField(null);
        setCursorVisible(false);
        await wait(500);
        if (cancelled) break;

        setActiveStep('result');
        await wait(3000);
        if (cancelled) break;

        await wait(400);
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [moveCursorToSelector, reducedMotion, resetCardForm]);

  return (
    <section
      id="current"
      className="scroll-mt-[calc(7.5rem+env(safe-area-inset-top,0px))]"
      aria-label="Как оплатить подписку Pro"
    >
      <h2 className={`${legalDocFontDisplay} text-[20px] font-medium leading-snug text-[#111827] sm:text-[22px]`}>
        Как оплатить Pro
      </h2>
      <p className={`${legalDocFontBody} mt-2 w-full text-[15px] leading-relaxed text-[#6B7280] sm:text-[16px]`}>
        Пошаговый сценарий для мастера: тариф в кабинете → bePaid → ввод карты → активация подписки.
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
              steps={[...STEP_LABELS]}
              variant="catalog"
              accent="brand"
            />
          </div>
        </div>

        <div ref={stageRef} className={legalFlowDemoStage}>
          <div className={legalFlowDemoPanel}>
            <p className={`${legalDocFontDisplay} text-[14px] font-medium text-[#111827] sm:text-[15px]`}>
              {step.title}
            </p>
            <p className={`${legalDocFontBody} mt-1 text-[12px] leading-relaxed text-[#9CA3AF] sm:text-[13px]`}>
              {step.body}
            </p>

            <div className="mt-4">
              {activeStep === 'tariff' ? (
                <PaymentFlowTariffPanel confirmed={tariffConfirmed} pressing={cursorPressing} />
              ) : null}

              {activeStep === 'checkout' ? (
                <PaymentFlowCheckoutPanel pressing={cursorPressing} />
              ) : null}

              {activeStep === 'card' ? (
                <PaymentFlowBePaidPanel
                  cardNumber={cardNumber}
                  expiry={expiry}
                  cvc={cvc}
                  activeField={activeField}
                  typing={typing}
                  pressing={cursorPressing}
                />
              ) : null}

              {activeStep === 'result' ? <PaymentFlowProSuccessPanel /> : null}
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
