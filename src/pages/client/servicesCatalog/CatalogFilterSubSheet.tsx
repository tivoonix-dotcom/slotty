import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HiChevronLeft } from 'react-icons/hi2';
import { CatalogFilterSheetHeaderShell } from './CatalogFilterSheetHeaderShell';
import {
  catalogFilterSheetBackBtnClass,
  catalogFilterSheetHeaderRowGridClass,
  catalogFilterSheetTitleCenterClass,
} from './catalogFilterSheetTheme';
import { catalogMobilePadX } from './servicesCatalogTheme';

type Props = {
  open: boolean;
  title: string;
  onBack: () => void;
  children: ReactNode;
};

export function CatalogFilterSubSheet({ open, title, onBack, children }: Props) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[210] flex w-full flex-col overflow-hidden bg-[#F5F5F5] lg:hidden"
      style={{ height: '100dvh', maxHeight: '100dvh' }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <CatalogFilterSheetHeaderShell>
        <div className={`${catalogFilterSheetHeaderRowGridClass} ${catalogMobilePadX}`}>
          <button
            type="button"
            onClick={onBack}
            aria-label="Назад"
            className={catalogFilterSheetBackBtnClass}
          >
            <HiChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <h2 className={catalogFilterSheetTitleCenterClass}>{title}</h2>
          <span className="h-9 w-9 justify-self-end" aria-hidden />
        </div>
      </CatalogFilterSheetHeaderShell>

      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-3 scrollbar-hidden ${catalogMobilePadX}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
