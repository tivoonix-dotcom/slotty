import type { ReactNode } from 'react';

/** Общая оболочка bottom sheet / модалки в стиле профиля. */
export function ProfileSheetShell({
  onClose,
  children,
  labelledBy,
}: {
  onClose: () => void;
  children: ReactNode;
  labelledBy: string;
}) {
  return (
    <div
      className="scrollbar-hidden fixed inset-0 z-[51] flex items-end justify-center overflow-x-hidden overflow-y-hidden bg-black/30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-[max(2.5rem,env(safe-area-inset-top,0px))] backdrop-blur-[2px] sm:items-center sm:overflow-y-auto sm:p-4 sm:py-8"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="pointer-events-auto flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2.5rem))] w-full max-w-lg flex-col overflow-hidden rounded-t-[36px] bg-white shadow-[0_24px_90px_rgba(0,0,0,0.2)] sm:max-h-[min(88dvh,calc(100dvh-4rem))] sm:rounded-[36px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="scrollbar-hidden min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain p-5 [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
      </div>
    </div>
  );
}
