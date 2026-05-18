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
