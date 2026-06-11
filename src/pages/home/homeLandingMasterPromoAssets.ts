const landingPhoto = (file: string) =>
  `/photos/${encodeURIComponent('лендинг')}/${encodeURIComponent(file)}`;

export const HOME_MASTER_PROMO_PHOTO_SRC = landingPhoto('первоефотомасетра.png');

export const HOME_MASTER_PROMO_PHOTO_CLASS = 'h-auto w-auto max-w-[min(100%,767px)]';
