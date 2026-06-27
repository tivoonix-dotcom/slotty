import { useEffect, useRef, useState } from 'react';
import { HiChevronDown } from 'react-icons/hi2';
import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { getCategoryWorkPhotoUrl } from '../../../features/catalog/categoryWorkPhotos';
import {
  categoryCodesMatch,
  getServiceCategoryLabel,
} from '../../../features/catalog/serviceCategoryLabels';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import {
  catalogDesktopChipActive,
  catalogFieldClass,
  catalogWbFilterPillActive,
  catalogWbFilterPillIdle,
} from './servicesCatalogTheme';

type Props = {
  categories: ServiceCategoryDto[];
  categoryCode: string | null;
  onSelect: (code: string | null) => void;
  fullWidth?: boolean;
  compact?: boolean;
  /** Pill в строке фильтров WB (десктоп-каталог). */
  variant?: 'default' | 'pill';
};

export function ServicesCatalogCategoryMenu({
  categories,
  categoryCode,
  onSelect,
  fullWidth = false,
  compact = false,
  variant = 'default',
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const label =
    categoryCode == null ? 'Все категории' : getServiceCategoryLabel(categoryCode, categories);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (code: string | null) => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    onSelect(code);
    setOpen(false);
  };

  const pillActive = categoryCode != null;
  const pillLabel = categoryCode == null ? 'Категория' : label;

  const triggerClass =
    variant === 'pill'
      ? `${pillActive ? catalogWbFilterPillActive : catalogWbFilterPillIdle} max-w-[11rem]`
      : `inline-flex w-full items-center justify-between gap-2 font-semibold text-[#111827] transition ${catalogFieldClass} ${
          compact ? 'min-h-8 px-2.5 text-[13px]' : 'min-h-11 px-3.5 text-[14px]'
        } ${categoryCode ? 'ring-1 ring-[#111827]/10' : ''}`;

  return (
    <div ref={rootRef} className={`relative shrink-0 snap-start ${fullWidth ? 'w-full' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={variant === 'pill' ? 'Категория услуг' : undefined}
        className={triggerClass}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {variant === 'default' && !fullWidth ? (
            <span className="truncate font-medium text-[#6B7280]">Категория</span>
          ) : null}
          <span className="truncate">{variant === 'pill' ? pillLabel : label}</span>
        </span>
        {variant === 'default' ? (
          <HiChevronDown
            className={`h-4 w-4 shrink-0 text-[#6B7280] transition ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        ) : null}
      </button>

      {open ? (
        <div
          role="listbox"
          className={`absolute left-0 top-[calc(100%+6px)] z-40 max-h-[min(420px,70vh)] overflow-y-auto rounded-[12px] bg-white p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] ${
            fullWidth ? 'w-full' : 'w-[min(100vw-3rem,360px)]'
          }`}
        >
          <button
            type="button"
            role="option"
            aria-selected={categoryCode == null}
            onClick={() => pick(null)}
            className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[14px] font-semibold transition ${
              categoryCode == null ? catalogDesktopChipActive : 'hover:bg-[#FAFAFA]'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] text-[12px] font-bold text-[#F47C8C]">
              Все
            </span>
            Все категории
          </button>
          {categories.map((cat) => {
            const on = categoryCodesMatch(categoryCode, cat.code);
            return (
              <button
                key={cat.code}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => pick(cat.code)}
                className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[14px] font-semibold transition ${
                  on ? catalogDesktopChipActive : 'hover:bg-[#FAFAFA]'
                }`}
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[12px] bg-[#EEEEF0]">
                  <ImageReveal
                    src={getCategoryWorkPhotoUrl(cat.code)}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
                <span className="min-w-0 truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
