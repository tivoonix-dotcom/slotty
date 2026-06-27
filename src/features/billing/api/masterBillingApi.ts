import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';
import type { MasterSubscriptionDto } from '../../admin/api/adminBillingApi';
import type { BillingPackageMonths } from '../billingCopy';

async function readErr(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

export type SubscriptionUiState =
  | 'free'
  | 'pro_active'
  | 'pro_canceled_at_period_end'
  | 'past_due'
  | 'expired';

export type BillingAction =
  | 'connect_pro'
  | 'manual_topup'
  | 'cancel_auto_renew'
  | 'resume_auto_renew'
  | 'update_payment_method'
  | 'delete_payment_method'
  | 'retry_payment'
  | 'view_payment_history'
  | 'download_receipt';

export type BillingPaymentDto = {
  id: string;
  paymentId: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentKind: string;
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  receiptUrl: string | null;
  invoiceNumber: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  createdAt: string;
};

export type BillingSubscriptionResponse = {
  subscription: MasterSubscriptionDto;
  uiState: SubscriptionUiState;
  isProEntitled: boolean;
  planCode: string;
  status: string;
  billingPeriod: 'month' | 'year';
  priceAmount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextChargeAt: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  cardExpMonth: number | null;
  cardExpYear: number | null;
  availableActions: BillingAction[];
  limits: {
    maxServices: number | null;
    maxMonthlyAppointments: number | null;
    maxScheduleDaysAhead: number;
  };
  lastPayment: BillingPaymentDto | null;
  nextPaymentHint: string | null;
  autoRenewCapable: boolean;
  autoRenewLegalAllowed: boolean;
  autoRenewEnabled: boolean;
  billingPackageMonths?: BillingPackageMonths;
};

export type PaymentStatusDto = {
  id: string;
  status: string;
  checkoutPurpose: string | null;
};

export async function getBillingSubscription(): Promise<BillingSubscriptionResponse> {
  const res = await apiFetch('/api/billing/subscription');
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { billing: BillingSubscriptionResponse };
  return j.billing;
}

export async function listBillingPayments(limit = 25): Promise<BillingPaymentDto[]> {
  const res = await apiFetch(`/api/billing/payments?limit=${limit}`);
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { payments: BillingPaymentDto[] };
  return j.payments ?? [];
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentStatusDto> {
  const res = await apiFetch(`/api/payments/${paymentId}`);
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { payment: PaymentStatusDto & { checkoutPurpose?: string | null } };
  return {
    id: j.payment.id,
    status: j.payment.status,
    checkoutPurpose: j.payment.checkoutPurpose ?? null,
  };
}

export async function createBillingCheckout(input: {
  billingPackageMonths: BillingPackageMonths;
  returnUrl?: string;
  consentAccepted: true;
}): Promise<{ paymentUrl: string; paymentId: string }> {
  const res = await apiFetch('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({
      plan: 'MASTER_PRO',
      billingPackageMonths: input.billingPackageMonths,
      returnUrl: input.returnUrl,
      consentAccepted: input.consentAccepted,
    }),
  });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { paymentUrl: string; paymentId: string };
}

export async function createManualTopupCheckout(input: {
  billingPackageMonths: BillingPackageMonths;
  returnUrl?: string;
}): Promise<{ paymentUrl: string; paymentId: string }> {
  const res = await apiFetch('/api/billing/topup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { paymentUrl: string; paymentId: string };
}

export async function cancelSubscriptionAutoRenew(reason?: string): Promise<BillingSubscriptionResponse> {
  const res = await apiFetch('/api/billing/cancel-subscription', {
    method: 'POST',
    body: JSON.stringify({ reason: reason ?? null }),
  });
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { billing: BillingSubscriptionResponse };
  return j.billing;
}

export async function resumeSubscriptionAutoRenew(): Promise<BillingSubscriptionResponse> {
  const res = await apiFetch('/api/billing/resume-subscription', { method: 'POST', body: '{}' });
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { billing: BillingSubscriptionResponse };
  return j.billing;
}

export async function updatePaymentMethodCheckout(returnUrl?: string): Promise<{ paymentUrl: string; paymentId: string }> {
  const res = await apiFetch('/api/billing/update-payment-method', {
    method: 'POST',
    body: JSON.stringify({ returnUrl }),
  });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { paymentUrl: string; paymentId: string };
}

export async function deletePaymentMethod(): Promise<BillingSubscriptionResponse> {
  const res = await apiFetch('/api/billing/payment-method', { method: 'DELETE' });
  if (!res.ok) throw new Error(await readErr(res));
  const j = (await res.json()) as { billing: BillingSubscriptionResponse };
  return j.billing;
}

export async function retrySubscriptionPayment(returnUrl?: string): Promise<{ paymentUrl: string; paymentId: string }> {
  const res = await apiFetch('/api/billing/retry-payment', {
    method: 'POST',
    body: JSON.stringify({ returnUrl }),
  });
  if (!res.ok) throw new Error(await readErr(res));
  return (await res.json()) as { paymentUrl: string; paymentId: string };
}
