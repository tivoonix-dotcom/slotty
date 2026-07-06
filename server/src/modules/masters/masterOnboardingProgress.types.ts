/** Статусы онбординга мастера (серверный state machine). */
export const ONBOARDING_STATUSES = [
  'draft',
  'profile_started',
  'services_added',
  'schedule_added',
  'tariff_selected',
  'checkout_pending',
  'payment_processing',
  'payment_failed',
  'subscription_active',
  'ready_to_publish',
  'completed',
] as const;

export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export type OnboardingTariffSelection = 'basic' | 'pro_purchase';

export type OnboardingCheckoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';

export type MasterOnboardingProgressRow = {
  master_id: string;
  current_step: number;
  furthest_step: number;
  completed_steps: number[];
  onboarding_status: string;
  selected_tariff: string | null;
  checkout_status: string | null;
  checkout_payment_id: string | null;
  draft_snapshot: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

export type MasterOnboardingProgressDto = {
  currentStep: number;
  furthestStep: number;
  completedSteps: number[];
  onboardingStatus: OnboardingStatus;
  selectedTariff: OnboardingTariffSelection | null;
  checkoutStatus: OnboardingCheckoutStatus | null;
  checkoutPaymentId: string | null;
  draftSnapshot: Record<string, unknown> | null;
  profilePublicationStatus: string | null;
  isProfileActive: boolean;
  subscriptionActive: boolean;
  updatedAt: string;
};

export type PatchMasterOnboardingProgressInput = {
  currentStep?: number;
  furthestStep?: number;
  completedSteps?: number[];
  onboardingStatus?: OnboardingStatus;
  selectedTariff?: OnboardingTariffSelection | null;
  checkoutStatus?: OnboardingCheckoutStatus | null;
  checkoutPaymentId?: string | null;
  draftSnapshot?: Record<string, unknown> | null;
};
