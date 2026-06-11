import { normalizeCategoryCode } from '../../catalog/serviceCategoryLabels';

export const REFERENCE_PHOTO_CATEGORY_CODES = [
  'manicure',
  'barbers',
  'brows-lashes',
  'tattoo',
] as const;

export type ReferencePhotoCategoryCode = (typeof REFERENCE_PHOTO_CATEGORY_CODES)[number];

export function categorySupportsReferencePhoto(code: string | null | undefined): boolean {
  if (!code?.trim()) return false;
  const normalized = normalizeCategoryCode(code);
  return (REFERENCE_PHOTO_CATEGORY_CODES as readonly string[]).includes(normalized);
}

export function referencePhotoSectionTitle(code: string | null | undefined): string {
  const n = code ? normalizeCategoryCode(code) : '';
  switch (n) {
    case 'manicure':
      return 'Фото дизайна';
    case 'barbers':
      return 'Фото причёски';
    case 'brows-lashes':
      return 'Фото-референс';
    case 'tattoo':
      return 'Эскиз или референс';
    default:
      return 'Фото-референс';
  }
}

export function referencePhotoHint(code: string | null | undefined): string {
  const n = code ? normalizeCategoryCode(code) : '';
  switch (n) {
    case 'manicure':
      return 'Прикрепите желаемый дизайн или оттенок — мастер подготовится заранее.';
    case 'barbers':
      return 'Прикрепите фото желаемой стрижки или укладки.';
    case 'brows-lashes':
      return 'Прикрепите фото формы бровей или ресниц.';
    case 'tattoo':
      return 'Прикрепите эскиз или референс татуировки.';
    default:
      return 'Прикрепите фото, чтобы мастер подготовился к визиту.';
  }
}

/** Поиск идей на Pinterest для категории с референс-фото. */
export function referencePhotoPinterestUrl(code: string | null | undefined): string {
  const n = code ? normalizeCategoryCode(code) : '';
  switch (n) {
    case 'manicure':
      return 'https://www.pinterest.com/search/pins/?q=%D0%BC%D0%B0%D0%BD%D0%B8%D0%BA%D1%8E%D1%80%20%D0%B4%D0%B8%D0%B7%D0%B0%D0%B9%D0%BD';
    case 'barbers':
      return 'https://www.pinterest.com/search/pins/?q=%D0%BC%D1%83%D0%B6%D1%81%D0%BA%D0%B0%D1%8F%20%D1%81%D1%82%D1%80%D0%B8%D0%B6%D0%BA%D0%B0';
    case 'brows-lashes':
      return 'https://www.pinterest.com/search/pins/?q=%D0%B1%D1%80%D0%BE%D0%B2%D0%B8%20%D1%80%D0%B5%D1%81%D0%BD%D0%B8%D1%86%D1%8B';
    case 'tattoo':
      return 'https://www.pinterest.com/search/pins/?q=tattoo%20design%20sketch';
    case 'massage':
      return 'https://www.pinterest.com/search/pins/?q=%D0%BC%D0%B0%D1%81%D1%81%D0%B0%D0%B6%20spa%20%D1%84%D0%BE%D1%82%D0%BE';
    case 'fitness':
      return 'https://www.pinterest.com/search/pins/?q=fitness%20workout%20photo';
    default:
      return 'https://www.pinterest.com/search/pins/?q=beauty%20service%20photo';
  }
}
