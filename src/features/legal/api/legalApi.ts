import { apiFetch } from '../../../shared/api/backendClient';
import type { LegalDocumentPublic } from '../../../shared/legal/legalConfig';

export type ConsentAcceptancePayload = {
  documentKey: string;
  version: number;
};

export type ConsentRequiredDetails = {
  isNewUser?: boolean;
  requiredDocuments?: LegalDocumentPublic[];
  missingDocumentKeys?: string[];
};

export async function fetchLegalDocuments(): Promise<LegalDocumentPublic[]> {
  const res = await apiFetch('/api/legal/documents', { skipAuth: true });
  if (!res.ok) return [];
  const data = (await res.json()) as { documents?: LegalDocumentPublic[] };
  return data.documents ?? [];
}

export async function acceptConsentsAuthenticated(
  consents: ConsentAcceptancePayload[],
): Promise<void> {
  const res = await apiFetch('/api/auth/consents/accept', {
    method: 'POST',
    body: JSON.stringify({ consents }),
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(j?.error?.message?.trim() || 'Не удалось сохранить согласия');
  }
}

export function parseConsentRequiredDetails(payload: unknown): ConsentRequiredDetails | null {
  if (!payload || typeof payload !== 'object') return null;
  const err = payload as { error?: { code?: string; details?: ConsentRequiredDetails } };
  if (err.error?.code !== 'CONSENT_REQUIRED') return null;
  return err.error.details ?? {};
}

export async function readApiErrorWithConsent(res: Response): Promise<{
  message: string;
  consentRequired: ConsentRequiredDetails | null;
}> {
  const j = (await res.json().catch(() => null)) as {
    error?: { message?: string; code?: string; details?: ConsentRequiredDetails };
  } | null;
  const consentRequired =
    j?.error?.code === 'CONSENT_REQUIRED' ? (j.error.details ?? {}) : null;
  return {
    message: j?.error?.message?.trim() || `Ошибка ${res.status}`,
    consentRequired,
  };
}
