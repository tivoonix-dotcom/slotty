import type { ReactNode } from 'react';

/** Фирменное розовое дуговое подчёркивание SLOTTY. */
export function PinkArcUnderline({ className }: { className?: string }) {
  return (
    <svg
      className={
        className ??
        'pointer-events-none absolute -bottom-1 left-0 h-[0.55em] w-full min-w-full text-[#ff5f7a]'
      }
      viewBox="0 0 120 14"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M2 11C30 4 90 4 118 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PinkArcHighlight({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block pb-1 align-baseline">
      <span className="relative z-10">{children}</span>
      <PinkArcUnderline />
    </span>
  );
}
