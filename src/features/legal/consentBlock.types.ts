import type { ConsentAcceptancePayload } from './api/legalApi';

export type ConsentSubmitAction =
  | { type: 'telegram'; initDataRaw: string }
  | { type: 'google'; idToken: string }
  | { type: 'google_pending'; pendingToken: string }
  | { type: 'email_login'; email: string; password: string }
  | { type: 'email_register'; email: string; password: string }
  | { type: 'accept_only' };

export type ConsentBlockState = {
  action: ConsentSubmitAction;
  isNewUser: boolean;
  onSuccess?: () => void;
};

export type ConsentRequiredError = Error & {
  consentRequired?: {
    isNewUser?: boolean;
  };
};

export function isConsentRequiredError(err: unknown): err is ConsentRequiredError {
  return (
    err instanceof Error &&
    Boolean((err as ConsentRequiredError).consentRequired)
  );
}

export type { ConsentAcceptancePayload };
