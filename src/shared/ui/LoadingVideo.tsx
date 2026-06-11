import { type ReactNode } from 'react';

const SIZE_CLASS = {
  sm: 'h-8 w-8 border-2',
  md: 'h-10 w-10 border-2',
  lg: 'h-12 w-12 border-[3px]',
  xl: 'h-14 w-14 border-[3px]',
} as const;

type Size = keyof typeof SIZE_CLASS;

type LoadingVideoProps = {
  size?: Size;
  /** Видимая подпись — только если нужен контекст; по умолчанию только анимация. */
  label?: string;
  className?: string;
};

export function LoadingVideo({ size = 'md', label, className = '' }: LoadingVideoProps) {
  return (
    <div
      className={`mx-auto flex flex-col items-center justify-center gap-3 ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={`${SIZE_CLASS[size]} animate-spin rounded-full border-[#F47C8C] border-t-transparent`}
        aria-hidden
      />
      {label ? (
        <p className="max-w-[18rem] text-center text-[13px] font-medium leading-snug text-[#9CA3AF]">
          {label}
        </p>
      ) : (
        <span className="sr-only">Загрузка</span>
      )}
    </div>
  );
}

type LoadingScreenProps = {
  label?: string;
  className?: string;
  children?: ReactNode;
};

/** Полноэкранная загрузка (страница, роут). */
export function LoadingScreen({ label, className = '', children }: LoadingScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-[120] flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#F1EFEF] px-4 py-12 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] ${className}`}
    >
      <LoadingVideo size="xl" label={label} />
      {children}
    </div>
  );
}

type LoadingPanelProps = {
  label?: string;
  className?: string;
  minHeight?: string;
};

/** Блок загрузки внутри карточки / секции. */
export function LoadingPanel({
  label,
  className = '',
  minHeight = 'min-h-[18rem]',
}: LoadingPanelProps) {
  return (
    <div className={`flex w-full ${minHeight} items-center justify-center ${className}`}>
      <LoadingVideo size="lg" label={label} />
    </div>
  );
}
