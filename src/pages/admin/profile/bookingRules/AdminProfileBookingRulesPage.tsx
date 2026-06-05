import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  HiCreditCard,
  HiPencilSquare,
  HiShieldCheck,
} from 'react-icons/hi2';
import {
  fetchMyBookingRulesStructured,
  putMyBookingRulesStructured,
} from '../../../../features/admin/api/adminProfileApi';
import { patchMyPaymentSettings } from '../../../../features/admin/api/masterPaymentSettingsApi';
import { resolveBelarusBanks } from '../../../../shared/payments/belarusBanks';
import {
  needsPreferredBanks,
  paymentLabelsToCodes,
  paymentCodesToLabels,
} from '../../../../shared/payments/paymentMethodCodes';
import { AdminBottomSheet } from '../../shared/AdminBottomSheet';
import { AdminToast } from '../../shared/AdminToast';
import { useAdminToast } from '../../shared/useAdminToast';
import { adminMobileTabBarScrollPad } from '../../shared/adminMobileTabBarTheme';
import { SettingsErrorState, SettingsSkeleton, SettingsStatusBadge } from '../../settings/workspace/settingsUi';
import { settingsPinkBtn } from '../../settings/workspace/settingsWorkspaceTheme';
import {
  cabinetCard,
  cabinetCardPad,
  cabinetInsetShell,
  cabinetOutlineBtn,
  sheetFieldClass,
  sheetHintClass,
  sheetLabelClass,
  sheetSegmentClass,
} from '../adminProfileCabinetTheme';
import { PaymentMethodIcon, PaymentRulesSheetFields } from './PaymentRulesSheetFields';
import { type PaymentOption } from '../paymentMethodOptions';
import { CabinetIcon, type CabinetIconName } from '../cabinetIcons';
import {
  buildClientPreviewLines,
  buildSummaryItems,
  formFingerprint,
  formFromDto,
  FREE_CANCEL_OPTIONS,
  LATENESS_OPTIONS,
  LATE_ARRIVAL_LABELS,
  LATE_CANCEL_LABELS,
  MIN_NOTICE_OPTIONS,
  NO_SHOW_OPTIONS,
  NO_SHOW_POLICY_LABELS,
  refundsCardEnabled,
  RESCHEDULE_BEFORE_OPTIONS,
  RESCHEDULE_LIMIT_OPTIONS,
  type BookingRulesFormState,
} from './bookingRulesFormModel';

type EditCardId =
  | 'booking'
  | 'cancel'
  | 'lateness'
  | 'no_show'
  | 'reschedule'
  | 'payment'
  | 'refund'
  | 'preparation';

const CARD_META: Record<EditCardId, { title: string; icon: CabinetIconName }> = {
  booking: { title: 'Запись', icon: 'calendar' },
  cancel: { title: 'Отмена', icon: 'rules' },
  lateness: { title: 'Опоздание', icon: 'clock' },
  no_show: { title: 'Неявка', icon: 'rules' },
  reschedule: { title: 'Перенос записи', icon: 'calendar' },
  payment: { title: 'Оплата', icon: 'card' },
  refund: { title: 'Возвраты', icon: 'tag' },
  preparation: { title: 'Подготовка к визиту', icon: 'comment' },
};

function FieldRow({ label, value }: { label: string; value: string }) {
  const trimmed = value.trim();
  const isEmpty = !trimmed;
  const display = isEmpty ? 'Не указано' : trimmed;

  return (
    <div className="flex flex-col gap-1 border-b border-[#F0F0F0] py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="text-[12px] font-medium text-[#9CA3AF] sm:text-[13px] sm:text-[#6B7280]">
        {label}
      </span>
      <span
        className={`text-[14px] leading-snug sm:max-w-[58%] sm:text-right ${
          isEmpty ? 'font-medium text-[#9CA3AF]' : 'font-semibold text-[#111827]'
        }`}
      >
        {display}
      </span>
    </div>
  );
}

function CompletionRing({ percent }: { percent: number }) {
  const size = 52;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const offset = length - (Math.min(100, Math.max(0, percent)) / 100) * length;

  return (
    <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-[52px] w-[52px] -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F0F0F0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F47C8C"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-[13px] font-bold text-[#111827]">{percent}%</span>
    </div>
  );
}

function ClientPreviewMockup({ lines, compact }: { lines: string[]; compact?: boolean }) {
  return (
    <div
      className={`w-full rounded-[18px] bg-white ring-1 ring-[#F3F4F6] lg:mx-auto lg:max-w-[280px] ${
        compact ? 'p-3' : 'rounded-[22px] p-4'
      }`}
    >
      <p
        className={`text-center font-semibold uppercase tracking-wide text-[#9CA3AF] ${
          compact ? 'mb-2 text-[10px]' : 'mb-3 text-[11px]'
        }`}
      >
        Правила мастера
      </p>
      <ul className="space-y-0">
        {lines.map((line) => (
          <li
            key={line}
            className={`border-b border-[#F3F4F6] leading-snug text-[#374151] last:border-0 ${
              compact ? 'py-2 text-[12px]' : 'py-2.5 text-[13px]'
            }`}
          >
            {line}
          </li>
        ))}
      </ul>
      <p
        className={`text-center leading-relaxed text-[#9CA3AF] ${
          compact ? 'mt-2 text-[10px]' : 'mt-3 text-[11px]'
        }`}
      >
        Вопросы? Напишите мастеру в чат
      </p>
    </div>
  );
}

function ClientPreviewPanel({
  lines,
  compact,
}: {
  lines: string[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? '' : `${cabinetCard} ${cabinetCardPad}`}>
      {!compact ? (
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#FFF1F4] text-[#F47C8C]">
            <HiShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-[#111827]">Как это увидит клиент</h2>
            <p className="text-[12px] text-[#9CA3AF]">Перед записью и в деталях визита</p>
          </div>
        </div>
      ) : null}
      <div className={`${cabinetInsetShell} ${compact ? 'p-4' : 'p-4 sm:p-5'}`}>
        <ClientPreviewMockup lines={lines} compact={compact} />
      </div>
    </div>
  );
}

function RuleCard({
  id,
  form,
  disabled,
  onEdit,
}: {
  id: EditCardId;
  form: BookingRulesFormState;
  disabled?: boolean;
  onEdit: (id: EditCardId) => void;
}) {
  const meta = CARD_META[id];
  const refundEnabled = refundsCardEnabled(form);

  const rows = (() => {
    switch (id) {
      case 'booking':
        return [
          { label: 'Мин. время', value: MIN_NOTICE_OPTIONS.find((o) => o.value === form.minBookingNoticeMinutes)?.label ?? `${form.minBookingNoticeMinutes} мин` },
          {
            label: 'Подтверждение',
            value: form.requiresMasterConfirmation ? 'Заявка мастера' : 'Автоматически',
          },
        ];
      case 'cancel':
        return [
          {
            label: 'Бесплатная отмена',
            value: FREE_CANCEL_OPTIONS.find((o) => o.value === form.freeCancelBeforeMinutes)?.label ?? '',
          },
          { label: 'Поздняя отмена', value: LATE_CANCEL_LABELS[form.lateCancelPolicy] },
        ];
      case 'lateness':
        return [
          {
            label: 'Допустимо',
            value: LATENESS_OPTIONS.find((o) => o.value === form.allowedLatenessMinutes)?.label ?? '',
          },
          { label: 'Если позже', value: LATE_ARRIVAL_LABELS[form.lateArrivalPolicy] },
        ];
      case 'no_show':
        return [
          {
            label: 'Через',
            value: NO_SHOW_OPTIONS.find((o) => o.value === form.noShowAfterMinutes)?.label ?? '',
          },
          { label: 'Последствие', value: NO_SHOW_POLICY_LABELS[form.noShowPolicy] },
        ];
      case 'reschedule':
        return [
          { label: 'Разрешён', value: form.rescheduleEnabled ? 'Да' : 'Нет' },
          {
            label: 'Мин. время',
            value: RESCHEDULE_BEFORE_OPTIONS.find((o) => o.value === form.rescheduleBeforeMinutes)?.label ?? '',
          },
          {
            label: 'Лимит',
            value:
              form.rescheduleLimit == null
                ? 'Без ограничения'
                : `${form.rescheduleLimit} раз`,
          },
        ];
      case 'payment':
        return [
          { label: 'Способы', value: form.paymentMethods.join(', ') },
          {
            label: 'Банки',
            value: form.preferredBankIds.length
              ? resolveBelarusBanks(form.preferredBankIds)
                  .map((b) => b.name)
                  .join(', ')
              : '',
          },
          { label: 'Комментарий', value: form.paymentComment?.trim() ?? '' },
        ];
      case 'refund':
        return refundEnabled
          ? [
              { label: 'Условия', value: form.refundPolicyText?.trim() ?? '' },
              { label: 'Статус', value: form.refundPolicyEnabled ? 'Включены' : 'Выключены' },
            ]
          : [];
      case 'preparation':
        return [
          { label: 'Важно', value: form.visitPreparationText?.trim() ?? '' },
          { label: 'Противопоказания', value: form.contraindicationsText?.trim() ?? '' },
        ];
      default:
        return [];
    }
  })();

  return (
    <div className={`${cabinetCard} ${cabinetCardPad} ${disabled ? 'opacity-90' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] text-[#F47C8C]">
            <CabinetIcon name={meta.icon} size={18} />
          </span>
          <h3 className="text-[16px] font-semibold text-[#111827]">{meta.title}</h3>
        </div>
        {!disabled ? (
          <button
            type="button"
            onClick={() => onEdit(id)}
            className="inline-flex shrink-0 items-center gap-1 rounded-[10px] bg-[#FFF1F4] px-3 py-2 text-[12px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]"
          >
            <HiPencilSquare className="h-3.5 w-3.5" />
            Изменить
          </button>
        ) : null}
      </div>

      {disabled ? (
        <div className="mt-4 rounded-[14px] border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-4 py-5 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] text-[#9CA3AF]">
            <HiCreditCard className="h-5 w-5" />
          </span>
          <p className="mt-3 text-[14px] font-medium text-[#374151]">Возвраты пока недоступны</p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#9CA3AF]">
            Появятся после подключения онлайн-оплаты.
          </p>
        </div>
      ) : id === 'payment' ? (
        <>
          <div className={`${cabinetInsetShell} mt-4 px-4 py-3`}>
            {form.paymentMethods.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {form.paymentMethods.map((method) => (
                  <span
                    key={method}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[13px] font-semibold text-[#111827]"
                  >
                    <span className="text-[#F47C8C]">
                      <PaymentMethodIcon method={method} />
                    </span>
                    {method}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[14px] font-medium text-[#9CA3AF]">Способы не выбраны</p>
            )}
            <div className="mt-3 space-y-2 border-t border-[#F0F0F0] pt-3">
              {form.preferredBankIds.length > 0 ? (
                <FieldRow
                  label="Банки"
                  value={resolveBelarusBanks(form.preferredBankIds)
                    .map((b) => b.name)
                    .join(', ')}
                />
              ) : null}
              {form.paymentComment?.trim() ? (
                <FieldRow label="Комментарий" value={form.paymentComment} />
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={`${cabinetInsetShell} mt-4 px-4 py-1`}>
            {rows.map((row) => (
              <FieldRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SegmentPicker<T extends string | number | boolean | null>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mt-2 rounded-[12px] bg-[#F5F5F5] p-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={sheetSegmentClass(on)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Props = {
  useCabinetApi?: boolean;
};

export function AdminProfileBookingRulesPage({ useCabinetApi = true }: Props) {
  const { toast, showToast, showErrorToast, clearToast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BookingRulesFormState | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState('');
  const [editCard, setEditCard] = useState<EditCardId | null>(null);
  const [draft, setDraft] = useState<BookingRulesFormState | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [paymentWarning, setPaymentWarning] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!useCabinetApi) {
      setLoadError('Подключите API для настройки правил');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const dto = await fetchMyBookingRulesStructured();
      const next = formFromDto(dto);
      setForm(next);
      setSavedFingerprint(formFingerprint(next));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить правила');
    } finally {
      setLoading(false);
    }
  }, [useCabinetApi]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = form != null && formFingerprint(form) !== savedFingerprint;
  const summary = useMemo(() => (form ? buildSummaryItems(form) : []), [form]);
  const previewLines = useMemo(() => (form ? buildClientPreviewLines(form) : []), [form]);

  const handleSave = async () => {
    if (!form || !useCabinetApi) return;
    setSaving(true);
    setSaveError(null);
    try {
      const dto = await putMyBookingRulesStructured({ ...form, prepaymentRequired: false });
      const next = formFromDto(dto);
      setForm(next);
      setSavedFingerprint(formFingerprint(next));
      showToast('Сохранено');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось сохранить';
      setSaveError(msg);
      showErrorToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (id: EditCardId) => {
    if (!form) return;
    setDraft({ ...form });
    setEditCard(id);
  };

  const applyEdit = async () => {
    if (!draft) return;
    if (editCard === 'payment' && useCabinetApi) {
      setSaving(true);
      setSaveError(null);
      setPaymentWarning(null);
      try {
        const bankIds = needsPreferredBanks(draft.paymentMethods) ? draft.preferredBankIds : [];
        const saved = await patchMyPaymentSettings({
          paymentMethods: paymentLabelsToCodes(draft.paymentMethods),
          prepaymentRequired: false,
          preferredBankIds: bankIds,
          paymentComment: draft.paymentComment,
        });
        const next: BookingRulesFormState = {
          ...draft,
          paymentMethods: paymentCodesToLabels(saved.paymentMethods),
          preferredBankIds: saved.preferredBankIds,
          prepaymentRequired: false,
          paymentComment: saved.paymentComment,
        };
        setForm(next);
        setSavedFingerprint(formFingerprint(next));
        setPaymentWarning(saved.warning ?? null);
        showToast('Оплата сохранена');
        setEditCard(null);
        setDraft(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Не удалось сохранить оплату';
        setSaveError(msg);
        showErrorToast(msg);
      } finally {
        setSaving(false);
      }
      return;
    }
    setForm(draft);
    setEditCard(null);
    setDraft(null);
  };

  const renderEditSheet = () => {
    if (!draft || !editCard) return null;
    const patchDraft = (p: Partial<BookingRulesFormState>) => setDraft((d) => (d ? { ...d, ...p } : d));

    let body: ReactNode = null;
    if (editCard === 'booking') {
      body = (
        <>
          <p className={sheetLabelClass}>Минимальное время до записи</p>
          <SegmentPicker
            value={draft.minBookingNoticeMinutes}
            onChange={(v) => patchDraft({ minBookingNoticeMinutes: v as number })}
            options={MIN_NOTICE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <p className={`${sheetLabelClass} mt-4`}>Подтверждение мастером</p>
          <SegmentPicker
            value={draft.requiresMasterConfirmation}
            onChange={(v) => patchDraft({ requiresMasterConfirmation: v as boolean })}
            options={[
              { value: true, label: 'Заявка мастера' },
              { value: false, label: 'Авто (скоро)' },
            ]}
          />
        </>
      );
    } else if (editCard === 'cancel') {
      body = (
        <>
          <p className={sheetLabelClass}>Бесплатная отмена</p>
          <SegmentPicker
            value={draft.freeCancelBeforeMinutes}
            onChange={(v) => patchDraft({ freeCancelBeforeMinutes: v as number })}
            options={FREE_CANCEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <p className={`${sheetLabelClass} mt-4`}>Поздняя отмена</p>
          <SegmentPicker
            value={draft.lateCancelPolicy}
            onChange={(v) => patchDraft({ lateCancelPolicy: v as BookingRulesFormState['lateCancelPolicy'] })}
            options={Object.entries(LATE_CANCEL_LABELS).map(([value, label]) => ({
              value: value as BookingRulesFormState['lateCancelPolicy'],
              label,
            }))}
          />
        </>
      );
    } else if (editCard === 'lateness') {
      body = (
        <>
          <p className={sheetLabelClass}>Допустимое опоздание</p>
          <SegmentPicker
            value={draft.allowedLatenessMinutes}
            onChange={(v) => patchDraft({ allowedLatenessMinutes: v as number })}
            options={LATENESS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <p className={`${sheetLabelClass} mt-4`}>Если клиент опоздал больше</p>
          <SegmentPicker
            value={draft.lateArrivalPolicy}
            onChange={(v) =>
              patchDraft({ lateArrivalPolicy: v as BookingRulesFormState['lateArrivalPolicy'] })
            }
            options={Object.entries(LATE_ARRIVAL_LABELS).map(([value, label]) => ({
              value: value as BookingRulesFormState['lateArrivalPolicy'],
              label,
            }))}
          />
        </>
      );
    } else if (editCard === 'no_show') {
      body = (
        <>
          <p className={sheetLabelClass}>Считать неявкой через</p>
          <SegmentPicker
            value={draft.noShowAfterMinutes}
            onChange={(v) => patchDraft({ noShowAfterMinutes: v as number })}
            options={NO_SHOW_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <p className={`${sheetLabelClass} mt-4`}>Последствие</p>
          <SegmentPicker
            value={draft.noShowPolicy}
            onChange={(v) => patchDraft({ noShowPolicy: v as BookingRulesFormState['noShowPolicy'] })}
            options={Object.entries(NO_SHOW_POLICY_LABELS).map(([value, label]) => ({
              value: value as BookingRulesFormState['noShowPolicy'],
              label,
            }))}
          />
        </>
      );
    } else if (editCard === 'reschedule') {
      body = (
        <>
          <p className={sheetLabelClass}>Перенос разрешён</p>
          <SegmentPicker
            value={draft.rescheduleEnabled}
            onChange={(v) => patchDraft({ rescheduleEnabled: v as boolean })}
            options={[
              { value: true, label: 'Да' },
              { value: false, label: 'Нет' },
            ]}
          />
          {draft.rescheduleEnabled ? (
            <>
              <p className={`${sheetLabelClass} mt-4`}>Минимальное время до переноса</p>
              <SegmentPicker
                value={draft.rescheduleBeforeMinutes}
                onChange={(v) => patchDraft({ rescheduleBeforeMinutes: v as number })}
                options={RESCHEDULE_BEFORE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
              <p className={`${sheetLabelClass} mt-4`}>Сколько раз можно перенести</p>
              <SegmentPicker
                value={draft.rescheduleLimit}
                onChange={(v) => patchDraft({ rescheduleLimit: v as number | null })}
                options={RESCHEDULE_LIMIT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
            </>
          ) : null}
        </>
      );
    } else if (editCard === 'payment') {
      const togglePaymentMethod = (opt: PaymentOption) => {
        const has = draft.paymentMethods.includes(opt);
        const nextMethods = has
          ? draft.paymentMethods.filter((x: string) => x !== opt)
          : [...draft.paymentMethods, opt];
        patchDraft({
          paymentMethods: nextMethods,
          preferredBankIds: needsPreferredBanks(nextMethods) ? draft.preferredBankIds : [],
        });
      };
      const toggleBank = (bankId: string) => {
        const has = draft.preferredBankIds.includes(bankId);
        patchDraft({
          preferredBankIds: has
            ? draft.preferredBankIds.filter((id) => id !== bankId)
            : [...draft.preferredBankIds, bankId],
        });
      };
      body = (
        <PaymentRulesSheetFields
          paymentMethods={draft.paymentMethods}
          onTogglePaymentMethod={togglePaymentMethod}
          preferredBankIds={draft.preferredBankIds}
          onTogglePreferredBank={toggleBank}
          paymentComment={draft.paymentComment}
          onPaymentCommentChange={(v) => patchDraft({ paymentComment: v })}
        />
      );
    } else if (editCard === 'refund') {
      body = (
        <>
          <p className={sheetHintClass}>Доступно при онлайн-оплате.</p>
          <label className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.refundPolicyEnabled}
              onChange={(e) => patchDraft({ refundPolicyEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-[#D1D5DB] text-[#F47C8C]"
            />
            <span className="text-[14px] text-[#374151]">Правила возврата включены</span>
          </label>
          <label className="mt-4 block">
            <span className={sheetLabelClass}>Условия и срок</span>
            <textarea
              value={draft.refundPolicyText ?? ''}
              onChange={(e) => patchDraft({ refundPolicyText: e.target.value || null })}
              rows={3}
              placeholder="Например: возврат при отмене за 12+ часов, до 3 рабочих дней"
              className={`${sheetFieldClass} mt-2 resize-none`}
            />
          </label>
        </>
      );
    } else if (editCard === 'preparation') {
      body = (
        <>
          <label className="block">
            <span className={sheetLabelClass}>Что важно знать клиенту</span>
            <textarea
              value={draft.visitPreparationText ?? ''}
              onChange={(e) => patchDraft({ visitPreparationText: e.target.value || null })}
              rows={2}
              className={`${sheetFieldClass} mt-2 resize-none`}
            />
          </label>
          <label className="mt-4 block">
            <span className={sheetLabelClass}>Противопоказания / аллергии</span>
            <textarea
              value={draft.contraindicationsText ?? ''}
              onChange={(e) => patchDraft({ contraindicationsText: e.target.value || null })}
              rows={2}
              className={`${sheetFieldClass} mt-2 resize-none`}
            />
          </label>
        </>
      );
    }

    return (
      <AdminBottomSheet
        variant="catalog"
        open={editCard != null}
        onClose={() => {
          setEditCard(null);
          setDraft(null);
        }}
        title={CARD_META[editCard].title}
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => setEditCard(null)} className={cabinetOutlineBtn}>
              Отмена
            </button>
            <button type="button" onClick={() => void applyEdit()} className={`${settingsPinkBtn} w-full sm:flex-1`}>
              {editCard === 'payment' && saving ? 'Сохранение…' : 'Готово'}
            </button>
          </div>
        }
      >
        {body}
      </AdminBottomSheet>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SettingsSkeleton rows={5} />
      </div>
    );
  }

  if (loadError || !form) {
    return <SettingsErrorState message={loadError ?? 'Нет данных'} onRetry={() => void load()} />;
  }

  const refundEnabled = refundsCardEnabled(form);
  const mobileScrollPad = dirty
    ? `max-lg:pb-[calc(${adminMobileTabBarScrollPad}+5.5rem)]`
    : `max-lg:pb-[${adminMobileTabBarScrollPad}]`;

  return (
    <div className={`w-full min-w-0 space-y-4 ${mobileScrollPad} ${dirty ? 'lg:pb-20' : ''}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-[#111827] sm:text-[22px]">
              Правила записи
            </h1>
            <SettingsStatusBadge tone={form.completionScore >= 80 ? 'success' : 'warning'}>
              {form.completionScore}% заполнено
            </SettingsStatusBadge>
          </div>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#6B7280] sm:text-[15px]">
            Настройте условия записи, отмены и посещения. Клиенты увидят правила перед записью и в
            деталях визита.
          </p>
        </div>
        <div className="hidden shrink-0 sm:block">
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => void handleSave()}
            className={`${settingsPinkBtn} min-h-11 px-5 disabled:opacity-45`}
          >
            {saving ? 'Сохранение…' : 'Сохранить изменения'}
          </button>
        </div>
      </div>

      <div className={`${cabinetCard} ${cabinetCardPad}`}>
        <div className="flex items-center gap-4 border-b border-[#F3F4F6] pb-4 lg:hidden">
          <CompletionRing percent={form.completionScore} />
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[#111827]">Готовность правил</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[#6B7280]">
              Заполните все блоки, чтобы клиенту было проще записаться без вопросов.
            </p>
          </div>
        </div>

        <div className={`${cabinetInsetShell} mt-4 px-4 py-1 lg:mt-0`}>
          {summary.map((item) => (
            <FieldRow key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </div>

      <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
          <RuleCard id="booking" form={form} onEdit={openEdit} />
          <RuleCard id="cancel" form={form} onEdit={openEdit} />
          <RuleCard id="lateness" form={form} onEdit={openEdit} />
          <RuleCard id="no_show" form={form} onEdit={openEdit} />
          <RuleCard id="reschedule" form={form} onEdit={openEdit} />
          <RuleCard id="payment" form={form} onEdit={openEdit} />
          <RuleCard id="refund" form={form} disabled={!refundEnabled} onEdit={openEdit} />
          <RuleCard id="preparation" form={form} onEdit={openEdit} />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--slotty-admin-desktop-topbar-h,4.75rem)+1rem)]">
            <ClientPreviewPanel lines={previewLines} />
          </div>
        </aside>
      </div>

      <div className="lg:hidden">
        <ClientPreviewPanel lines={previewLines} />
      </div>

      {saveError ? (
        <p className="text-[13px] font-medium text-[#DC2626]" role="alert">
          {saveError}
        </p>
      ) : null}

      {paymentWarning ? (
        <p className="text-[13px] font-medium text-[#92400E]" role="status">
          {paymentWarning}
        </p>
      ) : null}

      {dirty ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#F3F4F6] bg-white/95 px-4 py-3 backdrop-blur lg:left-[var(--admin-sidebar-width,0px)]">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
            <p className="min-w-0 text-[13px] font-medium text-[#6B7280]">Есть несохранённые изменения</p>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => void load()} className={`${cabinetOutlineBtn} !w-auto px-4`}>
                Сбросить
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className={`${settingsPinkBtn} min-w-[120px]`}
              >
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {renderEditSheet()}

      <AdminToast toast={toast} onDismiss={clearToast} />
    </div>
  );
}
