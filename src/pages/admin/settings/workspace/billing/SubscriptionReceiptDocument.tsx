import { ADMIN_DESKTOP_LOGO_SRC } from '../../../../../app/headerLogo';
import type { SubscriptionReceiptDocumentData } from './subscriptionReceiptModel';
import { SUBSCRIPTION_RECEIPT_BG_SRC } from './subscriptionReceiptModel';

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="m-0 text-[11px] leading-[1.55] text-[#525252]">
      <span className="inline-block min-w-[9.5rem] font-semibold text-[#111827]">{label}</span>
      {value}
    </p>
  );
}

function TotalsBlock({ lines }: { lines: SubscriptionReceiptDocumentData['totals'] }) {
  return (
    <div className="ml-auto w-full max-w-[16rem] space-y-1.5 pt-4">
      {lines.map((line) => (
        <div
          key={line.label}
          className={`flex items-baseline justify-between gap-4 text-[12px] leading-snug ${
            line.bold ? 'border-t border-[#E5E5E5] pt-2 text-[13px] font-semibold text-[#111827]' : 'text-[#525252]'
          }`}
        >
          <span>{line.label}</span>
          <span className="shrink-0 text-right text-[#111827]">{line.value}</span>
        </div>
      ))}
    </div>
  );
}

type Props = {
  data: SubscriptionReceiptDocumentData;
  className?: string;
};

/** Квитанция в стиле OpenAI: плоский документ, горизонтальные линии, hero SLOTTY. */
export function SubscriptionReceiptDocument({ data, className = '' }: Props) {
  return (
    <article className={`bg-white text-[#111827] ${className}`}>
      <div className="flex items-start justify-between gap-6 border-b border-[#E5E5E5] pb-5">
        <h1 className="m-0 text-[26px] font-semibold tracking-[-0.03em] text-[#111827]">Квитанция</h1>
        <img
          src={ADMIN_DESKTOP_LOGO_SRC}
          alt="SLOTTY"
          className="h-8 w-auto max-w-[120px] object-contain object-right sm:h-9"
        />
      </div>

      <div className="grid gap-1 border-b border-[#E5E5E5] py-4">
        <MetaLine label="Номер квитанции" value={data.receiptNumber} />
        <MetaLine label="Дата" value={`${data.issuedDate}, ${data.issuedTime}`} />
        <MetaLine label="Статус" value={data.statusLabel} />
      </div>

      <div className="grid gap-6 border-b border-[#E5E5E5] py-5 sm:grid-cols-2">
        <div className="space-y-1 text-[11px] leading-[1.6] text-[#525252]">
          <p className="m-0 font-semibold text-[#111827]">SLOTTY</p>
          <p className="m-0">Онлайн-запись к мастерам</p>
          <p className="m-0">slotty.by</p>
          <p className="m-0">Республика Беларусь</p>
        </div>
        <div className="space-y-1 text-[11px] leading-[1.6] text-[#525252]">
          <p className="m-0 font-semibold text-[#111827]">Подписка</p>
          <p className="m-0">{data.planName}</p>
          {data.periodRange ? <p className="m-0">{data.periodRange}</p> : null}
          <p className="m-0">{data.statusLabel}</p>
        </div>
      </div>

      <div className="border-b border-[#E5E5E5] py-5">
        <img
          src={SUBSCRIPTION_RECEIPT_BG_SRC}
          alt=""
          className="block aspect-[2.4/1] w-full object-cover object-center"
        />
      </div>

      <p className="m-0 py-5 text-[18px] font-semibold tracking-[-0.02em] text-[#111827]">{data.summaryLine}</p>

      <div className="border-t border-[#E5E5E5] pt-4">
        <table className="w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-[#E5E5E5] text-[#737373]">
              <th className="pb-2 pr-3 font-medium">Описание</th>
              <th className="hidden pb-2 pr-3 text-right font-medium sm:table-cell">Кол-во</th>
              <th className="hidden pb-2 pr-3 text-right font-medium sm:table-cell">Цена</th>
              <th className="pb-2 text-right font-medium">Сумма</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#E5E5E5] align-top text-[#111827]">
              <td className="py-3 pr-3">
                <p className="m-0 font-medium">{data.lineItemTitle}</p>
                {data.lineItemSubtitle ? (
                  <p className="m-0 mt-1 text-[#737373]">{data.lineItemSubtitle}</p>
                ) : null}
              </td>
              <td className="hidden py-3 pr-3 text-right sm:table-cell">{data.lineItemQty}</td>
              <td className="hidden py-3 pr-3 text-right sm:table-cell">{data.lineItemUnitPrice}</td>
              <td className="py-3 text-right font-medium">{data.lineItemAmount}</td>
            </tr>
          </tbody>
        </table>

        <TotalsBlock lines={data.totals} />
      </div>

      {data.detailRows.length > 0 ? (
        <div className="border-t border-[#E5E5E5] pt-5">
          <h2 className="m-0 text-[13px] font-semibold text-[#111827]">Детали подписки</h2>
          <dl className="mt-3 space-y-2">
            {data.detailRows.map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4 text-[11px] leading-snug">
                <dt className="text-[#737373]">{label}</dt>
                <dd className="m-0 text-right font-medium text-[#111827]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {data.paymentMethod ? (
        <div className="mt-6 border-t border-[#E5E5E5] pt-5">
          <h2 className="m-0 text-[13px] font-semibold text-[#111827]">История оплаты</h2>
          <table className="mt-3 w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#E5E5E5] text-[#737373]">
                <th className="pb-2 pr-3 font-medium">Способ</th>
                <th className="pb-2 pr-3 font-medium">Дата</th>
                <th className="pb-2 pr-3 text-right font-medium">Сумма</th>
                <th className="pb-2 text-right font-medium">№ квитанции</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-[#111827]">
                <td className="py-2 pr-3">{data.paymentMethod}</td>
                <td className="py-2 pr-3">{data.issuedDate}</td>
                <td className="py-2 pr-3 text-right">{data.paymentAmount}</td>
                <td className="py-2 text-right">{data.receiptNumber}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-6 flex items-end justify-between gap-4 border-t border-[#E5E5E5] pt-4 text-[10px] text-[#737373]">
        <span className="font-semibold tracking-[0.08em] text-[#111827]">SLOTTY</span>
        <span>slotty.by · документ сформирован автоматически</span>
      </div>
    </article>
  );
}
