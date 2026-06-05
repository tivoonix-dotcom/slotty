import {
  LEGAL_CONSENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_TERMS_PATH,
} from '../app/paths';
import type { LegalDocId } from './legalDocuments';

/** Маршруты на отдельные legal-страницы (не встроенный просмотр в настройках). */
export function getLegalDocumentPagePath(id: LegalDocId): string {
  switch (id) {
    case 'terms':
      return LEGAL_TERMS_PATH;
    case 'privacy':
    case 'personal_data_policy':
      return LEGAL_PRIVACY_PATH;
    case 'consent':
      return LEGAL_CONSENT_PATH;
    case 'service_rules':
      return LEGAL_TERMS_PATH;
    default:
      return LEGAL_TERMS_PATH;
  }
}
