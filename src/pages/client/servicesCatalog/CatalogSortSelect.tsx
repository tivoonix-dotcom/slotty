import { SlottySelect, type SlottySelectOption } from '../../../shared/ui/SlottySelect';

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  'aria-label'?: string;
  compact?: boolean;
  onPhotoBg?: boolean;
};

export function CatalogSortSelect<T extends string>({
  value,
  onChange,
  options,
  'aria-label': ariaLabel = 'Сортировка',
  compact = false,
  onPhotoBg = false,
}: Props<T>) {
  const slottyOptions: SlottySelectOption[] = options.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  return (
    <SlottySelect
      value={value}
      onChange={(next) => onChange(next as T)}
      options={slottyOptions}
      tone="catalog"
      sheetTitle="Сортировка"
      sheetSubtitle="Как показывать результаты"
      aria-label={ariaLabel}
      className={
        compact
          ? `shrink-0 [&_button]:!min-h-8 [&_button]:h-8 [&_button]:py-0 [&_button]:px-3 [&_button]:text-[13px] [&_button]:font-semibold ${
              onPhotoBg
                ? '[&_button]:bg-white [&_button]:hover:bg-[#FFF1F4]'
                : ''
            }`
          : 'shrink-0'
      }
    />
  );
}
