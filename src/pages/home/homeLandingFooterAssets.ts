const landingPhoto = (file: string) =>
  `/photos/${encodeURIComponent('лендинг')}/${encodeURIComponent(file)}`;

/** Декоративный логотип в подвале лендинга (`public/photos/лендинг/slotty.png`). */
export const HOME_LANDING_FOOTER_LOGO_SRC = landingPhoto('slotty.png');
