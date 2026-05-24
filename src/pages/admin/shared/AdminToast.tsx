import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiCheckCircle, HiInformationCircle, HiXCircle } from 'react-icons/hi2';
import type { AdminToastState, AdminToastVariant } from './useAdminToast';

const VARIANT_STYLES: Record<
  AdminToastVariant,
  { ring: string; iconBg: string; iconColor: string; label: string }
> = {
  success: {
    ring: 'ring-[#BBF7D0]',
    iconBg: 'bg-[#ECFDF5]',
    iconColor: 'text-[#16A34A]',
    label: 'Готово',
  },
  error: {
    ring: 'ring-[#FECACA]',
    iconBg: 'bg-[#FEF2F2]',
    iconColor: 'text-[#DC2626]',
    label: 'Ошибка',
  },
  info: {
    ring: 'ring-[#FDE8ED]',
    iconBg: 'bg-[#FFF1F4]',
    iconColor: 'text-[#ff5f7a]',
    label: 'Подсказка',
  },
};

function ToastIcon({ variant }: { variant: AdminToastVariant }) {
  const cls = `h-5 w-5 shrink-0 ${VARIANT_STYLES[variant].iconColor}`;
  if (variant === 'error') return <HiXCircle className={cls} aria-hidden />;
  if (variant === 'info') return <HiInformationCircle className={cls} aria-hidden />;
  return <HiCheckCircle className={cls} aria-hidden />;
}

type Props = {
  toast: AdminToastState | null;
  onDismiss?: () => void;
};

export function AdminToast({ toast, onDismiss }: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!toast) {
      setVisible(false);
      return;
    }
    setVisible(false);
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, [toast]);

  if (!mounted || !toast || typeof document === 'undefined') return null;

  const v = VARIANT_STYLES[toast.variant];

  return createPortal(
    <div
      className={`pointer-events-none fixed z-[350] flex justify-center px-4 transition-all duration-300 ease-out max-lg:inset-x-0 max-lg:bottom-[calc(5.75rem+1rem+env(safe-area-inset-bottom,0px))] lg:inset-x-auto lg:bottom-24 lg:right-8 lg:justify-end ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-[min(100%,22rem)] items-start gap-3 rounded-[20px] bg-white px-4 py-3.5 shadow-[0_14px_40px_rgba(17,24,39,0.12)] ring-1 ${v.ring} lg:max-w-sm`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${v.iconBg}`}
        >
          <ToastIcon variant={toast.variant} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">{v.label}</p>
          <p className="mt-0.5 text-[14px] font-semibold leading-snug text-[#111827]">{toast.message}</p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[18px] leading-none text-[#9CA3AF] transition hover:bg-[#f6f7fb] hover:text-[#374151]"
            aria-label="Закрыть"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
