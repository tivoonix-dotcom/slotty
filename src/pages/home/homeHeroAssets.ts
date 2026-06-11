const landingPhoto = (file: string) =>
  `/photos/${encodeURIComponent('лендинг')}/${encodeURIComponent(file)}`;

/** Декоративная волна в hero-блоке. */
export const HOME_HERO_LINE_SRC = landingPhoto('линия.png');

/** Логотипы партнёров под волной. */
export const HOME_HERO_BEPAID_SRC = landingPhoto('бипей.png');
export const HOME_HERO_TIVONIX_SRC = landingPhoto('тивоникс.png');

/** Фон кнопки «каталог». */
export const HOME_HERO_CATALOG_BTN_BG_SRC = `/photos/${encodeURIComponent('история')}/${encodeURIComponent('красный.png')}`;

/** Баннер «Мастер» после статистики hero. */
export const HOME_HERO_MASTER_BANNER_SRC = landingPhoto('мастер.png');
