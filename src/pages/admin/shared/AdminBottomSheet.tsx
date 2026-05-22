import type { ReactNode } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ADMIN_DESKTOP_DRAWER_PANEL, ADMIN_SIDEBAR_OVERLAY_INSET } from '../adminCabinetLayout';

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

  return createPortal(
    <div className={`fixed inset-0 z-[200] ${ADMIN_SIDEBAR_OVERLAY_INSET}`}>
      <button
        type="button"
        className="absolute inset-0 min-h-dvh w-full bg-black/30 transition-opacity"
        aria-label="Закрыть"
        onClick={handleBackdropClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'admin-sheet-title' : undefined}
        className={`fixed inset-x-0 bottom-0 z-10 flex max-h-[min(88dvh,640px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(17,24,39,0.12)] lg:inset-x-auto lg:bottom-0 lg:right-0 lg:top-0 lg:h-dvh lg:max-h-none lg:rounded-none lg:rounded-l-[24px] lg:shadow-[-16px_0_48px_rgba(17,24,39,0.14)] ${ADMIN_DESKTOP_DRAWER_PANEL}`}
      >
        <div className="mx-auto mb-3 mt-3 h-1 w-10 shrink-0 rounded-full bg-[#EAECEF] lg:hidden" aria-hidden />

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#eef0f5] px-[18px] py-4 lg:px-8">
          {title ? (
            <h2
              id="admin-sheet-title"
              className="text-[18px] font-semibold tracking-[-0.03em] text-[#111827] lg:text-[20px]"
            >
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

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-[18px] pb-8 pt-4 lg:px-8 lg:pb-10">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
