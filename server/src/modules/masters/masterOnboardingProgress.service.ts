import type { PoolClient } from 'pg';
import { query } from '../../config/db.js';
import { stepToOnboardingStatus } from './masterOnboardingProgress.merge.js';
import {
  ONBOARDING_STATUSES,
  type MasterOnboardingProgressDto,
  type MasterOnboardingProgressRow,
  type OnboardingCheckoutStatus,
  type OnboardingStatus,
  type OnboardingTariffSelection,
  type PatchMasterOnboardingProgressInput,
} from './masterOnboardingProgress.types.js';

const VALID_STATUSES = new Set<string>(ONBOARDING_STATUSES);
const VALID_TARIFFS = new Set<string>(['basic', 'pro_purchase']);
const VALID_CHECKOUT = new Set<string>(['pending', 'processing', 'paid', 'failed', 'cancelled']);

function clampStep(n: number): number {
  return Math.max(1, Math.min(8, Math.round(n)));
}

function normalizeStatus(raw: string | undefined): OnboardingStatus | undefined {
  if (!raw || !VALID_STATUSES.has(raw)) return undefined;
  return raw as OnboardingStatus;
}

function normalizeTariff(raw: string | null | undefined): OnboardingTariffSelection | null | undefined {
  if (raw === null) return null;
  if (!raw || !VALID_TARIFFS.has(raw)) return undefined;
  return raw as OnboardingTariffSelection;
}

function normalizeCheckout(raw: string | null | undefined): OnboardingCheckoutStatus | null | undefined {
  if (raw === null) return null;
  if (!raw || !VALID_CHECKOUT.has(raw)) return undefined;
  return raw as OnboardingCheckoutStatus;
}

function rowToDto(
  row: MasterOnboardingProgressRow,
  profile: { publication_status: string; is_profile_active: boolean } | null,
  subscriptionActive: boolean,
): MasterOnboardingProgressDto {
  const status = VALID_STATUSES.has(row.onboarding_status)
    ? (row.onboarding_status as OnboardingStatus)
    : 'draft';

  return {
    currentStep: row.current_step,
    furthestStep: row.furthest_step,
    completedSteps: row.completed_steps ?? [],
    onboardingStatus: status,
    selectedTariff:
      row.selected_tariff && VALID_TARIFFS.has(row.selected_tariff)
        ? (row.selected_tariff as OnboardingTariffSelection)
        : null,
    checkoutStatus:
      row.checkout_status && VALID_CHECKOUT.has(row.checkout_status)
        ? (row.checkout_status as OnboardingCheckoutStatus)
        : null,
    checkoutPaymentId: row.checkout_payment_id,
    draftSnapshot: row.draft_snapshot,
    profilePublicationStatus: profile?.publication_status ?? null,
    isProfileActive: profile?.is_profile_active ?? false,
    subscriptionActive,
    updatedAt: row.updated_at.toISOString(),
  };
}

async function querySubscriptionActive(masterId: string): Promise<boolean> {
  const r = await query<{ active: boolean }>(
    `select exists (
       select 1
         from public.master_subscriptions ms
         join public.subscription_plans sp on sp.id = ms.plan_id
        where ms.master_id = $1
          and sp.code = 'pro'
          and ms.status in ('active', 'trialing')
          and ms.current_period_end > now()
     ) as active`,
    [masterId],
  );
  return Boolean(r.rows[0]?.active);
}

async function queryProfile(masterId: string): Promise<{ publication_status: string; is_profile_active: boolean } | null> {
  const r = await query<{ publication_status: string; is_profile_active: boolean }>(
    `select publication_status::text, is_profile_active
       from public.master_profiles
      where master_id = $1`,
    [masterId],
  );
  return r.rows[0] ?? null;
}

async function enrichPendingCheckoutFromBilling(
  masterId: string,
  dto: MasterOnboardingProgressDto,
): Promise<MasterOnboardingProgressDto> {
  if (dto.checkoutPaymentId || dto.onboardingStatus === 'completed') return dto;

  const pending = await query<{
    id: string;
    status: string;
    checkout_purpose: string | null;
  }>(
    `select id, status::text, checkout_purpose
       from public.payments
      where master_id = $1
        and checkout_purpose in ('initial_purchase', 'retry_payment')
        and status = 'pending'::public.payment_status
      order by created_at desc
      limit 1`,
    [masterId],
  );
  const p = pending.rows[0];
  if (!p) return dto;

  return {
    ...dto,
    checkoutPaymentId: p.id,
    checkoutStatus: 'pending',
    onboardingStatus:
      dto.onboardingStatus === 'draft' || dto.onboardingStatus === 'tariff_selected'
        ? 'checkout_pending'
        : dto.onboardingStatus,
  };
}

export async function getMasterOnboardingProgress(masterId: string): Promise<MasterOnboardingProgressDto> {
  const [progressRes, profile, subscriptionActive] = await Promise.all([
    query<MasterOnboardingProgressRow>(
      `select master_id, current_step, furthest_step, completed_steps, onboarding_status,
              selected_tariff, checkout_status, checkout_payment_id, draft_snapshot,
              created_at, updated_at
         from public.master_onboarding_progress
        where master_id = $1`,
      [masterId],
    ),
    queryProfile(masterId),
    querySubscriptionActive(masterId),
  ]);

  const row = progressRes.rows[0];
  if (!row) {
    const empty: MasterOnboardingProgressDto = {
      currentStep: 1,
      furthestStep: 1,
      completedSteps: [],
      onboardingStatus: 'draft',
      selectedTariff: null,
      checkoutStatus: null,
      checkoutPaymentId: null,
      draftSnapshot: null,
      profilePublicationStatus: profile?.publication_status ?? null,
      isProfileActive: profile?.is_profile_active ?? false,
      subscriptionActive,
      updatedAt: new Date().toISOString(),
    };
    return enrichPendingCheckoutFromBilling(masterId, empty);
  }

  let dto = rowToDto(row, profile, subscriptionActive);

  if (subscriptionActive && dto.onboardingStatus !== 'completed') {
    dto = {
      ...dto,
      onboardingStatus:
        dto.isProfileActive
          ? 'completed'
          : dto.onboardingStatus === 'payment_failed'
            ? 'payment_failed'
            : 'subscription_active',
    };
  }

  return enrichPendingCheckoutFromBilling(masterId, dto);
}

export async function upsertMasterOnboardingProgress(
  masterId: string,
  patch: PatchMasterOnboardingProgressInput,
): Promise<MasterOnboardingProgressDto> {
  const status = normalizeStatus(patch.onboardingStatus);
  const tariff = normalizeTariff(patch.selectedTariff);
  const checkout = normalizeCheckout(patch.checkoutStatus);

  const currentStep = patch.currentStep != null ? clampStep(patch.currentStep) : undefined;
  const furthestStep = patch.furthestStep != null ? clampStep(patch.furthestStep) : undefined;

  await query(
    `insert into public.master_onboarding_progress (
       master_id, current_step, furthest_step, completed_steps, onboarding_status,
       selected_tariff, checkout_status, checkout_payment_id, draft_snapshot
     ) values (
       $1,
       coalesce($2, 1),
       coalesce($3, coalesce($2, 1)),
       coalesce($4, '{}'::integer[]),
       coalesce($5, 'draft'),
       $6,
       $7,
       $8,
       $9::jsonb
     )
     on conflict (master_id) do update set
       current_step = coalesce($2, public.master_onboarding_progress.current_step),
       furthest_step = greatest(
         public.master_onboarding_progress.furthest_step,
         coalesce($3, public.master_onboarding_progress.furthest_step),
         coalesce($2, public.master_onboarding_progress.current_step)
       ),
       completed_steps = coalesce($4, public.master_onboarding_progress.completed_steps),
       onboarding_status = coalesce($5, public.master_onboarding_progress.onboarding_status),
       selected_tariff = case when $10 then $6 else public.master_onboarding_progress.selected_tariff end,
       checkout_status = case when $11 then $7 else public.master_onboarding_progress.checkout_status end,
       checkout_payment_id = case when $12 then $8 else public.master_onboarding_progress.checkout_payment_id end,
       draft_snapshot = case when $13 then $9::jsonb else public.master_onboarding_progress.draft_snapshot end,
       updated_at = now()`,
    [
      masterId,
      currentStep ?? null,
      furthestStep ?? null,
      patch.completedSteps ?? null,
      status ?? null,
      tariff === undefined ? null : tariff,
      checkout === undefined ? null : checkout,
      patch.checkoutPaymentId === undefined ? null : patch.checkoutPaymentId,
      patch.draftSnapshot != null ? JSON.stringify(patch.draftSnapshot) : null,
      patch.selectedTariff !== undefined,
      patch.checkoutStatus !== undefined,
      patch.checkoutPaymentId !== undefined,
      patch.draftSnapshot !== undefined,
    ],
  );

  return getMasterOnboardingProgress(masterId);
}

export async function syncOnboardingProgressFromClient(
  masterId: string,
  input: {
    currentStep: number;
    furthestStep: number;
    selectedTariff?: OnboardingTariffSelection | null;
    draftSnapshot?: Record<string, unknown> | null;
  },
): Promise<MasterOnboardingProgressDto> {
  const step = clampStep(input.currentStep);
  const furthest = clampStep(Math.max(input.furthestStep, step));
  return upsertMasterOnboardingProgress(masterId, {
    currentStep: step,
    furthestStep: furthest,
    onboardingStatus: stepToOnboardingStatus(step) as OnboardingStatus,
    selectedTariff: input.selectedTariff,
    draftSnapshot: input.draftSnapshot,
  });
}

export async function markOnboardingAfterComplete(
  masterId: string,
  opts: { proCheckoutIntent: boolean; checkoutPaymentId?: string | null },
): Promise<void> {
  if (opts.proCheckoutIntent) {
    await upsertMasterOnboardingProgress(masterId, {
      currentStep: 8,
      furthestStep: 8,
      onboardingStatus: opts.checkoutPaymentId ? 'checkout_pending' : 'payment_processing',
      selectedTariff: 'pro_purchase',
      checkoutStatus: 'pending',
      checkoutPaymentId: opts.checkoutPaymentId ?? null,
    });
    return;
  }

  await upsertMasterOnboardingProgress(masterId, {
    currentStep: 8,
    furthestStep: 8,
    onboardingStatus: 'ready_to_publish',
    selectedTariff: 'basic',
    checkoutStatus: null,
    checkoutPaymentId: null,
  });
}

export async function markOnboardingPaymentSuccess(masterId: string, paymentId: string): Promise<void> {
  await upsertMasterOnboardingProgress(masterId, {
    onboardingStatus: 'subscription_active',
    selectedTariff: 'pro_purchase',
    checkoutStatus: 'paid',
    checkoutPaymentId: paymentId,
    currentStep: 8,
    furthestStep: 8,
  });
}

export async function markOnboardingPaymentFailed(masterId: string, paymentId: string): Promise<void> {
  await upsertMasterOnboardingProgress(masterId, {
    onboardingStatus: 'payment_failed',
    checkoutStatus: 'failed',
    checkoutPaymentId: paymentId,
  });
}

export async function markOnboardingCheckoutCreated(masterId: string, paymentId: string): Promise<void> {
  await upsertMasterOnboardingProgress(masterId, {
    onboardingStatus: 'checkout_pending',
    selectedTariff: 'pro_purchase',
    checkoutStatus: 'pending',
    checkoutPaymentId: paymentId,
    currentStep: 8,
    furthestStep: 8,
  });
}

export function shouldStartProTrialAfterComplete(proCheckoutIntent: boolean): boolean {
  return !proCheckoutIntent;
}

export async function markOnboardingCompleted(masterId: string): Promise<void> {
  await upsertMasterOnboardingProgress(masterId, {
    onboardingStatus: 'completed',
    currentStep: 8,
    furthestStep: 8,
  });
}

export async function markOnboardingPaymentSuccessWithClient(
  client: PoolClient,
  masterId: string,
  paymentId: string,
): Promise<void> {
  await client.query(
    `insert into public.master_onboarding_progress (
       master_id, current_step, furthest_step, onboarding_status,
       selected_tariff, checkout_status, checkout_payment_id
     ) values ($1, 8, 8, 'subscription_active', 'pro_purchase', 'paid', $2)
     on conflict (master_id) do update set
       onboarding_status = 'subscription_active',
       selected_tariff = 'pro_purchase',
       checkout_status = 'paid',
       checkout_payment_id = $2,
       current_step = 8,
       furthest_step = 8,
       updated_at = now()`,
    [masterId, paymentId],
  );
}
