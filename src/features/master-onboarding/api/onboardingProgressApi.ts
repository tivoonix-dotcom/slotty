import { apiFetch } from '../../../shared/api/backendClient';

export type OnboardingProgressDto = {
  currentStep: number;
  furthestStep: number;
  completedSteps: number[];
  onboardingStatus: string;
  selectedTariff: 'basic' | 'pro_purchase' | null;
  checkoutStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | null;
  checkoutPaymentId: string | null;
  draftSnapshot: Record<string, unknown> | null;
  profilePublicationStatus: string | null;
  isProfileActive: boolean;
  subscriptionActive: boolean;
  updatedAt: string;
};

async function readApiError(res: Response): Promise<string> {
  const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return j?.error?.message ?? `Ошибка ${res.status}`;
}

export async function fetchMasterOnboardingProgress(): Promise<OnboardingProgressDto | null> {
  const res = await apiFetch('/api/masters/me/onboarding-progress');
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await readApiError(res));
  const d = (await res.json()) as { progress?: OnboardingProgressDto };
  return d.progress ?? null;
}

export type PatchOnboardingProgressBody = {
  currentStep?: number;
  furthestStep?: number;
  selectedTariff?: 'basic' | 'pro_purchase' | null;
  draftSnapshot?: Record<string, unknown> | null;
};

export async function patchMasterOnboardingProgress(
  body: PatchOnboardingProgressBody,
): Promise<OnboardingProgressDto> {
  const res = await apiFetch('/api/masters/me/onboarding-progress', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  const d = (await res.json()) as { progress?: OnboardingProgressDto };
  if (!d.progress) throw new Error('Пустой ответ сервера');
  return d.progress;
}
