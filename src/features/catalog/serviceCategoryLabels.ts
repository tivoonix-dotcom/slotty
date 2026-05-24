/** Русские названия категорий (slug из API / URL). */
export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  manicure: 'Маникюр',
  barbers: 'Барберы',
  'brows-lashes': 'Брови и ресницы',
  massage: 'Массаж',
  fitness: 'Фитнес',
  tattoo: 'Тату',
};

/** Единый slug для URL и API: `brows_lashes` → `brows-lashes`. */
export function normalizeCategoryCode(code: string): string {
  return code.trim().toLowerCase().replace(/_/g, '-');
}

export function categoryCodesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  return normalizeCategoryCode(a) === normalizeCategoryCode(b);
}

export function isCategorySlug(value: string): boolean {
  const v = value.trim();
  if (!v || /[а-яё]/i.test(v)) return false;
  return /^[a-z0-9_-]+$/.test(v.toLowerCase());
}

export function getServiceCategoryLabel(
  code: string | null | undefined,
  categories?: ReadonlyArray<{ code: string; name: string }>,
): string {
  if (!code?.trim()) return 'Услуга';

  const fromApi = categories?.find((c) => categoryCodesMatch(c.code, code))?.name?.trim();
  if (fromApi) return fromApi;

  const normalized = normalizeCategoryCode(code);
  return SERVICE_CATEGORY_LABELS[normalized] ?? 'Услуга';
}
