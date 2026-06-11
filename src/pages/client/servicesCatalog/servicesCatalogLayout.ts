/** Десктоп — плитка Kwork-style, 3 в ряд */
export function desktopCardLayout(): 'grid' {
  return 'grid';
}

/** Десктоп — плитка Kwork-style: 3 равные колонки, карточки одной высоты в ряду */
export function desktopGridClassName(): string {
  return [
    'grid items-stretch gap-4',
    'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
    '[&>*]:min-w-0 [&>*]:h-full',
  ].join(' ');
}

/** Мобильный каталог — плитка 2 колонки */
export function mobileCardLayout(): 'grid' {
  return 'grid';
}

export function mobileGridClassName(): string {
  return 'grid grid-cols-2 items-stretch justify-items-stretch gap-2.5 sm:gap-3 [&>*]:min-w-0';
}

/** Один список без дублирующих секций */
export function shouldUseUnifiedCatalogSections(
  layout: 'mobile' | 'desktop',
  itemCount: number,
): boolean {
  return itemCount > 0;
}
