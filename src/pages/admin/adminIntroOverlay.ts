/** Равномерное затемнение под градиентом — светлые фото не «пробивают» текст. */
export const adminIntroScrimClass = 'bg-black/45';

/**
 * Тёмный градиент слева направо (без прозрачного края).
 * Лёгкий тёплый оттенок, приоритет — контраст для белого текста.
 */
export const adminIntroOverlayClass =
  'bg-gradient-to-r from-[#12060c]/95 via-[#1a0b12]/88 via-[45%] to-[#0a0508]/72';

/** Карточки акций: затемняем всё фото, текст всегда белый. */
export const promotionCardScrimClass = 'bg-black/50';

export const promotionCardOverlayClass =
  'bg-gradient-to-t from-black/88 via-black/62 to-black/40';
