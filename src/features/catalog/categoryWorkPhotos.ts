/** Фото категорий: `public/photos/work/` (как на главной и в онбординге). */
export const CATEGORY_WORK_PHOTOS: Record<string, string> = {
  manicure: '/photos/work/manicure.webp',
  barbers: '/photos/work/barbers.webp',
  'brows-lashes': '/photos/work/brows_lashes.webp',
  brows_lashes: '/photos/work/brows_lashes.webp',
  massage: '/photos/work/massage.webp',
  fitness: '/photos/work/fitness.webp',
  tattoo: '/photos/work/tattoo.webp',
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
