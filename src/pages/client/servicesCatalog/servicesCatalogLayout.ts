import { catalogListGap } from './servicesCatalogTheme';

/** Десктоп-каталог: горизонтальные карточки на всю ширину */
export function desktopCardLayout(): 'wide' {
  return 'wide';
}

export function desktopGridClassName(): string {
  return catalogListGap;
}

/** Один список без дублирующих секций */
export function shouldUseUnifiedCatalogSections(
  layout: 'mobile' | 'desktop',
  itemCount: number,
): boolean {
  return layout === 'desktop' && itemCount > 0;
}
