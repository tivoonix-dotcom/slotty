import { CATEGORY_WORK_PHOTOS, resolveCategoryWorkCode } from './categoryWorkPhotos';

/** Фото карточек услуг (`public/photos/catalog-services/`). */
export const CATALOG_SERVICE_IMAGES = {
  manicure: CATEGORY_WORK_PHOTOS.manicure,
  barbers: CATEGORY_WORK_PHOTOS.barbers,
  brows_lashes: CATEGORY_WORK_PHOTOS.brows_lashes,
  massage: CATEGORY_WORK_PHOTOS.massage,
  fitness: CATEGORY_WORK_PHOTOS.fitness,
  tattoo: CATEGORY_WORK_PHOTOS.tattoo,
} as const;

export type CatalogServiceImageKey = keyof typeof CATALOG_SERVICE_IMAGES;

const WORK_BASE = '/photos/work';
const LANDING_BASE = '/photos/landing/catalog';
const PLAN_BASE = '/photos/plan';

/** Несколько пулов на категорию — детерминированный выбор по id услуги/мастера. */
const CATEGORY_PHOTO_POOLS: Record<CatalogServiceImageKey, readonly string[]> = {
  manicure: [
    CATALOG_SERVICE_IMAGES.manicure,
    `${WORK_BASE}/manicure.webp`,
    `${LANDING_BASE}/manicure.webp`,
    `${PLAN_BASE}/manicure.webp`,
  ],
  barbers: [
    CATALOG_SERVICE_IMAGES.barbers,
    `${WORK_BASE}/barbers.webp`,
    `${LANDING_BASE}/barbers.webp`,
    `${PLAN_BASE}/barber.webp`,
  ],
  brows_lashes: [
    CATALOG_SERVICE_IMAGES.brows_lashes,
    `${WORK_BASE}/brows_lashes.webp`,
    `${LANDING_BASE}/brows.webp`,
    `${PLAN_BASE}/brows.webp`,
  ],
  massage: [
    CATALOG_SERVICE_IMAGES.massage,
    `${WORK_BASE}/massage.webp`,
    `${LANDING_BASE}/massage.webp`,
    `${PLAN_BASE}/massage.webp`,
  ],
  fitness: [
    CATALOG_SERVICE_IMAGES.fitness,
    `${WORK_BASE}/fitness.webp`,
    `${LANDING_BASE}/fitness.webp`,
    `${PLAN_BASE}/fitness.webp`,
  ],
  tattoo: [
    CATALOG_SERVICE_IMAGES.tattoo,
    `${WORK_BASE}/tattoo.webp`,
    `${LANDING_BASE}/tattoo.webp`,
    `${PLAN_BASE}/tattoo.webp`,
  ],
};

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

function stableHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function resolveImageKey(codeOrLabel: string | null | undefined): CatalogServiceImageKey {
  if (!codeOrLabel?.trim()) return 'manicure';
  const fromKeywords = matchImageKeyByKeywords(codeOrLabel);
  if (fromKeywords) return fromKeywords;
  const code = resolveCategoryWorkCode(codeOrLabel);
  return codeToImageKey(code);
}

/** Детерминированный выбор фото из пула категории. */
export function pickCatalogServicePhotoUrl(
  codeOrLabel: string | null | undefined,
  seed?: string | null,
): string {
  const key = resolveImageKey(codeOrLabel);
  const pool = CATEGORY_PHOTO_POOLS[key];
  if (!seed?.trim()) return pool[0];
  const index = stableHash(seed.trim()) % pool.length;
  return pool[index];
}

/** URL фото категории/услуги (без seed — первое из пула). */
export function getCatalogServicePhotoUrl(codeOrLabel: string | null | undefined): string {
  return pickCatalogServicePhotoUrl(codeOrLabel);
}

export type ServiceImageInput = {
  serviceCoverUrl?: string | null;
  categoryCode?: string | null;
  categoryName?: string | null;
  title?: string | null;
  serviceId?: string | null;
  masterId?: string | null;
};

/** Обложка карточки: backend → детерминированный stock по категории. */
export function getServiceImage(input: ServiceImageInput): string {
  const cover = input.serviceCoverUrl?.trim();
  if (cover) return cover;

  const label = input.categoryCode ?? input.categoryName ?? input.title ?? '';
  const seed = input.serviceId ?? input.masterId ?? undefined;
  return pickCatalogServicePhotoUrl(label, seed);
}

/** Обложка карточки услуги: фото категории из `каталог_услуги`, не аватар мастера. */
export function resolveServiceListingCoverUrl(listing: {
  category?: string | null;
  categoryCode?: string | null;
  serviceName?: string | null;
  id?: string | null;
  masterId?: string | null;
}): string {
  return getServiceImage({
    categoryCode: listing.categoryCode,
    categoryName: listing.category,
    title: listing.serviceName,
    serviceId: listing.id,
    masterId: listing.masterId,
  });
}
