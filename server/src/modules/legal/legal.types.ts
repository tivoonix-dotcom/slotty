export type LegalDocumentKey =
  | 'terms'
  | 'privacy'
  | 'personal_data_consent'
  | 'cross_border_consent'
  | 'master_terms';

export type ConsentSource = 'telegram' | 'google' | 'email' | 'web';

export type ConsentAcceptanceInput = {
  documentKey: string;
  version: number;
};

export type LegalDocumentPublic = {
  documentKey: LegalDocumentKey;
  version: number;
  title: string;
  effectiveFrom: string;
};

export type ConsentMeta = {
  source: ConsentSource;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/** Required before first login / account activation. */
export const REQUIRED_SIGNUP_CONSENT_KEYS: LegalDocumentKey[] = [
  'terms',
  'privacy',
  'personal_data_consent',
  'cross_border_consent',
];

/** Required when starting master onboarding (in addition to signup consents). */
export const REQUIRED_MASTER_CONSENT_KEYS: LegalDocumentKey[] = ['master_terms'];

export const LEGAL_DOCUMENT_PATHS: Record<LegalDocumentKey, string> = {
  terms: '/legal/terms',
  privacy: '/legal/privacy',
  personal_data_consent: '/legal/consent',
  cross_border_consent: '/legal/cross-border',
  master_terms: '/legal/master-terms',
};
