import { SlottySelect, type SlottySelectOption } from '../../../shared/ui/SlottySelect';

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  'aria-label'?: string;
};

export function CatalogSortSelect<T extends string>({
  value,
  onChange,
  options,
  'aria-label': ariaLabel = 'Сортировка',
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
      className="shrink-0"
    />
  );
}
