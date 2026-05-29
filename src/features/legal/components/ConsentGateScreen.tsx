import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ConsentAcceptancePayload } from '../api/legalApi';
import { SIGNUP_CONSENT_CHECKBOXES } from '../../../shared/legal/legalConfig';

type Props = {
  busy?: boolean;
  error?: string | null;
  onSubmit: (consents: ConsentAcceptancePayload[]) => void | Promise<void>;
};

export function ConsentGateScreen({ busy = false, error, onSubmit }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = useMemo(
    () => SIGNUP_CONSENT_CHECKBOXES.every((item) => checked[item.documentKey]),
    [checked],
  );

  const toggle = useCallback((key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!allChecked || busy) return;
    const consents: ConsentAcceptancePayload[] = SIGNUP_CONSENT_CHECKBOXES.map((item) => ({
      documentKey: item.documentKey,
      version: 1,
    }));
    void onSubmit(consents);
  }, [allChecked, busy, onSubmit]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
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
            Для использования SLOTTY нужно принять актуальные условия и согласия. Полные тексты — по ссылкам
            ниже.
          </p>

          <ul className="mt-5 space-y-4">
            {SIGNUP_CONSENT_CHECKBOXES.map((item) => (
              <li key={item.documentKey}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 rounded border-[#D1D5DB] accent-[#111827]"
                    checked={Boolean(checked[item.documentKey])}
                    disabled={busy}
                    onChange={() => toggle(item.documentKey)}
                  />
                  <span className="text-[14px] leading-snug text-[#374151]">
                    {item.textBefore}
                    <Link
                      to={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#E29595] underline-offset-2 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.linkLabel}
                    </Link>
                    {item.textAfter}
                  </span>
                </label>
              </li>
            ))}
          </ul>

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
    </div>
  );
}
