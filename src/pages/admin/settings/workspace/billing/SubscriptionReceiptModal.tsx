import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HiArrowDownTray, HiXMark } from 'react-icons/hi2';
import type { BillingSubscriptionResponse } from '../../../../../features/billing/api/masterBillingApi';
import { billingOutlineBtn, billingPinkBtn } from '../../../billing/adminBillingTheme';
import { settingsCabinetOutlineBtn } from '../settingsCabinetUi';
import { SubscriptionReceiptDocument } from './SubscriptionReceiptDocument';
import {
  buildSubscriptionReceiptDocumentData,
  buildSubscriptionReceiptRows,
  downloadSubscriptionReceiptPdf,
} from './subscriptionReceiptModel';

type Props = {
  open: boolean;
  onClose: () => void;
  billing: BillingSubscriptionResponse;
  uiState: string;
  isProEntitled: boolean;
  planName: string;
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'pink' | 'neutral';
};

function lockBackgroundScroll() {
  const roots: HTMLElement[] = [
    document.documentElement,
    document.body,
    ...Array.from(document.querySelectorAll<HTMLElement>('main.overflow-y-auto')),
  ];

  const prev = roots.map((el) => ({
    el,
    overflow: el.style.overflow,
    overscrollBehavior: el.style.overscrollBehavior,
  }));

  for (const el of roots) {
    el.style.overflow = 'hidden';
    el.style.overscrollBehavior = 'none';
  }

  return () => {
    for (const { el, overflow, overscrollBehavior } of prev) {
      el.style.overflow = overflow;
      el.style.overscrollBehavior = overscrollBehavior;
    }
  };
}

export function SubscriptionReceiptModal({
  open,
  onClose,
  billing,
  uiState,
  isProEntitled,
  planName,
  statusLabel,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const unlockScroll = lockBackgroundScroll();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const blockBackgroundScroll = (event: WheelEvent | TouchEvent) => {
      const scrollEl = scrollRef.current;
      if (scrollEl && event.target instanceof Node && scrollEl.contains(event.target)) {
        return;
      }
      event.preventDefault();
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('wheel', blockBackgroundScroll, { passive: false });
    document.addEventListener('touchmove', blockBackgroundScroll, { passive: false });

    return () => {
      unlockScroll();
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('wheel', blockBackgroundScroll);
      document.removeEventListener('touchmove', blockBackgroundScroll);
    };
  }, [open, onClose]);

  if (!open) return null;

  const rows = buildSubscriptionReceiptRows(uiState, billing, isProEntitled);
  const documentData = buildSubscriptionReceiptDocumentData({
    planName,
    statusLabel,
    rows,
    billing,
    isProEntitled,
    uiState,
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center overflow-hidden p-4 sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 overflow-hidden bg-black/65 backdrop-blur-[2px] overscroll-none" aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-receipt-title"
        className="relative z-10 flex max-h-[min(90vh,40rem)] w-full max-w-[34rem] flex-col overflow-hidden border border-[#E5E5E5] bg-white sm:max-w-[36rem]"
      >
        <div className="flex shrink-0 items-center justify-end border-b border-[#E5E5E5] px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#737373] transition hover:bg-[#F5F5F5] hover:text-[#111827]"
            aria-label="Закрыть"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <span id="subscription-receipt-title" className="sr-only">
            Квитанция о подписке SLOTTY
          </span>
          <SubscriptionReceiptDocument data={documentData} />
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-[#E5E5E5] bg-[#FAFAFA] px-5 py-4 sm:flex-row sm:px-6">
          <button
            type="button"
            onClick={() =>
              downloadSubscriptionReceiptPdf(planName, statusLabel, rows, billing, isProEntitled)
            }
            className={`inline-flex flex-1 items-center justify-center gap-2 ${billingOutlineBtn}`}
          >
            <HiArrowDownTray className="h-4 w-4 shrink-0" aria-hidden />
            Скачать PDF
          </button>
          <button type="button" onClick={onClose} className={`flex-1 ${billingPinkBtn}`}>
            Закрыть
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function SubscriptionDetailsButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${settingsCabinetOutlineBtn} w-full`}>
      Подробнее
    </button>
  );
}
