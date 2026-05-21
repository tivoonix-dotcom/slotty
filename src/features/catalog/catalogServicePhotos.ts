import { resolveCategoryWorkCode } from './categoryWorkPhotos';

/** Фото карточек блока «Все услуги» (`public/photos/каталог_услуги/`). Плитки категорий — `categoryWorkPhotos`. */
export const CATALOG_SERVICE_IMAGES = {
  manicure: '/photos/каталог_услуги/manicure.webp',
  barbers: '/photos/каталог_услуги/barbers.webp',
  brows_lashes: '/photos/каталог_услуги/brows_lashes.webp',
  massage: '/photos/каталог_услуги/massage.webp',
  fitness: '/photos/каталог_услуги/fitness.webp',
  tattoo: '/photos/каталог_услуги/tattoo.webp',
} as const;

export type CatalogServiceImageKey = keyof typeof CATALOG_SERVICE_IMAGES;

const CODE_TO_IMAGE_KEY: Record<string, CatalogServiceImageKey> = {
  manicure: 'manicure',
  barbers: 'barbers',
  'brows-lashes': 'brows_lashes',
  brows_lashes: 'brows_lashes',
  massage: 'massage',
  fitness: 'fitness',
  tattoo: 'tattoo',
};

function matchImageKeyByKeywords(text: string): CatalogServiceImageKey | null {
  const q = text.toLowerCase();
  if (/маникюр|ногт|педикюр|гель|наращивание ногт/.test(q)) return 'manicure';
  if (/барбер|стриж|бород|бритв|fade|барбершоп/.test(q)) return 'barbers';
  if (/бров|ресниц|ламинир|наращивание ресниц/.test(q)) return 'brows_lashes';
  if (/массаж|спа|релакс/.test(q)) return 'massage';
  if (/фитнес|трениров|йог|пилатес|спорт/.test(q)) return 'fitness';
  if (/тату|татуаж|пирсинг/.test(q)) return 'tattoo';
  return null;
}

function codeToImageKey(code: string): CatalogServiceImageKey {
  return (
    CODE_TO_IMAGE_KEY[code] ??
    CODE_TO_IMAGE_KEY[code.replace(/_/g, '-')] ??
    CODE_TO_IMAGE_KEY[code.replace(/-/g, '_')] ??
    'manicure'
  );
}

/** URL фото категории/услуги для клиентского каталога (код API, slug или русское название). */
export function getCatalogServicePhotoUrl(codeOrLabel: string | null | undefined): string {
  if (!codeOrLabel?.trim()) return CATALOG_SERVICE_IMAGES.manicure;

  const fromKeywords = matchImageKeyByKeywords(codeOrLabel);
  if (fromKeywords) return CATALOG_SERVICE_IMAGES[fromKeywords];

  const code = resolveCategoryWorkCode(codeOrLabel);
  const key = codeToImageKey(code);
  return CATALOG_SERVICE_IMAGES[key];
}
