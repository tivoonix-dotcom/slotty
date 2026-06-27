import { useEffect, useRef } from 'react';

/** Прокрутка окна в начало каталога (после смены категории / фильтров). */
export function scrollCatalogPageToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/**
 * Скролл вверх при изменении ключа (фильтры, категория, маршрут).
 * По умолчанию первый рендер пропускается; для смены URL включите scrollOnMount.
 */
export function useScrollCatalogToTopOnChange(
  key: string,
  options?: { scrollOnMount?: boolean },
) {
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      if (!options?.scrollOnMount) return;
    }
    scrollCatalogPageToTop();
  }, [key, options?.scrollOnMount]);
}
