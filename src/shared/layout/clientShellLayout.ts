/** Десктоп-ширина клиентского каталога, bar-хедера SlottyHeader и лендинга (lg+). */
export const CLIENT_DESKTOP_SHELL_CLASS =
  'mx-auto w-full max-w-[1320px] px-6 xl:px-10';

/**
 * Каталог услуг/мастеров — те же боковые отступы и max-width, что у bar-хедера.
 */
export const CLIENT_CATALOG_DESKTOP_SHELL_CLASS =
  'mx-auto w-full max-w-[1320px] px-6 xl:px-10';

/** Bleed sticky-toolbar до краёв shell (см. `CLIENT_DESKTOP_SHELL_CLASS`). */
export const CLIENT_DESKTOP_SHELL_BLEED_CLASS = '-mx-6 xl:-mx-10';

export const CLIENT_DESKTOP_SHELL_BLEED_PAD_CLASS = 'px-6 xl:px-10';

/** Hero/фон каталога — на всю ширину viewport, даже внутри padded layout. */
export const CATALOG_HERO_FULL_BLEED_CLASS =
  'relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2';
