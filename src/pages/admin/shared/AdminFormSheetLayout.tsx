import type { ReactNode } from 'react';
import {
  adminFormSheetSection,
  adminFormSheetSectionHint,
  adminFormSheetSectionTitle,
  adminFormSheetHighlight,
} from './adminFormSheetTheme';
import { adminSheetBodyPad, adminSheetStepperRail } from './adminCabinetSheetTheme';

type StepperProps = {
  step: number;
  steps: readonly string[];
  /** `header` — в шапке модалки, подписи шагов всегда видны, без «шаг N из M». */
  variant?: 'rail' | 'header';
};

export function AdminFormSheetStepper({ step, steps, variant = 'rail' }: StepperProps) {
  const inHeader = variant === 'header';

  return (
    <div
      className={inHeader ? 'w-full' : undefined}
      role="navigation"
      aria-label="Шаги формы"
    >
      <div className={`flex gap-2 ${inHeader ? 'gap-3' : 'lg:gap-3'}`}>
        {steps.map((label, index) => {
          const done = index < step;
          const active = index === step;
          const reached = index <= step;

          return (
            <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-black transition sm:h-10 sm:w-10 ${
                  inHeader ? 'lg:h-11 lg:w-11 lg:text-[14px]' : 'lg:h-11 lg:w-11 lg:text-[14px]'
                } ${
                  reached
                    ? 'bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_8px_22px_rgba(255,95,122,0.38)]'
                    : 'bg-[#EAECEF] text-[#9CA3AF]'
                } ${active ? 'ring-2 ring-[#ff5f7a]/30 ring-offset-2 ring-offset-white' : ''}`}
                aria-current={active ? 'step' : undefined}
                title={label}
              >
                {done ? '✓' : index + 1}
              </div>
              <span
                className={`w-full truncate text-center text-[11px] font-bold leading-tight ${
                  inHeader ? 'block' : 'hidden lg:block'
                } ${active ? 'text-[#ff5f7a]' : reached ? 'text-[#374151]' : 'text-[#9CA3AF]'}`}
              >
                {label}
              </span>
              {!inHeader ? (
                <div
                  className={`h-1 w-full rounded-full transition lg:hidden ${
                    reached ? 'bg-[#ff5f7a]' : 'bg-[#EAECEF]'
                  }`}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {!inHeader ? (
        <p className="mt-3 text-center text-[12px] font-semibold text-[#9CA3AF] lg:mt-4 lg:text-left lg:text-[13px]">
          <span className="font-bold text-[#111827]">{steps[step]}</span>
          <span className="text-[#D1D5DB]"> · </span>
          шаг {step + 1} из {steps.length}
        </p>
      ) : null}
    </div>
  );
}

type Metric = { label: string; value: ReactNode };

export function AdminFormSheetMetrics({ items }: { items: Metric[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className={adminFormSheetHighlight}>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
            {item.label}
          </p>
          <div className="mt-2 text-[clamp(1.25rem,2.2vw,1.75rem)] font-black tabular-nums leading-none tracking-[-0.06em] text-[#111827]">
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
};

export function AdminFormSheetSection({ title, description, children, className = '' }: SectionProps) {
  return (
    <section className={`${adminFormSheetSection} ${className}`.trim()}>
      {title || description ? (
        <header className="mb-4 lg:mb-5">
          {title ? <h3 className={adminFormSheetSectionTitle}>{title}</h3> : null}
          {description ? <p className={adminFormSheetSectionHint}>{description}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

type LayoutProps = {
  step?: number;
  steps?: readonly string[];
  children: ReactNode;
};

export function AdminFormSheetLayout({ step, steps, children }: LayoutProps) {
  return (
    <div className="flex min-h-0 flex-col">
      {steps != null && step != null ? (
        <div className={adminSheetStepperRail}>
          <AdminFormSheetStepper step={step} steps={steps} />
        </div>
      ) : null}

      <div className={`${adminSheetBodyPad} space-y-5 lg:space-y-6`}>{children}</div>
    </div>
  );
}
