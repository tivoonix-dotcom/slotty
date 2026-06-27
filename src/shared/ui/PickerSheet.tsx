import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

const BACKDROP_CLOSE_DELAY_MS = 520;

/** Вторая модалка поверх админ-шита (выбор даты / времени). */
export function PickerSheet({ open, onClose, title, subtitle, children, footer }: Props) {
  const suppressBackdropCloseRef = useRef(false);

  useLayoutEffect(() => {
    if (!open) return undefined;
    suppressBackdropCloseRef.current = true;
    const id = window.setTimeout(() => {
      suppressBackdropCloseRef.current = false;
    }, BACKDROP_CLOSE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  const handleBackdropClose = () => {
    if (suppressBackdropCloseRef.current) return;
    onClose();
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[360]" data-admin-picker-layer>
      <button
        type="button"
        className="absolute inset-0 min-h-dvh w-full bg-black/45 backdrop-blur-[4px]"
        aria-label="Закрыть"
        onClick={handleBackdropClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        data-admin-picker-sheet
        aria-labelledby="picker-sheet-title"
        className="fixed inset-x-0 bottom-0 z-10 flex h-auto max-h-[min(85dvh,640px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-20px_56px_rgba(17,24,39,0.2)] lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-h-[min(80dvh,720px)] lg:w-[min(100%,28rem)] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[28px]"
      >
        <div className="mx-auto mb-3 mt-3 h-1 w-10 shrink-0 rounded-full bg-[#EAECEF] lg:hidden" aria-hidden />

        <header className="shrink-0 border-b border-[#eef0f5] px-[18px] py-4 lg:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 pr-2">
              <h2
                id="picker-sheet-title"
                className="text-[20px] font-black leading-tight tracking-[-0.04em] text-[#111827]"
              >
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-1.5 text-[13px] font-semibold leading-relaxed text-[#6B7280]">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#f6f7fb] text-[20px] font-semibold leading-none text-[#6B7280] transition hover:bg-[#FFF1F4] hover:text-[#ff5f7a] active:scale-[0.97]"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 w-full max-h-full shrink self-start overflow-y-auto overflow-x-hidden overscroll-contain px-[18px] py-5 lg:px-6">
            {children}
          </div>

          {footer ? (
            <div className="mt-auto shrink-0 border-t border-[#eef0f5] bg-white px-[18px] pt-3 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] lg:px-6">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export const pickerSheetPrimaryBtn =
  'flex min-h-12 w-full items-center justify-center rounded-[18px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] text-[15px] font-bold text-white shadow-[0_10px_28px_rgba(255,95,122,0.32)] transition hover:opacity-95 active:scale-[0.98]';
