import { apiFetch, getApiBaseUrl } from '../../../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../../../shared/api/slottyApiErrorMessage';

export type AccountDeletionRequest = {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  message: string;
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
  adminNote: string | null;
};

async function readErr(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export function isAccountDeletionApiAvailable(): boolean {
  return Boolean(getApiBaseUrl());
}

export async function fetchMyAccountDeletionRequest(): Promise<AccountDeletionRequest | null> {
  const res = await apiFetch('/api/me/account-deletion');
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { request: AccountDeletionRequest | null };
  return data.request;
}

export async function createAccountDeletionRequest(payload: {
  message?: string;
  confirmIrreversible: true;
}): Promise<AccountDeletionRequest> {
  const res = await apiFetch('/api/me/account-deletion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { request: AccountDeletionRequest };
  return data.request;
}

export async function cancelAccountDeletionRequest(): Promise<AccountDeletionRequest> {
  const res = await apiFetch('/api/me/account-deletion/cancel', { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
  const data = (await res.json()) as { request: AccountDeletionRequest };
  return data.request;
}
