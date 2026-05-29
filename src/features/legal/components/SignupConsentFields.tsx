import {
  LEGAL_DOCUMENT_VERSION,
  SIGNUP_CONSENT_CHECKBOXES,
} from '../../../shared/legal/legalConfig';
import type { ConsentAcceptancePayload } from '../api/legalApi';

type Props = {
  checked: Record<string, boolean>;
  onToggle: (documentKey: string) => void;
  disabled?: boolean;
  compact?: boolean;
};

export function buildSignupConsentPayload(): ConsentAcceptancePayload[] {
  return SIGNUP_CONSENT_CHECKBOXES.map((item) => ({
    documentKey: item.documentKey,
    version: LEGAL_DOCUMENT_VERSION,
  }));
}

export function allSignupConsentsChecked(checked: Record<string, boolean>): boolean {
  return SIGNUP_CONSENT_CHECKBOXES.every((item) => checked[item.documentKey]);
}

export function SignupConsentFields({ checked, onToggle, disabled = false, compact = false }: Props) {
  return (
    <ul className={compact ? 'space-y-3' : 'space-y-3.5'}>
      {SIGNUP_CONSENT_CHECKBOXES.map((item) => (
        <li key={item.documentKey}>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D1D5DB] accent-[#111827]"
              checked={Boolean(checked[item.documentKey])}
              disabled={disabled}
              onChange={() => onToggle(item.documentKey)}
            />
            <span className={`leading-snug text-[#374151] ${compact ? 'text-[13px]' : 'text-[14px]'}`}>
              {item.textBefore}
              <a
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#E29595] underline-offset-2 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {item.linkLabel}
              </a>
              {item.textAfter}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
