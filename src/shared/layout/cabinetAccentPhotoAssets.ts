const landingDir = `/photos/${encodeURIComponent('лендинг')}/`;

/** Фон активной вкладки «Мастер» (`public/photos/лендинг/мастер.png`). */
export const CABINET_ROLE_MASTER_TAB_BG = `${landingDir}${encodeURIComponent('мастер.png')}`;

/** Фон активной вкладки «Клиент» (`public/photos/лендинг/заднийфон.png`). */
export const CABINET_ROLE_CLIENT_TAB_BG = `${landingDir}${encodeURIComponent('заднийфон.png')}`;

/** Фон розовых акцент-кнопок: колокол, активный таб нижней панели. */
export const CABINET_ACCENT_BTN_BG = CABINET_ROLE_CLIENT_TAB_BG;
