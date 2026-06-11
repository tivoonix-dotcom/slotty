import type { CSSProperties } from 'react';

/** Соотношение сторон карточки услуги в каталоге (grid). */
export const CATALOG_SERVICE_CARD_ASPECT_CLASS = 'aspect-[4/3]';

export type ServiceCoverFocal = {
  focalX?: number | null;
  focalY?: number | null;
};

export function clampCoverFocal(value: number | null | undefined, fallback = 50): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function serviceCoverObjectPosition(focal?: ServiceCoverFocal): string {
  const x = clampCoverFocal(focal?.focalX);
  const y = clampCoverFocal(focal?.focalY);
  return `${x}% ${y}%`;
}

export function serviceCoverImageStyle(focal?: ServiceCoverFocal): CSSProperties {
  return {
    objectFit: 'cover',
    objectPosition: serviceCoverObjectPosition(focal),
  };
}
