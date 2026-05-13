import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function AdminBottomSheet({ open, onClose, title, children }: Props) {
  if (!open || typeof document === 'undefined') return null;

  /** Портал в body: иначе fixed внутри max-w-lg + sticky шапка дают «полоску» без затемнения сверху. */
  return createPortal(
    <div className="fixed inset-0 z-[200] flex min-h-dvh w-full flex-col justify-end md:items-center md:justify-center md:p-4">
      <button
        type="button"
        className="absolute inset-0 min-h-dvh w-full bg-black/30"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'admin-sheet-title' : undefined}
        className="relative z-10 mx-auto mt-auto w-full max-w-lg md:mt-0"
      >
        <div className="max-h-[min(88dvh,640px)] overflow-y-auto overscroll-contain rounded-t-[36px] bg-white p-5 shadow-[0_-12px_40px_rgba(17,17,17,0.12)] md:max-h-[85vh] md:rounded-[36px] md:shadow-[0_18px_55px_rgba(17,17,17,0.12)]">
          <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-neutral-200 md:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-3">
            {title ? (
              <h2 id="admin-sheet-title" className="text-[18px] font-semibold tracking-[-0.04em] text-neutral-950">
                {title}
              </h2>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[20px] font-semibold leading-none text-neutral-600 transition active:scale-[0.97]"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
