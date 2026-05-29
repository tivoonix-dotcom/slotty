import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BillingPeriod } from '../../../features/billing/model/masterPlans';
import type { MasterSubscriptionDto } from '../../../features/admin/api/adminBillingApi';
import {
  createProManualPaymentRequest,
  getProManualPaymentState,
  todayIsoDate,
  uploadProPaymentReceipt,
  type ManualPaymentConfigDto,
  type ProManualPaymentCabinetState,
  type ProManualPaymentRequestDto,
} from '../../../features/billing/api/proPaymentRequestApi';
import { billingSoftNote } from './adminBillingTheme';
import {
  catalogSheetField,
  catalogSheetGhostBtn,
  catalogSheetLabel,
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from '../shared/adminCatalogSheetTheme';

type Props = {
  billingPeriod: BillingPeriod;
  subscription: MasterSubscriptionDto | null;
  showMockDemo: boolean;
  onBack: () => void;
  onMockDemo?: () => void | Promise<void>;
  onSubmitted?: () => void;
};

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

async function copyText(value: string, setLabel: (v: string) => void) {
  try {
    await navigator.clipboard.writeText(value);
    setLabel('Скопировано');
    window.setTimeout(() => setLabel('Копировать'), 1500);
  } catch {
    setLabel('Не удалось');
  }
}

function CopyButton({ value }: { value: string }) {
  const [label, setLabel] = useState('Копировать');
  return (
    <button
      type="button"
      onClick={() => void copyText(value, setLabel)}
      className={catalogSheetGhostBtn}
    >
      {label}
    </button>
  );
}

function RequisiteRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#F3F4F6] py-2 last:border-0">
      <div className="min-w-0">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">{label}</p>
        <p className="mt-0.5 break-all text-[14px] font-semibold text-[#111827]">{value}</p>
      </div>
      {copyValue ? <CopyButton value={copyValue} /> : null}
    </div>
  );
}

function RequisitesBlock({ config }: { config: ManualPaymentConfigDto }) {
  if (!config.configured) {
    return (
      <div className="rounded-[18px] bg-[#FEF2F2] px-4 py-4 ring-1 ring-[#FECACA]">
        <p className="text-[14px] font-semibold text-[#991B1B]">
          {config.configMessage ?? 'Реквизиты временно недоступны'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] bg-white p-4 ring-1 ring-[#EEEEEE]">
      <p className="text-[13px] font-semibold text-[#111827]">Реквизиты для оплаты</p>
      <RequisiteRow label="Получатель" value={config.recipientFullName} />
      <RequisiteRow label="Банк" value={config.bankName} />
      <RequisiteRow label="IBAN" value={config.iban ?? '—'} copyValue={config.iban ?? undefined} />
      <RequisiteRow label="BIC/SWIFT" value={config.bic} copyValue={config.bic} />
      <RequisiteRow label="Валюта" value={config.currency} />
      <RequisiteRow label="Сумма" value={formatMoney(config.proAmount, config.currency)} />
      <RequisiteRow
        label="Назначение платежа"
        value={config.paymentPurpose}
        copyValue={config.paymentPurpose}
      />
    </div>
  );
}

function PaymentFormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={catalogSheetLabel}>
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}

function ReceiptFilePicker({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="mt-1.5 rounded-[10px] bg-[#EBEBEB] px-3 py-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`${catalogSheetGhostBtn} shrink-0`}
        >
          {file ? 'Заменить файл' : 'Выбрать файл'}
        </button>
        <p className="min-w-0 text-[13px] leading-snug text-[#6B7280]">
          {file ? (
            <span className="font-semibold text-[#111827]">{file.name}</span>
          ) : (
            'JPEG, PNG, WebP или PDF · до 5 МБ · необязательно'
          )}
        </p>
        {file ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="shrink-0 text-[13px] font-semibold text-[#F47C8C] hover:underline"
          >
            Убрать
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PaymentConsentCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[12px] bg-[#FAFAFA] px-3 py-3 ring-1 ring-[#F3F4F6] transition hover:bg-[#F5F5F5]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-[5px] border-[#D1D5DB] accent-[#F47C8C]"
      />
      <span className="text-[13px] leading-snug text-[#374151]">{children}</span>
    </label>
  );
}

function PendingBlock({ request }: { request: ProManualPaymentRequestDto }) {
  return (
    <div className="space-y-3 rounded-[18px] bg-[#FFFBEB] px-4 py-4 ring-1 ring-[#FDE68A]">
      <p className="text-[15px] font-bold text-[#92400E]">Заявка на проверке</p>
      <p className="text-[14px] leading-relaxed text-[#78350F]">
        Мы проверяем оплату и активируем Pro после подтверждения.
      </p>
      <p className="text-[13px] text-[#78350F]">
        Отправлено: {formatDate(request.createdAt)} · {formatMoney(request.declaredPaidAmount, request.currency)}
      </p>
      <p className="text-[13px] text-[#78350F]">{request.paymentComment}</p>
      <p className="text-[13px] text-[#92400E]">
        Если вы ошиблись, дождитесь проверки или обратитесь в поддержку.
      </p>
    </div>
  );
}

function RejectedBlock({ request }: { request: ProManualPaymentRequestDto }) {
  return (
    <div className="space-y-2 rounded-[18px] bg-[#FEF2F2] px-4 py-4 ring-1 ring-[#FECACA]">
      <p className="text-[15px] font-bold text-[#991B1B]">Заявка отклонена</p>
      {request.rejectionReason ? (
        <p className="text-[14px] leading-relaxed text-[#7F1D1D]">
          Причина: {request.rejectionReason}
        </p>
      ) : null}
    </div>
  );
}

export function ProManualPaymentSheet({
  billingPeriod,
  subscription,
  showMockDemo,
  onBack,
  onMockDemo,
  onSubmitted,
}: Props) {
  const [state, setState] = useState<ProManualPaymentCabinetState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [payerFullName, setPayerFullName] = useState('');
  const [declaredPaidAmount, setDeclaredPaidAmount] = useState('');
  const [paidAt, setPaidAt] = useState(todayIsoDate());
  const [paymentComment, setPaymentComment] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [confirmManualReview, setConfirmManualReview] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const next = await getProManualPaymentState(billingPeriod);
      setState(next);
      if (next.canSubmitNew && !next.pendingRequest) {
        setDeclaredPaidAmount(String(next.paymentConfig.proAmount));
        setPaymentComment(next.paymentConfig.paymentPurpose);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить данные оплаты');
    } finally {
      setLoading(false);
    }
  }, [billingPeriod]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const config = state?.paymentConfig;
  const pending = state?.pendingRequest;
  const lastRejected =
    state?.lastResolvedRequest?.status === 'rejected' ? state.lastResolvedRequest : null;
  const proStatus = state?.proStatus ?? 'free';
  const canShowForm = Boolean(state?.canSubmitNew && !pending && config?.configured);

  const formValid = useMemo(() => {
    const amount = Number(declaredPaidAmount.replace(',', '.'));
    return (
      payerFullName.trim().length >= 2 &&
      Number.isFinite(amount) &&
      amount > 0 &&
      paidAt.trim().length === 10 &&
      paymentComment.trim().length >= 5 &&
      confirmPaid &&
      confirmManualReview
    );
  }, [confirmManualReview, confirmPaid, declaredPaidAmount, paidAt, payerFullName, paymentComment]);

  const proExpiresLabel = formatDate(state?.proExpiresAt ?? subscription?.currentPeriodEnd ?? null);
  const isActivePro = proStatus === 'active';
  const isExpiredPro = proStatus === 'expired';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state || !canShowForm || !formValid) return;
    const amount = Number(declaredPaidAmount.replace(',', '.'));
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      let receiptFilePath: string | null = null;
      let receiptUrl: string | null = null;
      if (receiptFile) {
        const uploaded = await uploadProPaymentReceipt(receiptFile);
        receiptFilePath = uploaded.storagePath;
        receiptUrl = uploaded.publicUrl;
      }
      await createProManualPaymentRequest({
        payerFullName: payerFullName.trim(),
        declaredPaidAmount: amount,
        billingPeriod,
        paidAt: paidAt.trim(),
        paymentComment: paymentComment.trim(),
        receiptUrl,
        receiptFilePath,
        confirmationChecked: true,
      });
      setSubmitSuccess(true);
      setConfirmPaid(false);
      setConfirmManualReview(false);
      setReceiptFile(null);
      await reload();
      onSubmitted?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Не удалось отправить заявку');
    } finally {
      setSubmitting(false);
    }
  }

  const periodUnit = billingPeriod === 'year' ? 'год' : 'месяц';
  const amountLabel = config ? `${config.proAmount} ${config.currency} / ${periodUnit}` : '30 BYN / месяц';

  return (
    <div className="space-y-4">
      <h3 className="text-[18px] font-bold text-[#111827]">Оплата Pro по реквизитам</h3>

      {loading ? <p className="text-[14px] text-[#6B7280]">Загрузка…</p> : null}
      {loadError ? (
        <p className="rounded-[18px] bg-[#FEF2F2] px-4 py-3 text-[14px] text-[#DC2626]">{loadError}</p>
      ) : null}

      {!loading && !loadError && state && config ? (
        <>
          {isActivePro && proExpiresLabel ? (
            <p className="rounded-[18px] bg-[#ECFDF5] px-4 py-3 text-[14px] font-semibold text-[#047857] ring-1 ring-[#A7F3D0]">
              Pro активен до {proExpiresLabel}
            </p>
          ) : null}

          {isExpiredPro ? (
            <div className="space-y-2 rounded-[18px] bg-[#FEF2F2] px-4 py-4 ring-1 ring-[#FECACA]">
              <p className="text-[15px] font-bold text-[#991B1B]">Pro истёк</p>
              {proExpiresLabel ? (
                <p className="text-[14px] text-[#7F1D1D]">Срок действия истёк {proExpiresLabel}</p>
              ) : null}
              <p className="text-[14px] text-[#7F1D1D]">Оплатите Pro по реквизитам и отправьте заявку на продление.</p>
            </div>
          ) : null}

          {!isActivePro ? (
            <>
              <div className="space-y-2">
                <p className="text-[16px] font-bold text-[#111827]">Стоимость Pro: {amountLabel}</p>
                <p className="text-[14px] leading-relaxed text-[#374151]">
                  Оплатите тариф по реквизитам ниже. Если при переводе банк удержит комиссию, SLOTTY берёт
                  комиссию на себя.
                </p>
                <p className="text-[14px] leading-relaxed text-[#374151]">
                  После оплаты отправьте заявку на проверку. Pro активируется только после подтверждения
                  оплаты администратором.
                </p>
              </div>

              <RequisitesBlock config={config} />

              <p className={billingSoftNote}>
                После оплаты отправьте заявку. Мы проверим поступление и активируем Pro вручную.
              </p>
            </>
          ) : null}

          {submitSuccess ? (
            <p className="rounded-[18px] bg-[#ECFDF5] px-4 py-3 text-[14px] font-semibold text-[#047857] ring-1 ring-[#A7F3D0]">
              Заявка отправлена на проверку. Мы проверим поступление оплаты и активируем Pro вручную.
            </p>
          ) : null}

          {pending ? <PendingBlock request={pending} /> : null}
          {lastRejected && !pending ? <RejectedBlock request={lastRejected} /> : null}

          {canShowForm && !isActivePro ? (
            <form
              className="space-y-4 rounded-[20px] bg-white p-4 ring-1 ring-[#EEEEEE]"
              onSubmit={(e) => void handleSubmit(e)}
            >
              <p className="text-[15px] font-bold tracking-[-0.02em] text-[#111827]">Заявка «Я оплатил»</p>

              <PaymentFormField label="ФИО плательщика" required>
                <input
                  required
                  value={payerFullName}
                  onChange={(e) => setPayerFullName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className={`${catalogSheetField} mt-1.5`}
                  maxLength={200}
                />
              </PaymentFormField>

              <PaymentFormField label="Сумма, которую вы отправили" required>
                <input
                  required
                  inputMode="decimal"
                  value={declaredPaidAmount}
                  onChange={(e) => setDeclaredPaidAmount(e.target.value)}
                  className={`${catalogSheetField} mt-1.5`}
                />
              </PaymentFormField>

              <PaymentFormField label="Дата оплаты" required>
                <input
                  required
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className={`${catalogSheetField} mt-1.5`}
                />
              </PaymentFormField>

              <PaymentFormField label="Комментарий / назначение платежа" required>
                <textarea
                  required
                  value={paymentComment}
                  onChange={(e) => setPaymentComment(e.target.value)}
                  rows={3}
                  placeholder="Например: Оплата Pro SLOTTY, Иванов Иван, +375 XX XXX-XX-XX"
                  className={`${catalogSheetField} mt-1.5 resize-none`}
                  maxLength={4000}
                />
              </PaymentFormField>

              <div>
                <span className={catalogSheetLabel}>Скрин/чек оплаты</span>
                <ReceiptFilePicker file={receiptFile} onChange={setReceiptFile} />
              </div>

              <div className="space-y-2.5">
                <PaymentConsentCheckbox checked={confirmPaid} onChange={setConfirmPaid}>
                  Я подтверждаю, что оплатил тариф и отправляю заявку на ручную проверку
                </PaymentConsentCheckbox>
                <PaymentConsentCheckbox checked={confirmManualReview} onChange={setConfirmManualReview}>
                  Я понимаю, что Pro активируется только после проверки оплаты администратором
                </PaymentConsentCheckbox>
              </div>

              {submitError ? (
                <p className="rounded-[10px] bg-[#FEF2F2] px-3 py-2 text-[13px] font-medium text-[#DC2626]">
                  {submitError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting || !formValid}
                className={`${catalogSheetPrimaryBtn} min-h-12 w-full disabled:cursor-not-allowed`}
              >
                {submitting
                  ? 'Отправка…'
                  : isExpiredPro
                    ? 'Продлить Pro — отправить заявку'
                    : 'Отправить заявку на проверку'}
              </button>
            </form>
          ) : null}

          {isActivePro ? (
            <button type="button" onClick={onBack} className={`${catalogSheetPrimaryBtn} min-h-12 w-full`}>
              Закрыть
            </button>
          ) : null}

          {showMockDemo && onMockDemo ? (
            <div className="space-y-2 border-t border-[#EEEEEE] pt-4">
              <p className="text-[13px] text-[#6B7280]">Dev: быстрая активация Pro без проверки оплаты.</p>
              <button
                type="button"
                onClick={() => void Promise.resolve(onMockDemo())}
                className={`${catalogSheetSecondaryBtn} w-full`}
              >
                Подключить в demo
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {!isActivePro ? (
        <button type="button" onClick={onBack} className={`${catalogSheetSecondaryBtn} min-h-12 w-full`}>
          Назад
        </button>
      ) : null}
    </div>
  );
}
