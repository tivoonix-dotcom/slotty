/** Короткие SEO-вводные тексты для публичного каталога (естественные, без спама). */
export const SERVICES_CATALOG_INTRO =
  'Каталог услуг мастеров в Минске: сравнивайте цены, смотрите свободные окна и записывайтесь онлайн через SLOTTY — без звонков и переписок.';

const CATEGORY_INTRO: Record<string, string> = {
  manicure:
    'Маникюр в Минске: мастера с актуальным расписанием, цены и онлайн-запись в пару кликов через SLOTTY.',
  barbers:
    'Барберы в Минске: стрижки, борода и уход — выбирайте мастера по отзывам и свободному времени.',
  'brows-lashes':
    'Брови и ресницы в Минске: оформление, ламинирование и наращивание — запись онлайн без ожидания ответа в Direct.',
  massage:
    'Массаж в Минске: частные мастера и студии — свободные окна, цены и запись через SLOTTY.',
  fitness:
    'Фитнес-тренеры в Минске: персональные занятия и консультации — выберите удобное время онлайн.',
  tattoo:
    'Тату-мастера в Минске: портфолио, услуги и свободные окна для записи через SLOTTY.',
};

export function getCategorySeoIntro(categoryCode: string | null | undefined): string {
  if (!categoryCode?.trim()) return SERVICES_CATALOG_INTRO;
  return CATEGORY_INTRO[categoryCode.trim().toLowerCase()] ?? SERVICES_CATALOG_INTRO;
}
