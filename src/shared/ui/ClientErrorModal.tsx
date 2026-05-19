import { HiExclamationTriangle } from 'react-icons/hi2';

type Props = {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ClientErrorModal({
  open,
  title = 'Не получилось',
  message,
  onClose,
  onRetry,
  retryLabel = 'Повторить',
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 backdrop-blur-[3px] sm:items-center">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="client-error-title"
        aria-describedby="client-error-desc"
        className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(17,24,39,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-b from-[#FFF1F4] to-white px-6 pb-6 pt-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
            <HiExclamationTriangle className="h-8 w-8" aria-hidden />
          </span>
          <h2 id="client-error-title" className="mt-4 text-[22px] font-semibold tracking-[-0.05em] text-[#111827]">
            {title}
          </h2>
          <p id="client-error-desc" className="mt-2 text-[15px] leading-relaxed text-[#6B7280]">
            {message}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {onRetry ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRetry();
                }}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#F47C8C] px-5 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(244,124,140,0.28)] transition active:scale-[0.98] sm:min-w-[9rem]"
              >
                {retryLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className={`flex min-h-12 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-5 text-[15px] font-semibold text-[#111827] transition active:scale-[0.98] sm:min-w-[9rem] ${
                onRetry ? '' : 'sm:mx-auto'
              }`}
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
