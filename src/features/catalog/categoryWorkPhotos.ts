/** `public/photos/catalog-services/` — фото услуг по категории для каталога и лендинга. */
const CATALOG_SERVICES_PHOTOS_BASE = `/photos/catalog-services`;

export const CATEGORY_WORK_PHOTOS: Record<string, string> = {
  manicure: `${CATALOG_SERVICES_PHOTOS_BASE}/manicure.webp`,
  barbers: `${CATALOG_SERVICES_PHOTOS_BASE}/barbers.webp`,
  'brows-lashes': `${CATALOG_SERVICES_PHOTOS_BASE}/brows_lashes.webp`,
  brows_lashes: `${CATALOG_SERVICES_PHOTOS_BASE}/brows_lashes.webp`,
  massage: `${CATALOG_SERVICES_PHOTOS_BASE}/massage.webp`,
  fitness: `${CATALOG_SERVICES_PHOTOS_BASE}/fitness.webp`,
  tattoo: `${CATALOG_SERVICES_PHOTOS_BASE}/tattoo.webp`,
};

export function getCategoryWorkPhotoUrl(code: string | null | undefined): string {
  if (!code?.trim()) return CATEGORY_WORK_PHOTOS.manicure;
  const key = code.trim().toLowerCase();
  return (
    CATEGORY_WORK_PHOTOS[key] ??
    CATEGORY_WORK_PHOTOS[key.replace(/_/g, '-')] ??
    CATEGORY_WORK_PHOTOS[key.replace(/-/g, '_')] ??
    CATEGORY_WORK_PHOTOS.manicure
  );
}

const CATEGORY_LABEL_TO_CODE: Record<string, string> = {
  маникюр: 'manicure',
  ногти: 'manicure',
  барберы: 'barbers',
  барбер: 'barbers',
  стрижка: 'barbers',
  стрижки: 'barbers',
  борода: 'barbers',
  'брови и ресницы': 'brows-lashes',
  брови: 'brows-lashes',
  ресницы: 'brows-lashes',
  массаж: 'massage',
  фитнес: 'fitness',
  тренировки: 'fitness',
  тату: 'tattoo',
  татуировка: 'tattoo',
};

/** Код категории по slug из API или русскому названию («Маникюр» → `manicure`). */
export function resolveCategoryWorkCode(labelOrCode: string | null | undefined): string {
  if (!labelOrCode?.trim()) return 'manicure';
  const raw = labelOrCode.trim().toLowerCase();
  const candidates = [raw, raw.replace(/_/g, '-'), raw.replace(/-/g, '_'), raw.replace(/\s+/g, '-')];
  for (const c of candidates) {
    if (CATEGORY_WORK_PHOTOS[c]) {
      return c === 'brows_lashes' ? 'brows-lashes' : c.includes('_') ? c.replace(/_/g, '-') : c;
    }
  }
  const exact = CATEGORY_LABEL_TO_CODE[raw];
  if (exact) return exact;
  for (const [label, code] of Object.entries(CATEGORY_LABEL_TO_CODE)) {
    if (raw.includes(label)) return code;
  }
  return 'manicure';
}

