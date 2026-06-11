const landingPhoto = (file: string) =>
  `/photos/${encodeURIComponent('лендинг')}/${encodeURIComponent(file)}`;

export const HOME_LANDING_FEATURE_GREEN_SRC = landingPhoto('зеленый.png');
export const HOME_LANDING_FEATURE_BLUE_SRC = landingPhoto('голубой.png');
export const HOME_LANDING_FEATURE_RED_SRC = landingPhoto('красный.png');
