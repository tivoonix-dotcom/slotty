/** Фото плиток категорий: `public/photos/каталог_услуги/`. */
export const CATEGORY_WORK_PHOTOS: Record<string, string> = {
  manicure: '/photos/каталог_услуги/manicure.webp',
  barbers: '/photos/каталог_услуги/barbers.webp',
  'brows-lashes': '/photos/каталог_услуги/brows_lashes.webp',
  brows_lashes: '/photos/каталог_услуги/brows_lashes.webp',
  massage: '/photos/каталог_услуги/massage.webp',
  fitness: '/photos/каталог_услуги/fitness.webp',
  tattoo: '/photos/каталог_услуги/tattoo.webp',
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
