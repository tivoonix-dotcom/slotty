import type { ReactNode } from 'react';
import { catalogFilterSheetHeaderBarClass } from './catalogFilterSheetTheme';

type Props = {
  children: ReactNode;
  className?: string;
  withSafeArea?: boolean;
};

/** Шапка sheet фильтров — на всю ширину, без скругления фона (иначе белые зазоры). */
export function CatalogFilterSheetHeaderShell({
  children,
  className = '',
  withSafeArea = true,
}: Props) {
  return (
    <header
      className={`${catalogFilterSheetHeaderBarClass} ${withSafeArea ? '' : '!pt-0'} ${className}`.trim()}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#F47C8C] via-[#F47C8C] to-[#E2577A]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_0%,rgba(255,255,255,0.22),transparent_55%)]"
        aria-hidden
      />
      {children}
    </header>
  );
}
