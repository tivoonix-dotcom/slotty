import { adminFormSheetMetricCatalog } from '../shared/adminFormSheetTheme';
import {
  servicesSheetSummaryBody,
  servicesSheetSummaryHeader,
  servicesSheetSummaryShell,
} from './adminServicesTheme';
import { ServicesKpiPhotoBackdrop } from './ServicesKpiPhotoBackdrop';

type Props = {
  title: string;
  priceLabel: string;
  durationLabel?: string | null;
  priceTypeLabel: string;
  visibilityLabel: string;
  description?: string | null;
  categoryLabel?: string | null;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <span className="shrink-0 text-[13px] font-medium text-[#6B7280]">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-semibold leading-snug text-[#111827]">
        {value}
      </span>
    </div>
  );
}

export function ServicesFormSummary({
  title,
  priceLabel,
  durationLabel,
  priceTypeLabel,
  visibilityLabel,
  description,
  categoryLabel,
}: Props) {
  const footerLabel = visibilityLabel === 'Видна' ? 'Будет видна в каталоге' : 'Скрыта от клиентов';

  return (
    <div className={servicesSheetSummaryShell}>
      <div className={servicesSheetSummaryHeader}>
        <ServicesKpiPhotoBackdrop />
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/90 drop-shadow-sm">
            Итог
          </p>
          <p className="mt-2 text-[18px] font-bold leading-tight tracking-[-0.03em] text-white drop-shadow-sm">
            {title.trim() || 'Без названия'}
          </p>
          {categoryLabel ? (
            <p className="mt-1 text-[13px] font-medium text-white/85 drop-shadow-sm">{categoryLabel}</p>
          ) : null}
        </div>
      </div>

      <div className={servicesSheetSummaryBody}>
        <div className={`divide-y divide-[#D8D8D8] px-4 py-1 ${adminFormSheetMetricCatalog}`}>
          <SummaryRow label="Цена" value={priceLabel} />
          {durationLabel?.trim() ? <SummaryRow label="Длительность" value={durationLabel} /> : null}
          <SummaryRow label="Тип цены" value={priceTypeLabel} />
          <SummaryRow label="Видимость" value={visibilityLabel} />
          {description?.trim() ? <SummaryRow label="Описание" value={description.trim()} /> : null}
        </div>

        <p className="mt-4 rounded-[10px] bg-white px-4 py-3 text-center text-[15px] font-semibold text-[#111827] ring-1 ring-[#EEEEEE]">
          {footerLabel}
        </p>
      </div>
    </div>
  );
}
