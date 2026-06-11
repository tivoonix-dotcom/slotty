import { Fragment, type ReactNode } from 'react';
import { SlottyImg } from '../../../shared/ui/SlottyImg';
import {
  adminFormSheetSection,
  adminFormSheetSectionCatalog,
  adminFormSheetSectionHint,
  adminFormSheetSectionHintCatalog,
  adminFormSheetSectionTitle,
  adminFormSheetSectionTitleCatalog,
  adminFormSheetHighlight,
  adminFormSheetMetricCatalog,
  adminFormSheetStepDoneIconSrc,
} from './adminFormSheetTheme';
import { adminSheetBodyPad } from './adminCabinetSheetTheme';

const STEPPER_CIRCLE =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition sm:h-10 sm:w-10';

const STEPPER_DONE_ICON = 'h-9 w-9 object-contain sm:h-10 sm:w-10';

function StepperStepMark({
  done,
  index,
  large,
}: {
  done: boolean;
  index: number;
  large?: boolean;
}) {
  if (done) {
    return (
      <SlottyImg
        src={adminFormSheetStepDoneIconSrc}
        alt=""
        className={large ? 'h-9 w-9 object-contain lg:h-11 lg:w-11' : STEPPER_DONE_ICON}
        decoding="async"
        aria-hidden
      />
    );
  }
  return <>{index + 1}</>;
}

function stepperCircleClass(active: boolean, done: boolean, accent: 'brand' | 'schedule'): string {
  if (active || done) {
    return accent === 'schedule' ? 'bg-[#3B4CCA] text-white' : 'bg-[#F47C8C] text-white';
  }
  return 'bg-[#EBEBEB] text-[#6B7280]';
}

function stepperLabelClass(active: boolean, done: boolean): string {
  if (active) return 'font-bold text-[#111827]';
  if (done) return 'font-semibold text-[#6B7280]';
  return 'font-medium text-[#9CA3AF]';
}

type StepperProps = {
  step: number;
  steps: readonly string[];
  /** `catalog` — степпер с пунктиром и подписями (кабинет). */
  variant?: 'rail' | 'header' | 'catalog';
  /** `schedule` — синий акцент (страница расписания). */
  accent?: 'brand' | 'schedule';
};

export function AdminFormSheetStepper({
  step,
  steps,
  variant = 'rail',
  accent = 'brand',
}: StepperProps) {
  const isCatalog = variant === 'catalog';
  const inHeader = variant === 'header' || isCatalog;

  if (isCatalog) {
    return (
      <div className="w-full" role="navigation" aria-label="Шаги формы">
        <div className="flex w-full items-start">
          {steps.map((label, index) => {
            const done = index < step;
            const active = index === step;

            return (
              <Fragment key={label}>
                {index > 0 ? (
                  <div
                    className="mt-[18px] h-px min-w-2 flex-1 border-t border-dashed border-[#D1D5DB] sm:mt-5"
                    aria-hidden
                  />
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <div
                    className={
                      done
                        ? 'flex shrink-0 items-center justify-center'
                        : `${STEPPER_CIRCLE} ${stepperCircleClass(active, done, accent)}`
                    }
                    aria-current={active ? 'step' : undefined}
                  >
                    <StepperStepMark done={done} index={index} />
                  </div>
                  <span
                    className={`w-full text-center text-[10px] leading-tight sm:text-[11px] ${stepperLabelClass(active, done)}`}
                  >
                    {label}
                  </span>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" role="navigation" aria-label="Шаги формы">
      <div className={`flex w-full items-start ${inHeader ? 'gap-3' : 'gap-2 lg:gap-3'}`}>
        {steps.map((label, index) => {
          const done = index < step;
          const active = index === step;
          const reached = index <= step;
          const activeAccentClass =
            accent === 'schedule' ? 'bg-[#3B4CCA] text-white' : 'bg-[#F47C8C] text-white';

          return (
            <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div
                className={
                  done
                    ? 'flex shrink-0 items-center justify-center lg:h-11 lg:w-11'
                    : `${STEPPER_CIRCLE} lg:h-11 lg:w-11 lg:text-[14px] ${reached ? activeAccentClass : 'bg-[#EBEBEB] text-[#9CA3AF]'}`
                }
                aria-current={active ? 'step' : undefined}
                title={label}
              >
                <StepperStepMark done={done} index={index} large />
              </div>
              <span
                className={`w-full truncate text-center text-[11px] font-semibold leading-tight ${
                  inHeader ? 'block' : 'hidden lg:block'
                } ${
                  active
                    ? accent === 'schedule'
                      ? 'text-[#3B4CCA]'
                      : 'text-[#F47C8C]'
                    : reached
                      ? 'text-[#374151]'
                      : 'text-[#9CA3AF]'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Metric = { label: string; value: ReactNode };

export function AdminFormSheetMetrics({
  items,
  variant = 'default',
}: {
  items: Metric[];
  variant?: 'default' | 'catalog';
}) {
  const isCatalog = variant === 'catalog';

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
      {items.map((item) => (
        <div key={item.label} className={isCatalog ? adminFormSheetMetricCatalog : adminFormSheetHighlight}>
          <p
            className={
              isCatalog
                ? 'text-[12px] font-medium text-[#6B7280]'
                : 'text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]'
            }
          >
            {item.label}
          </p>
          <div
            className={
              isCatalog
                ? 'mt-1 text-[18px] font-bold tabular-nums leading-none tracking-[-0.04em] text-[#111827]'
                : 'mt-2 text-[clamp(1.25rem,2.2vw,1.75rem)] font-black tabular-nums leading-none tracking-[-0.06em] text-[#111827]'
            }
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

type SectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'catalog';
};

export function AdminFormSheetSection({
  title,
  description,
  children,
  className = '',
  variant = 'default',
}: SectionProps) {
  const isCatalog = variant === 'catalog';
  const shell = isCatalog ? adminFormSheetSectionCatalog : adminFormSheetSection;
  const titleClass = isCatalog ? adminFormSheetSectionTitleCatalog : adminFormSheetSectionTitle;
  const hintClass = isCatalog ? adminFormSheetSectionHintCatalog : adminFormSheetSectionHint;

  return (
    <section className={`${shell} ${className}`.trim()}>
      {title || description ? (
        <header className={isCatalog ? 'mb-3' : 'mb-4 lg:mb-5'}>
          {title ? <h3 className={titleClass}>{title}</h3> : null}
          {description ? <p className={hintClass}>{description}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

type LayoutProps = {
  children: ReactNode;
};

export function AdminFormSheetLayout({ children }: LayoutProps) {
  return (
    <div className={`${adminSheetBodyPad} space-y-5 lg:space-y-6`}>{children}</div>
  );
}
