import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ConsentAcceptancePayload } from '../api/legalApi';
import {
  SignupConsentFields,
  allSignupConsentsChecked,
  buildSignupConsentPayload,
} from './SignupConsentFields';

type Props = {
  busy?: boolean;
  error?: string | null;
  onSubmit: (consents: ConsentAcceptancePayload[]) => void | Promise<void>;
};

export function ConsentGateScreen({ busy = false, error, onSubmit }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = useMemo(() => allSignupConsentsChecked(checked), [checked]);

  const toggle = useCallback((key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!allChecked || busy) return;
    void onSubmit(buildSignupConsentPayload());
  }, [allChecked, busy, onSubmit]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-gate-title"
    >
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
        <div className="overflow-y-auto px-5 pb-6 pt-6 sm:px-6">
          <h1 id="consent-gate-title" className="text-[20px] font-bold leading-snug text-[#111827]">
            Перед продолжением примите документы
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            Для использования SLOTTY нужно принять актуальные условия и согласия. Полные тексты — по
            ссылкам ниже.
          </p>

          <div className="mt-5">
            <SignupConsentFields checked={checked} onToggle={toggle} disabled={busy} />
          </div>

          {error ? (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">{error}</p>
          ) : null}
        </div>

        <div className="border-t border-[#EAECEF] px-5 py-4 sm:px-6">
          <button
            type="button"
            disabled={!allChecked || busy}
            onClick={handleSubmit}
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#111827] text-[15px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Сохраняем…' : 'Продолжить'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
