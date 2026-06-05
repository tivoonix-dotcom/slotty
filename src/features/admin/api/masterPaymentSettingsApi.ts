import { apiFetch } from '../../../shared/api/backendClient';
import type { MasterPaymentSettingsDto } from '../../../shared/payments/paymentMethodCodes';

async function readApiError(res: Response): Promise<string> {
  const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return j?.error?.message ?? `Ошибка ${res.status}`;
}

export async function fetchMyPaymentSettings(): Promise<MasterPaymentSettingsDto> {
  const res = await apiFetch('/api/masters/me/payment-settings');
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as MasterPaymentSettingsDto;
}

export async function patchMyPaymentSettings(
  payload: Partial<Omit<MasterPaymentSettingsDto, 'warning'>>,
): Promise<MasterPaymentSettingsDto> {
  const res = await apiFetch('/api/masters/me/payment-settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as MasterPaymentSettingsDto;
}
