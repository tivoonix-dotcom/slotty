import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';
import {
  clientDesktopDrawerPanel,
  clientDesktopDrawerPanelWide,
} from './masterProfileTheme';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Шире на desktop — календарь записи и т.п. */
  desktopSize?: 'default' | 'wide';
};

const BACKDROP_CLOSE_DELAY_MS = 320;

export function ClientSheetShell({
  open,
  onClose,
  title,
  children,
  footer,
  desktopSize = 'default',
}: Props) {
  const suppressBackdropCloseRef = useRef(false);
  const [entered, setEntered] = useState(false);

  useLayoutEffect(() => {
    if (!open) {
      setEntered(false);
      return undefined;
    }

    suppressBackdropCloseRef.current = true;
    const suppressId = window.setTimeout(() => {
      suppressBackdropCloseRef.current = false;
    }, BACKDROP_CLOSE_DELAY_MS);

    const enterId = window.requestAnimationFrame(() => setEntered(true));

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(suppressId);
      window.cancelAnimationFrame(enterId);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [open]);

  const handleBackdropClose = () => {
    if (suppressBackdropCloseRef.current) return;
    onClose();
  };

  if (!open || typeof document === 'undefined') return null;

  const desktopWidthClass =
    desktopSize === 'wide' ? clientDesktopDrawerPanelWide : clientDesktopDrawerPanel;

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      <button
        type="button"
        className={`absolute inset-0 min-h-dvh w-full bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 lg:bg-black/28 ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Закрыть"
        onClick={handleBackdropClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-sheet-title"
        className={`fixed inset-x-0 bottom-0 z-10 flex max-h-[min(92dvh,100dvh)] w-full min-h-0 flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_24px_90px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out lg:inset-x-auto lg:bottom-0 lg:right-0 lg:top-0 lg:h-dvh lg:max-h-none lg:rounded-none lg:rounded-l-[24px] lg:shadow-[-24px_0_64px_rgba(17,24,39,0.14)] ${desktopWidthClass} ${
          entered ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-full'
        }`}
      >
        <div className="mx-auto mb-3 mt-3 h-1 w-10 shrink-0 rounded-full bg-[#EAECEF] lg:hidden" aria-hidden />

        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#F3F4F6] px-5 py-4 lg:px-6 lg:py-5">
          <h2
            id="client-sheet-title"
            className="min-w-0 text-[18px] font-semibold leading-snug text-[#111827] lg:text-[20px]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[#6B7280] transition hover:bg-[#EBEBEB] hover:text-[#111827] active:scale-95 lg:h-11 lg:w-11 lg:rounded-[14px]"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col bg-white lg:bg-[#FAFAFA]">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 lg:px-6 lg:py-5">
            {children}
          </div>

          {footer ? (
            <div className="shrink-0 border-t border-[#F3F4F6] bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-6 lg:py-5">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
