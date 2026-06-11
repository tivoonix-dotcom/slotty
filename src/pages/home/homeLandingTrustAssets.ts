const landingPhoto = (file: string) =>
  `/photos/${encodeURIComponent('лендинг')}/${encodeURIComponent(file)}`;

/** Графика с иконками для блока «6 категорий». */
export const HOME_LANDING_TRUST_GRAPHIC_SRC = landingPhoto('низ.png');
