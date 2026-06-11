import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';
import { CatalogFilterSheetHeaderShell } from './CatalogFilterSheetHeaderShell';
import {
  catalogFilterSheetCardClass,
  catalogFilterSheetCloseBtnClass,
  catalogFilterSheetDesktopAsideClass,
  catalogFilterSheetHeaderRowClass,
  catalogFilterSheetPrimaryBtn,
  catalogFilterSheetSecondaryBtn,
  catalogFilterSheetTitleClass,
} from './catalogFilterSheetTheme';

type Props = {
  open: boolean;
  title?: string;
  resultCount: number;
  resultNoun?: string;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  children: ReactNode;
};

function formatResultCount(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n);
}

export function CatalogFilterSheet({
  open,
  title = 'Фильтры',
  resultCount,
  resultNoun = 'вариантов',
  onClose,
  onReset,
  onApply,
  children,
}: Props) {
  useLayoutEffect(() => {
    if (!open) return undefined;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.overflowX = 'hidden';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.overflowX = '';
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.overflowX = '';
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const applyLabel = `Показать ${formatResultCount(resultCount)} ${resultNoun}`;

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-hidden overscroll-none">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        aria-label="Закрыть"
        onClick={onClose}
      />

      {/* Мобилка — полноэкранный sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-filter-sheet-title-mobile"
        className="fixed inset-0 flex w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-[#F5F5F5] lg:hidden"
        style={{ height: '100dvh', maxHeight: '100dvh' }}
      >
        <CatalogFilterSheetHeaderShell>
          <div className={`${catalogFilterSheetHeaderRowClass} px-2 sm:px-3`}>
            <h2 id="catalog-filter-sheet-title-mobile" className={catalogFilterSheetTitleClass}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className={catalogFilterSheetCloseBtnClass}
            >
              <HiXMark className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </CatalogFilterSheetHeaderShell>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-3 scrollbar-hidden sm:px-3"
        >
          <div className={`${catalogFilterSheetCardClass} mx-auto w-full max-w-none`}>{children}</div>
        </div>

        <FilterSheetFooter
          applyLabel={applyLabel}
          onApply={onApply}
          onReset={onReset}
          className="px-2 sm:px-3"
        />
      </div>

      {/* Десктоп — drawer справа (как WB) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-filter-sheet-title-desktop"
        className={`${catalogFilterSheetDesktopAsideClass} bg-white`}
      >
        <CatalogFilterSheetHeaderShell withSafeArea={false} className="shrink-0">
          <div className={`${catalogFilterSheetHeaderRowClass} px-6`}>
            <h2 id="catalog-filter-sheet-title-desktop" className={catalogFilterSheetTitleClass}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className={catalogFilterSheetCloseBtnClass}
            >
              <HiXMark className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </CatalogFilterSheetHeaderShell>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-4 scrollbar-hidden">
          {children}
        </div>

        <FilterSheetFooter
          applyLabel={applyLabel}
          onApply={onApply}
          onReset={onReset}
          className="border-t border-[#EEEEEE] bg-white px-6 py-4"
          compact
        />
      </aside>
    </div>,
    document.body,
  );
}

function FilterSheetFooter({
  applyLabel,
  onApply,
  onReset,
  className,
  compact = false,
}: {
  applyLabel: string;
  onApply: () => void;
  onReset: () => void;
  className: string;
  compact?: boolean;
}) {
  return (
    <div
      className={className}
      style={compact ? undefined : { paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <button type="button" className={catalogFilterSheetPrimaryBtn} onClick={onApply}>
        {applyLabel}
      </button>
      <button
        type="button"
        className={`${catalogFilterSheetSecondaryBtn} ${compact ? 'mt-2' : 'mt-2'}`}
        onClick={onReset}
      >
        Сбросить
      </button>
    </div>
  );
}
