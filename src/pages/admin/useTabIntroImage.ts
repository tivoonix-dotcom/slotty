import { useEffect, useState } from 'react';

const cache = new Set<string>();

/** Прогрев кэша браузера для мгновенного переключения табов. */
export function preloadTabIntroImages(urls: readonly string[]): void {
  for (const src of urls) {
    if (!src || cache.has(src)) continue;
    const img = new Image();
    img.decoding = 'async';
    const mark = () => cache.add(src);
    img.onload = mark;
    img.onerror = mark;
    img.src = src;
  }
}

/**
 * Пока новое фото грузится — остаётся предыдущее (без пустого кадра при быстром переключении).
 */
export function useTabIntroImage(requestedSrc: string): string {
  const [displaySrc, setDisplaySrc] = useState(requestedSrc);

  useEffect(() => {
    if (requestedSrc === displaySrc) return;

    if (cache.has(requestedSrc)) {
      setDisplaySrc(requestedSrc);
      return;
    }

    let cancelled = false;
    const img = new Image();
    const apply = () => {
      if (cancelled) return;
      cache.add(requestedSrc);
      setDisplaySrc(requestedSrc);
    };
    img.onload = apply;
    img.onerror = apply;
    img.src = requestedSrc;

    return () => {
      cancelled = true;
    };
  }, [displaySrc, requestedSrc]);

  return displaySrc;
}
