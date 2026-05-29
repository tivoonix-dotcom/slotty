/** Signup consent document keys (must match backend `legal.types.ts`). */
export type SignupConsentDocumentKey =
  | 'terms'
  | 'privacy'
  | 'personal_data_consent'
  | 'cross_border_consent';

export type LegalDocumentPublic = {
  documentKey: SignupConsentDocumentKey | 'master_terms';
  version: number;
  title: string;
  effectiveFrom: string;
  path: string;
};

export const SIGNUP_CONSENT_CHECKBOXES: {
  documentKey: SignupConsentDocumentKey;
  textBefore: string;
  linkLabel: string;
  textAfter: string;
  path: string;
}[] = [
  {
    documentKey: 'terms',
    textBefore: 'Я принимаю ',
    linkLabel: 'Пользовательское соглашение',
    textAfter: '.',
    path: '/legal/terms',
  },
  {
    documentKey: 'privacy',
    textBefore: 'Я ознакомлен(а) с ',
    linkLabel: 'Политикой обработки персональных данных',
    textAfter: '.',
    path: '/legal/privacy',
  },
  {
    documentKey: 'personal_data_consent',
    textBefore: 'Я даю ',
    linkLabel: 'согласие на обработку персональных данных',
    textAfter: '.',
    path: '/legal/consent',
  },
  {
    documentKey: 'cross_border_consent',
    textBefore: 'Я даю ',
    linkLabel: 'согласие на трансграничную передачу персональных данных',
    textAfter:
      ' (если серверы или сервисы обработки находятся за пределами Республики Беларусь).',
    path: '/legal/cross-border',
  },
];

export const LEGAL_DOCUMENT_VERSION = 1;
export const LEGAL_EFFECTIVE_FROM = '2026-01-01';
