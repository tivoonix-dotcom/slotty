import { catalogHeroPhotoBg } from './catalogFilterSheetTheme';

/** Hero поиска каталога — `лендинг/заднийфон.png`, без розовой заливки поверх. */
export function CatalogHistoryPhotoBackdrop() {
  return (
    <img
      src={catalogHeroPhotoBg}
      alt=""
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      loading="eager"
      decoding="async"
    />
  );
}
