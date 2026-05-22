import type { ReactNode } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ADMIN_SIDEBAR_OVERLAY_INSET } from '../adminCabinetLayout';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** Жест открытия (touch / синтетический click) часто «пробивает» в только что смонтированный backdrop и мгновенно закрывает шторку. */
const BACKDROP_CLOSE_DELAY_MS = 520;

export function AdminBottomSheet({ open, onClose, title, children }: Props) {
  const suppressBackdropCloseRef = useRef(false);

  /** До отрисовки backdrop: иначе touchend/mouseup от кнопки «Удалить» может сразу закрыть шторку. */
  useLayoutEffect(() => {
    if (!open) return undefined;
    suppressBackdropCloseRef.current = true;
    const id = window.setTimeout(() => {
      suppressBackdropCloseRef.current = false;
    }, BACKDROP_CLOSE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [open]);

  const handleBackdropClose = () => {
    if (suppressBackdropCloseRef.current) return;
    onClose();
  };

  if (!open || typeof document === 'undefined') return null;

  /** Портал в body: на lg+ сдвигаем вправо на ширину sidebar, чтобы модалка была по центру контента. */
  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex min-h-dvh w-full flex-col justify-end md:items-center md:justify-center md:p-4 ${ADMIN_SIDEBAR_OVERLAY_INSET}`}
    >
      <button
        type="button"
        className="absolute inset-0 min-h-dvh w-full bg-black/30"
        aria-label="Закрыть"
        onClick={handleBackdropClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'admin-sheet-title' : undefined}
        className="relative z-10 mx-auto mt-auto w-full max-w-lg md:mt-0 lg:max-w-xl rounded-t-[28px] md:rounded-[24px] shadow-[0_-12px_40px_rgba(17,24,39,0.1)] md:shadow-[0_18px_48px_rgba(17,24,39,0.1)]"
      >
        <div className="overflow-hidden rounded-t-[28px] bg-white md:rounded-[24px]">
          <div className="max-h-[min(88dvh,640px)] overflow-y-auto overflow-x-hidden overscroll-contain px-[18px] pb-5 pt-3 md:max-h-[85vh]">
            <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-[#EAECEF] md:hidden" aria-hidden />
            <div className="flex items-start justify-between gap-3">
              {title ? (
                <h2 id="admin-sheet-title" className="text-[18px] font-semibold tracking-[-0.03em] text-[#111827]">
                  {title}
                </h2>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F7F8] text-[20px] font-semibold leading-none text-[#6B7280] transition hover:bg-[#F3F4F6] active:scale-[0.97]"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="mt-3">{children}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
