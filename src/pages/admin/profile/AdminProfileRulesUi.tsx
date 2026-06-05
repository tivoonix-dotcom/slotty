import { useEffect, useState } from 'react';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  cabinetCard,
  cabinetCardPad,
  sheetFieldClass,
  sheetHintClass,
  sheetSectionTitleClass,
} from './adminProfileCabinetTheme';
import type { PaymentOption } from './paymentMethodOptions';
import { CabinetIcon, type CabinetIconName } from './cabinetIcons';
import { decodePaymentNote } from '../../../features/admin/lib/paymentNoteCodec';
import { SheetFooter } from './AdminProfileEditSheets';
import {
  PaymentMethodIcon,
  PaymentMethodsGrid,
} from './bookingRules/PaymentRulesSheetFields';

export { PAYMENT_OPTIONS, type PaymentOption } from './paymentMethodOptions';

type SheetSaveResult = void | Promise<void>;

const RULES_TEXT_MAX = 2000;

const PAYMENT_META: Record<PaymentOption, { icon: CabinetIconName; short: string }> = {
  Наличные: { icon: 'tag', short: 'На месте' },
  Карта: { icon: 'card', short: 'Терминал / СБП' },
  Перевод: { icon: 'send', short: 'На карту' },
  'Онлайн позже': { icon: 'clock', short: 'Скоро в Slotty' },
};

export { PAYMENT_META };

function resolveRulesPayment(d: MasterDraft): { paymentMethods: string[]; paymentNote: string } {
  const decoded = decodePaymentNote(d.paymentNote);
  const paymentMethods =
    (d.paymentMethods?.length ?? 0) > 0 ? (d.paymentMethods ?? []) : decoded.paymentMethods;
  return { paymentMethods, paymentNote: decoded.paymentNote.trim() };
}

export function hasRulesContent(d: MasterDraft): boolean {
  const pay = resolveRulesPayment(d);
  return Boolean(
    d.bookingRules?.trim() ||
      d.cancellationPolicy?.trim() ||
      pay.paymentMethods.length > 0 ||
      pay.paymentNote,
  );
}

function RulesReadCard({
  iconName,
  title,
  value,
}: {
  iconName: CabinetIconName;
  title: string;
  value?: string | null;
}) {
  const text = value?.trim() ?? '';

  return (
    <div className="rounded-[18px] bg-[#F7F7F8] p-3.5">
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F4] text-[#F47C8C]">
          <CabinetIcon name={iconName} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[#111827]">{title}</p>
          {text ? (
            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[#374151]">{text}</p>
          ) : (
            <p className="mt-2 text-[13px] leading-snug text-[#9CA3AF]">Не указано</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <span className="text-[11px] font-medium tabular-nums text-[#9CA3AF]">
      {value.length}/{max}
    </span>
  );
}

export function RulesSection({
  draft,
  onEditRules,
}: {
  draft: MasterDraft;
  onEditRules: () => void;
}) {
  const { paymentMethods, paymentNote } = resolveRulesPayment(draft);
  const filled = hasRulesContent(draft);

  return (
    <section className={`${cabinetCard} ${cabinetCardPad}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Правила записи</h2>
          </div>
          <button
            type="button"
            onClick={onEditRules}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#FFF1F4] px-3.5 text-[13px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]"
          >
            <CabinetIcon name="pencil" size={16} />
            {filled ? 'Изменить' : 'Заполнить'}
          </button>
        </div>

        {filled ? (
          <div className="mt-4 space-y-2.5">
            <RulesReadCard
              iconName="calendar"
              title="Запись"
              value={draft.bookingRules}
            />
            <RulesReadCard iconName="rules" title="Отмена" value={draft.cancellationPolicy} />

            <div className="rounded-[18px] bg-[#F7F7F8] p-3.5">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F4] text-[#F47C8C]">
                  <CabinetIcon name="card" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[#111827]">Оплата</p>
                  {paymentMethods.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {paymentMethods.map((method) => (
                          <span
                            key={method}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-[#111827]"
                          >
                            <span className="text-[#F47C8C]">
                              <PaymentMethodIcon method={method} />
                            </span>
                            {method}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[13px] leading-snug text-[#9CA3AF]">Способы не выбраны</p>
                  )}
                  {paymentNote ? (
                    <p className="mt-2.5 whitespace-pre-wrap rounded-[14px] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#374151] ring-1 ring-[#EAECEF]">
                      {paymentNote}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[20px] border border-dashed border-[#FDE8ED] bg-[#FFFBFC] px-4 py-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
              <CabinetIcon name="rules" size={26} />
            </span>
            <p className="mt-3 text-[16px] font-semibold text-[#111827]">Правила пока пустые</p>
            <p className="mx-auto mt-1.5 max-w-[18rem] text-[13px] leading-relaxed text-[#6B7280]">
              Добавьте условия записи, отмены и оплату — клиенту будет проще решиться
            </p>
            <button
              type="button"
              onClick={onEditRules}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[10px] bg-[#F47C8C] px-6 text-[14px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98]"
            >
              <CabinetIcon name="plus" size={16} className="text-white" />
              Добавить правила
            </button>
          </div>
        )}
    </section>
  );
}

export function SheetRules({
  draft,
  onSave,
  onCancel,
}: {
  draft: MasterDraft;
  onSave: (patch: Pick<MasterDraft, 'bookingRules' | 'cancellationPolicy' | 'paymentMethods' | 'paymentNote'>) => SheetSaveResult;
  onCancel: () => void;
}) {
  const [bookingRules, setBookingRules] = useState(draft.bookingRules ?? '');
  const [cancellationPolicy, setCancellationPolicy] = useState(draft.cancellationPolicy ?? '');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    () => resolveRulesPayment(draft).paymentMethods,
  );
  const [paymentNote, setPaymentNote] = useState(() => resolveRulesPayment(draft).paymentNote);

  useEffect(() => {
    setBookingRules(draft.bookingRules ?? '');
    setCancellationPolicy(draft.cancellationPolicy ?? '');
    setPaymentMethods(resolveRulesPayment(draft).paymentMethods);
    setPaymentNote(resolveRulesPayment(draft).paymentNote);
  }, [draft]);

  const togglePayment = (label: PaymentOption) => {
    setPaymentMethods((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  };

  const save = () => {
    onSave({
      bookingRules: bookingRules.trim().slice(0, RULES_TEXT_MAX) || undefined,
      cancellationPolicy: cancellationPolicy.trim().slice(0, RULES_TEXT_MAX) || undefined,
      paymentMethods,
      paymentNote: paymentNote.trim().slice(0, 500) || undefined,
    });
  };

  return (
    <div className="space-y-5">
      <label className="block">
        <div className="flex items-baseline justify-between gap-2">
          <p className={sheetSectionTitleClass}>Запись</p>
          <CharCount value={bookingRules} max={RULES_TEXT_MAX} />
        </div>
        <textarea
          value={bookingRules}
          maxLength={RULES_TEXT_MAX}
          onChange={(e) => setBookingRules(e.target.value)}
          rows={4}
          placeholder="Например: запись за сутки. При первом визите — предоплата 30%."
          className={`${sheetFieldClass} mt-3 resize-none leading-relaxed`}
        />
      </label>

      <label className="block">
        <div className="flex items-baseline justify-between gap-2">
          <p className={sheetSectionTitleClass}>Отмена</p>
          <CharCount value={cancellationPolicy} max={RULES_TEXT_MAX} />
        </div>
        <textarea
          value={cancellationPolicy}
          maxLength={RULES_TEXT_MAX}
          onChange={(e) => setCancellationPolicy(e.target.value)}
          rows={4}
          placeholder="Например: бесплатная отмена за 24 часа. При опоздании более 15 мин — визит сокращается."
          className={`${sheetFieldClass} mt-3 resize-none leading-relaxed`}
        />
      </label>

      <div>
        <p className={sheetSectionTitleClass}>Оплата</p>
        <p className={`mt-1 ${sheetHintClass}`}>Выберите способы оплаты</p>
        <div className="mt-3">
          <PaymentMethodsGrid selected={paymentMethods} onToggle={togglePayment} />
        </div>

        <label className="mt-4 block">
          <div className="flex items-baseline justify-end gap-2">
            <CharCount value={paymentNote} max={500} />
          </div>
          <textarea
            value={paymentNote}
            maxLength={500}
            onChange={(e) => setPaymentNote(e.target.value)}
            rows={2}
            placeholder="Например: перевод на карту Приорбанка, чек по запросу"
            className={`${sheetFieldClass} mt-1.5 resize-none leading-relaxed`}
          />
        </label>
      </div>

      <SheetFooter onCancel={onCancel} onSave={save} saveLabel="Сохранить" />
    </div>
  );
}
