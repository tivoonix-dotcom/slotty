import { HiMagnifyingGlass, HiAdjustmentsHorizontal } from 'react-icons/hi2';

const fieldBase =
  'rounded-full bg-[#F1EFEF] shadow-[0_2px_14px_rgba(17,24,39,0.05)] outline-none transition';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onFilterClick?: () => void;
  showFilter?: boolean;
};

export function ClientSearchBar({
  value,
  onChange,
  placeholder,
  onFilterClick,
  showFilter = true,
}: Props) {
  return (
    <div className="flex gap-2.5 pt-0.5">
      <label className="relative flex min-h-12 min-w-0 flex-1 items-center">
        <HiMagnifyingGlass
          className="pointer-events-none absolute left-4 h-5 w-5 text-[#9CA3AF]"
          aria-hidden
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-12 w-full ${fieldBase} border-0 pl-11 pr-4 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:shadow-[0_6px_24px_rgba(244,124,140,0.14)]`}
        />
      </label>
      {showFilter && onFilterClick ? (
        <button
          type="button"
          onClick={onFilterClick}
          aria-label="Фильтры"
          className={`flex h-12 w-12 shrink-0 items-center justify-center ${fieldBase} text-[#6B7280] active:scale-95 hover:text-[#F47C8C] focus:bg-white focus:text-[#F47C8C] focus:shadow-[0_6px_24px_rgba(244,124,140,0.14)]`}
        >
          <HiAdjustmentsHorizontal className="h-5 w-5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
