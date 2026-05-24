import type { ReactNode } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ADMIN_DESKTOP_DRAWER_PANEL, ADMIN_SIDEBAR_OVERLAY_INSET } from '../adminCabinetLayout';
import { adminSheetScrollPad } from './adminCabinetSheetTheme';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** Небольшая плашка над заголовком (без gradient-блока). */
  badge?: string;
  /** Заменяет badge / title / subtitle (например, степпер в шапке). */
  headerContent?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

const BACKDROP_CLOSE_DELAY_MS = 520;

export function AdminBottomSheet({
  open,
  onClose,
  title,
  subtitle,
  badge,
  headerContent,
  children,
  footer,
}: Props) {
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
        className="absolute inset-0 min-h-dvh w-full bg-black/35 backdrop-blur-[3px] transition-opacity lg:bg-black/28"
        aria-label="Закрыть"
        onClick={handleBackdropClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        data-admin-sheet
        aria-labelledby={title ? 'admin-sheet-title' : undefined}
        className={`fixed inset-x-0 bottom-0 z-10 flex max-h-[min(92dvh,720px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-16px_48px_rgba(17,24,39,0.14)] lg:inset-x-auto lg:bottom-0 lg:right-0 lg:top-0 lg:h-dvh lg:max-h-none lg:rounded-none lg:rounded-l-[28px] lg:shadow-[-24px_0_64px_rgba(17,24,39,0.14)] ${ADMIN_DESKTOP_DRAWER_PANEL}`}
      >
        <div className="mx-auto mb-3 mt-3 h-1 w-10 shrink-0 rounded-full bg-[#EAECEF] lg:hidden" aria-hidden />

        <header className="shrink-0 border-b border-[#eef0f5] bg-white px-[18px] py-4 lg:px-8 lg:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 pr-2">
              {headerContent ? (
                headerContent
              ) : (
                <>
                  {badge ? (
                    <p className="inline-flex max-w-full items-center rounded-full bg-[#FFF1F4] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#ff5f7a]">
                      {badge}
                    </p>
                  ) : null}

                  {title ? (
                    <h2
                      id="admin-sheet-title"
                      className={`font-black tracking-[-0.04em] text-[#111827] ${badge ? 'mt-2.5' : ''} text-[20px] leading-tight lg:text-[22px]`}
                    >
                      {title}
                    </h2>
                  ) : null}

                  {subtitle ? (
                    <p className="mt-1.5 max-w-[28rem] text-[13px] font-semibold leading-relaxed text-[#6B7280] lg:text-[14px]">
                      {subtitle}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#f6f7fb] text-[20px] font-semibold leading-none text-[#6B7280] transition hover:bg-[#FFF1F4] hover:text-[#ff5f7a] active:scale-[0.97] lg:h-11 lg:w-11"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col bg-white lg:bg-[#f6f7fb]">
          <div
            data-admin-sheet-scroll
            className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] ${adminSheetScrollPad}`}
          >
            {children}
          </div>

          {footer ? (
            <div className="shrink-0 border-t border-[#eef0f5] bg-white px-[18px] py-4 shadow-[0_-8px_32px_rgba(17,24,39,0.06)] pb-[max(1rem,env(safe-area-inset-bottom,0px))] lg:px-8 lg:py-5">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
