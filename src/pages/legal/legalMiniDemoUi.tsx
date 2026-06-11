import type { FC, ReactNode } from 'react';

export const legalMiniDemoShell =
  'w-full rounded-[18px] bg-[#F5F5F5] px-4 py-3.5 sm:rounded-[20px] sm:px-5 sm:py-4';

export const LegalMiniCard: FC<{ children: ReactNode }> = ({ children }) => (
  <div className={legalMiniDemoShell} aria-hidden>
    {children}
  </div>
);

export const LegalMiniIconBox: FC<{ children: ReactNode; pink?: boolean; className?: string }> = ({
  children,
  pink = false,
  className = '',
}) => (
  <span
    className={[
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] sm:h-11 sm:w-11',
      pink ? 'bg-[#FFF1F4]' : 'bg-white',
      className,
    ].join(' ')}
  >
    {children}
  </span>
);

export const LegalMiniTitle: FC<{ children: ReactNode }> = ({ children }) => (
  <p className="font-landing text-[13px] font-semibold text-[#111827] sm:text-[14px]">{children}</p>
);

export const LegalMiniDesc: FC<{ children: ReactNode }> = ({ children }) => (
  <p className="mt-0.5 font-landing text-[12px] leading-relaxed text-[#6B7280] sm:text-[13px]">{children}</p>
);

export const LegalMiniMeta: FC<{ children: ReactNode }> = ({ children }) => (
  <p className="mt-1 font-landing text-[11px] leading-snug text-[#9CA3AF] sm:text-[12px]">{children}</p>
);

export const LegalMiniAside: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="shrink-0 text-right">{children}</div>
);

export const LegalMiniRow: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-3 sm:gap-4">{children}</div>
);

export const LegalMiniTags: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={['mt-2.5 flex flex-wrap gap-1.5', className].filter(Boolean).join(' ')}>{children}</div>;

export const LegalMiniTag: FC<{ children: ReactNode; accent?: boolean; success?: boolean }> = ({
  children,
  accent = false,
  success = false,
}) => (
  <span
    className={[
      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-landing text-[10px] font-semibold sm:text-[11px]',
      accent ? 'bg-[#FFF1F4] text-[#F47C8C]' : '',
      success ? 'bg-[#ECFDF5] text-[#047857]' : '',
      !accent && !success ? 'bg-white text-[#374151]' : '',
    ].join(' ')}
  >
    {children}
  </span>
);

export const LegalMiniDivider: FC = () => (
  <div className="my-2.5 h-px bg-[#E8E8E8] sm:my-3" aria-hidden />
);

export const LegalMiniFlow: FC<{ steps: string[] }> = ({ steps }) => (
  <div className="mt-2 flex flex-wrap items-center gap-1 font-landing text-[10px] text-[#9CA3AF] sm:text-[11px]">
    {steps.map((step, i) => (
      <span key={step} className="inline-flex items-center gap-1">
        {i > 0 ? <span className="text-[#D1D5DB]">→</span> : null}
        <span className="rounded-md bg-white px-1.5 py-0.5 text-[#374151]">{step}</span>
      </span>
    ))}
  </div>
);

export const LegalMiniPulseDots: FC = () => (
  <span className="inline-flex gap-1 motion-reduce:opacity-100">
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F47C8C] motion-reduce:animate-none" />
    <span
      className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F47C8C] motion-reduce:animate-none"
      style={{ animationDelay: '180ms' }}
    />
    <span
      className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F47C8C] motion-reduce:animate-none"
      style={{ animationDelay: '360ms' }}
    />
  </span>
);
